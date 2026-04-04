/**
 * Build a safe `building_certification_prefill` patch from normalized APE OCR review fields.
 * Excludes invalid / low-confidence values and GPL rows flagged as suspected false positives.
 */

function fieldKeyExcludedFromPrefill(issue) {
  if (!issue?.fieldKey) return false;
  return (
    issue.type === 'invalid_enum' ||
    issue.type === 'parse_error' ||
    issue.type === 'invalid_number' ||
    issue.type === 'low_confidence'
  );
}

/**
 * When `gplUserAccepted` is true (review confirm path), the user explicitly submits GPL for inclusion;
 * do not auto-strip it because of `suspected_false_positive` — that warning is informational only after confirm.
 */
function shouldExcludeGplFromPrefill(validationIssues, { gplUserAccepted = false } = {}) {
  if (gplUserAccepted) return false;
  return (validationIssues || []).some(
    (i) => i.fieldKey === 'consumptions.gpl.amount' && i.type === 'suspected_false_positive',
  );
}

/**
 * @param {object} params
 * @param {number} [params.documentId]
 * @param {Array} [params.reviewFields]
 * @param {Array} [params.validationIssues]
 * @returns {object}
 */
function buildBuildingCertificationPrefill({
  documentId: _documentId,
  reviewFields = [],
  validationIssues = [],
  /** @type {boolean} Set true when persisting user-confirmed APE fields (Batch 4 confirm). */
  gplUserAccepted = false,
} = {}) {
  const invalidKeys = new Set();
  for (const issue of validationIssues || []) {
    if (fieldKeyExcludedFromPrefill(issue)) invalidKeys.add(issue.fieldKey);
  }

  const excludeGpl = shouldExcludeGplFromPrefill(validationIssues, { gplUserAccepted });

  const prefill = {
    building: {
      location: {},
      details: {},
    },
    consumptions: [],
  };

  const setIfValid = (fieldKey, value, apply) => {
    if (invalidKeys.has(fieldKey)) return;
    if (value === null || value === undefined || value === '') return;
    apply(value);
  };

  for (const f of reviewFields) {
    const nv = f.normalizedValue;
    switch (f.key) {
      case 'building.location.region':
        setIfValid(f.key, nv, (v) => {
          prefill.building.location.region = v;
        });
        break;
      case 'building.location.municipality':
        setIfValid(f.key, nv, (v) => {
          prefill.building.location.municipality = v;
        });
        break;
      case 'building.location.street':
        setIfValid(f.key, nv, (v) => {
          prefill.building.location.street = v;
        });
        break;
      case 'building.location.streetNumber':
        setIfValid(f.key, nv, (v) => {
          prefill.building.location.streetNumber = v;
        });
        break;
      case 'building.location.climateZone':
        setIfValid(f.key, nv, (v) => {
          prefill.building.location.climateZone = v;
        });
        break;
      case 'building.details.constructionYear':
        setIfValid(f.key, nv, (v) => {
          prefill.building.details.constructionYear = v;
        });
        break;
      case 'building.details.useType':
        setIfValid(f.key, nv, (v) => {
          prefill.building.details.useType = v;
        });
        break;
      default:
        break;
    }
  }

  const pushConsumption = (energySource, f) => {
    if (invalidKeys.has(f.key)) return;
    if (energySource === 'gpl' && excludeGpl) return;
    const c = f.normalizedValue;
    if (!c || typeof c !== 'object' || !Number.isFinite(c.amount)) return;
    prefill.consumptions.push({
      energySource,
      amount: c.amount,
      plantId: null,
    });
  };

  for (const f of reviewFields) {
    if (f.key === 'consumptions.electricity.amount') pushConsumption('electricity', f);
    if (f.key === 'consumptions.natural_gas.amount') pushConsumption('natural_gas', f);
    if (f.key === 'consumptions.gpl.amount') pushConsumption('gpl', f);
  }

  return prefill;
}

module.exports = {
  buildBuildingCertificationPrefill,
  shouldExcludeGplFromPrefill,
};
