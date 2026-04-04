/**
 * Apply APE OCR `building_certification_prefill` into persisted `buildings` + `user_consumptions`.
 * Only OCR-managed columns are updated; other building fields are preserved.
 * Consumption rows are upserted by (user_id, building_id, energy_source) for building-level aggregates.
 */

const pool = require('../../db');

/** Matches client `userBuldingsPageAdmin` / `reportPage` energy labels. */
const ENERGY_SOURCE_LABEL = {
  electricity: 'Elettricità',
  natural_gas: 'Gas Naturale (Metano)',
  gpl: 'GPL',
};

class BuildingCertificationOcrApplyError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'BuildingCertificationOcrApplyError';
    this.statusCode = statusCode;
  }
}

function deriveConstructionYearLabel(constructionYearValue, fallbackYear = '') {
  const yearNumber = Number(constructionYearValue);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) {
    return fallbackYear || null;
  }
  if (yearNumber < 1976) return 'Prima del 1976';
  if (yearNumber <= 1991) return 'Tra 1976 e 1991';
  if (yearNumber <= 2004) return 'Tra 1991 e 2004';
  return 'Dopo il 2004';
}

function composeLegacyBuildingAddress({
  address,
  street,
  streetNumber,
  municipality,
  cap,
  location,
  country,
}) {
  const lineOne = [street, streetNumber].filter(Boolean).join(', ');
  const lineTwo = [cap, municipality].filter(Boolean).join(' ');
  const lineThree = [location, country].filter(Boolean).join(', ');
  const composed = [lineOne, lineTwo, lineThree].filter(Boolean).join(' - ').trim();
  return composed || address || '';
}

/** Title-case region for UI / REGION_OPTIONS alignment (e.g. TOSCANA → Toscana). */
function formatRegionForUi(region) {
  if (region == null || region === '') return null;
  const s = String(region).trim();
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function mapUseTypeToUsage(useType) {
  if (useType === 'residential') return 'Residenziale';
  if (useType === 'non_residential') return 'Non residenziale';
  if (useType === 'other') return 'Altro';
  return String(useType);
}

/**
 * Merge canonical prefill.building into an existing DB row shape (snake_case columns).
 * @param {object} existing — row from `SELECT * FROM buildings`
 * @param {object} prefill — `building_certification_prefill`
 * @returns {object} patch object with only defined overrides for SQL SET
 */
function mergeBuildingRowFromPrefill(existing, prefill) {
  if (!existing || !prefill?.building) return { updates: {}, mergedRow: existing };

  const loc = prefill.building.location || {};
  const det = prefill.building.details || {};
  const updates = {};

  let region = existing.region;
  let locationCol = existing.location;
  let municipality = existing.municipality;
  let street = existing.street;
  let streetNumber = existing.street_number;
  let climateZone = existing.climate_zone;
  let constructionYearValue = existing.construction_year_value;
  let constructionYear = existing.construction_year;
  let usage = existing.usage;

  if (loc.region != null && loc.region !== '') {
    const r = formatRegionForUi(loc.region);
    region = r;
    locationCol = r;
    updates.region = r;
    updates.location = r;
  }
  if (loc.municipality != null && loc.municipality !== '') {
    municipality = loc.municipality;
    updates.municipality = loc.municipality;
  }
  if (loc.street != null && loc.street !== '') {
    street = loc.street;
    updates.street = loc.street;
  }
  if (loc.streetNumber != null && loc.streetNumber !== '') {
    streetNumber = loc.streetNumber;
    updates.street_number = loc.streetNumber;
  }
  if (loc.climateZone != null && loc.climateZone !== '') {
    climateZone = loc.climateZone;
    updates.climate_zone = loc.climateZone;
  }
  if (det.constructionYear != null && Number.isFinite(Number(det.constructionYear))) {
    const y = Number(det.constructionYear);
    constructionYearValue = y;
    constructionYear = deriveConstructionYearLabel(y, existing.construction_year);
    updates.construction_year_value = y;
    updates.construction_year = constructionYear;
  }
  if (det.useType != null && det.useType !== '') {
    usage = mapUseTypeToUsage(det.useType);
    updates.usage = usage;
  }

  const address = composeLegacyBuildingAddress({
    address: existing.address,
    street,
    streetNumber,
    municipality,
    cap: existing.cap,
    location: locationCol,
    country: existing.country,
  });
  if (Object.keys(updates).length > 0) {
    updates.address = address;
  }

  const mergedRow = {
    ...existing,
    ...updates,
  };

  return { updates, mergedRow };
}

async function getBuildingLockState(userId, buildingId) {
  const result = await pool.query('SELECT id, results_visible FROM buildings WHERE id = $1 AND user_id = $2', [
    buildingId,
    userId,
  ]);
  if (result.rows.length === 0) return { found: false, locked: false };
  return { found: true, locked: Boolean(result.rows[0].results_visible) };
}

/**
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.buildingId
 * @param {object} params.prefill — `building_certification_prefill`
 */
async function applyBuildingCertificationOcrPrefill({ userId, buildingId, prefill }) {
  if (!prefill || typeof prefill !== 'object') {
    throw new BuildingCertificationOcrApplyError(400, 'Prefill OCR edilizia mancante o non valido.');
  }

  const state = await getBuildingLockState(userId, buildingId);
  if (!state.found) {
    throw new BuildingCertificationOcrApplyError(404, 'Edificio non trovato');
  }
  if (state.locked) {
    throw new BuildingCertificationOcrApplyError(403, 'Edificio finalizzato: modifiche non consentite');
  }

  const { rows } = await pool.query('SELECT * FROM buildings WHERE id = $1 AND user_id = $2', [buildingId, userId]);
  const existing = rows[0];
  if (!existing) {
    throw new BuildingCertificationOcrApplyError(404, 'Edificio non trovato');
  }

  const { updates } = mergeBuildingRowFromPrefill(existing, prefill);

  if (Object.keys(updates).length > 0) {
    const keys = Object.keys(updates);
    const setClause = keys.map((k, i) => `"${k}" = $${i + 3}`).join(', ');
    const values = keys.map((k) => updates[k]);
    await pool.query(`UPDATE buildings SET ${setClause} WHERE id = $1 AND user_id = $2`, [
      buildingId,
      userId,
      ...values,
    ]);
  }

  for (const row of prefill.consumptions || []) {
    if (!row || row.plantId != null) continue;
    const label = ENERGY_SOURCE_LABEL[row.energySource];
    if (!label || !Number.isFinite(Number(row.amount))) continue;

    const amount = Number(row.amount);
    const sel = await pool.query(
      'SELECT id FROM user_consumptions WHERE user_id = $1 AND building_id = $2 AND energy_source = $3',
      [userId, buildingId, label],
    );
    if (sel.rows.length > 0) {
      await pool.query(
        'UPDATE user_consumptions SET consumption = $1 WHERE id = $2 AND user_id = $3 AND building_id = $4',
        [amount, sel.rows[0].id, userId, buildingId],
      );
    } else {
      await pool.query(
        'INSERT INTO user_consumptions (user_id, building_id, energy_source, consumption) VALUES ($1, $2, $3, $4)',
        [userId, buildingId, label, amount],
      );
    }
  }

  const buildingRes = await pool.query('SELECT * FROM buildings WHERE id = $1 AND user_id = $2', [buildingId, userId]);
  const consRes = await pool.query('SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2 ORDER BY id', [
    userId,
    buildingId,
  ]);

  return {
    building: buildingRes.rows[0] || null,
    consumptions: consRes.rows || [],
  };
}

module.exports = {
  applyBuildingCertificationOcrPrefill,
  BuildingCertificationOcrApplyError,
  mergeBuildingRowFromPrefill,
  formatRegionForUi,
  mapUseTypeToUsage,
  ENERGY_SOURCE_LABEL,
};
