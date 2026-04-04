/**
 * Builds a trimmed business patch from APE OCR review fields.
 * Output is persisted on OCR layers only; apply merges into `buildings` + `user_consumptions`.
 *
 * suspicious LPG: OCR marks `consumption_lpg` with suspiciousLpg. Exclude from this prefill unless
 * `confirmPass` is true (user submitted fields on /confirm — explicit acceptance).
 */

const CONSUMPTION_FIELD_TO_ENERGY = {
  consumption_electricity: 'Elettricità',
  consumption_natural_gas: 'Gas naturale',
  consumption_lpg: 'GPL',
  consumption_diesel: 'Gasolio',
};

function pickField(fields, key) {
  if (!Array.isArray(fields)) {
    return null;
  }
  return fields.find((f) => f && f.key === key) || null;
}

function includeLpgConsumption(field, { confirmPass }) {
  if (!field || field.key !== 'consumption_lpg') {
    return true;
  }
  const hasValue = field.normalizedValue != null && Number.isFinite(field.normalizedValue);
  if (!hasValue) {
    return false;
  }
  if (confirmPass) {
    return true;
  }
  // Do not auto-apply suspicious LPG from review/normalized paths (Batch 4 safety).
  return !field.suspiciousLpg;
}

/**
 * @param {object} opts
 * @param {number} opts.documentId
 * @param {Array<object>} opts.reviewFields
 * @param {boolean} [opts.confirmPass] — true when rebuilding from POST /confirm body
 */
function buildBuildingCertificationPrefill({ documentId, reviewFields, confirmPass = false }) {
  const patch = {
    ocr_document_id: Number.isInteger(Number(documentId)) ? Number(documentId) : null,
    building: {},
    consumptions: [],
  };

  const location = {};
  const details = {};

  const region = pickField(reviewFields, 'region');
  if (region?.normalizedValue) {
    location.region = region.normalizedValue;
  }

  const municipality = pickField(reviewFields, 'municipality');
  if (municipality?.normalizedValue) {
    location.municipality = municipality.normalizedValue;
  }

  const street = pickField(reviewFields, 'street');
  if (street?.normalizedValue) {
    location.street = street.normalizedValue;
  }

  const streetNumber = pickField(reviewFields, 'street_number');
  if (streetNumber?.normalizedValue) {
    location.streetNumber = streetNumber.normalizedValue;
  }

  const climate = pickField(reviewFields, 'climate_zone');
  if (climate?.normalizedValue) {
    location.climateZone = climate.normalizedValue;
  }

  const year = pickField(reviewFields, 'construction_year');
  if (year?.normalizedValue != null && Number.isInteger(year.normalizedValue)) {
    details.constructionYear = year.normalizedValue;
  }

  const useType = pickField(reviewFields, 'use_type');
  if (useType?.normalizedValue) {
    details.useType = useType.normalizedValue.slice(0, 50);
  }

  if (Object.keys(location).length) {
    patch.building.location = location;
  }
  if (Object.keys(details).length) {
    patch.building.details = details;
  }

  for (const [fieldKey, energySource] of Object.entries(CONSUMPTION_FIELD_TO_ENERGY)) {
    const field = pickField(reviewFields, fieldKey);
    if (!field) {
      continue;
    }
    if (fieldKey === 'consumption_lpg' && !includeLpgConsumption(field, { confirmPass })) {
      continue;
    }
    const n = field.normalizedValue;
    if (n == null || !Number.isFinite(n)) {
      continue;
    }
    patch.consumptions.push({
      energySource,
      consumption: n,
      plantId: null,
    });
  }

  return patch;
}

module.exports = {
  buildBuildingCertificationPrefill,
  CONSUMPTION_FIELD_TO_ENERGY,
};
