const pool = require('../../db');

class BuildingCertificationOcrHttpError extends Error {
  constructor(statusCode, message, extras = {}) {
    super(message);
    this.name = 'BuildingCertificationOcrHttpError';
    this.statusCode = statusCode;
    this.extras = extras;
  }
}

function deriveConstructionYearLabel(constructionYearValue, fallbackYear = '') {
  const yearNumber = Number(constructionYearValue);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) {
    return fallbackYear || null;
  }
  if (yearNumber < 1976) {
    return 'Prima del 1976';
  }
  if (yearNumber <= 1991) {
    return 'Tra 1976 e 1991';
  }
  if (yearNumber <= 2004) {
    return 'Tra 1991 e 2004';
  }
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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
}

/**
 * Deep merge only OCR-managed keys present in `prefillPatch`.
 * No OCR metadata is written to the database.
 *
 * @param {object} prefillPatch — from `buildBuildingCertificationPrefill`
 */
async function applyBuildingCertificationOcrPatch({ userId, buildingId, prefillPatch }) {
  const uid = Number(userId);
  const bid = Number(buildingId);
  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(bid) || bid <= 0) {
    throw new BuildingCertificationOcrHttpError(400, 'Identificativi utente o edificio non validi.');
  }

  if (!prefillPatch || typeof prefillPatch !== 'object') {
    throw new BuildingCertificationOcrHttpError(400, 'Prefill OCR non valido.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: buildingRows } = await client.query(
      'SELECT * FROM buildings WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [bid, uid],
    );
    const existing = buildingRows[0];
    if (!existing) {
      throw new BuildingCertificationOcrHttpError(404, 'Edificio non trovato.');
    }
    if (existing.results_visible) {
      throw new BuildingCertificationOcrHttpError(403, 'Edificio finalizzato: modifiche non consentite.');
    }

    const loc = prefillPatch.building?.location;
    const det = prefillPatch.building?.details;

    let nextRegion = existing.region;
    let nextMunicipality = existing.municipality;
    let nextStreet = existing.street;
    let nextStreetNumber = existing.street_number;
    let nextClimate = existing.climate_zone;
    let nextConstructionValue = existing.construction_year_value;
    let nextUsage = existing.usage;

    if (loc && typeof loc === 'object') {
      if (loc.region != null && String(loc.region).trim() !== '') {
        nextRegion = String(loc.region).trim();
      }
      if (loc.municipality != null && String(loc.municipality).trim() !== '') {
        nextMunicipality = String(loc.municipality).trim();
      }
      if (loc.street != null && String(loc.street).trim() !== '') {
        nextStreet = String(loc.street).trim();
      }
      if (loc.streetNumber != null && String(loc.streetNumber).trim() !== '') {
        nextStreetNumber = String(loc.streetNumber).trim();
      }
      if (loc.climateZone != null && String(loc.climateZone).trim() !== '') {
        nextClimate = String(loc.climateZone).trim().toUpperCase();
      }
    }

    if (det && typeof det === 'object') {
      if (det.constructionYear != null && Number.isFinite(Number(det.constructionYear))) {
        nextConstructionValue = Math.trunc(Number(det.constructionYear));
      }
      if (det.useType != null && String(det.useType).trim() !== '') {
        nextUsage = String(det.useType).trim().slice(0, 50);
      }
    }

    const hasLocationPatch = loc && Object.keys(loc).length > 0;
    const hasDetailsPatch = det && Object.keys(det).length > 0;

    const nextLocationLabel = firstNonEmpty(nextRegion, existing.location);
    const nextConstructionLabel = deriveConstructionYearLabel(
      nextConstructionValue,
      existing.construction_year || '',
    );

    const nextAddress = composeLegacyBuildingAddress({
      address: existing.address,
      street: nextStreet,
      streetNumber: nextStreetNumber,
      municipality: nextMunicipality,
      cap: existing.cap,
      location: nextLocationLabel,
      country: firstNonEmpty(existing.country, 'Italia'),
    });

    if (hasLocationPatch || hasDetailsPatch) {
      await client.query(
        `UPDATE buildings SET
          region = $1,
          location = $2,
          municipality = $3,
          street = $4,
          street_number = $5,
          climate_zone = $6,
          construction_year_value = $7,
          construction_year = $8,
          usage = $9,
          address = $10
         WHERE id = $11 AND user_id = $12`,
        [
          nextRegion,
          nextLocationLabel,
          nextMunicipality,
          nextStreet,
          nextStreetNumber,
          nextClimate,
          nextConstructionValue,
          nextConstructionLabel,
          nextUsage,
          nextAddress,
          bid,
          uid,
        ],
      );
    }

    const consumptions = Array.isArray(prefillPatch.consumptions) ? prefillPatch.consumptions : [];
    for (const row of consumptions) {
      if (!row || row.plantId != null) {
        continue;
      }
      const energySource = row.energySource != null ? String(row.energySource).trim() : '';
      const consumption = row.consumption;
      if (!energySource || consumption == null || !Number.isFinite(Number(consumption))) {
        continue;
      }
      const consNum = Number(consumption);
      const upd = await client.query(
        `UPDATE user_consumptions
         SET consumption = $1
         WHERE user_id = $2 AND building_id = $3 AND energy_source = $4`,
        [consNum, uid, bid, energySource],
      );
      if (upd.rowCount === 0) {
        await client.query(
          `INSERT INTO user_consumptions (user_id, building_id, energy_source, consumption)
           VALUES ($1, $2, $3, $4)`,
          [uid, bid, energySource, consNum],
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows: bRows } = await pool.query('SELECT * FROM buildings WHERE id = $1 AND user_id = $2', [
    bid,
    uid,
  ]);
  const { rows: cRows } = await pool.query(
    'SELECT * FROM user_consumptions WHERE building_id = $1 AND user_id = $2 ORDER BY id',
    [bid, uid],
  );

  return {
    buildingId: bid,
    building: bRows[0] || null,
    consumptions: cRows,
  };
}

module.exports = {
  applyBuildingCertificationOcrPatch,
  BuildingCertificationOcrHttpError,
  deriveConstructionYearLabel,
  composeLegacyBuildingAddress,
};
