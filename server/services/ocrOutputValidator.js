const ocrConfig = require('../config/ocr');

const KNOWN_FUEL_TYPES = new Set([
  'benzina', 'diesel', 'gpl', 'metano', 'ibrido', 'elettrico',
  'ibrido benzina', 'ibrido diesel', 'bifuel', 'idrogeno',
]);

const KNOWN_EURO_CLASSES = new Set([
  'euro 1', 'euro 2', 'euro 3', 'euro 4',
  'euro 5', 'euro 5a', 'euro 5b',
  'euro 6', 'euro 6b', 'euro 6c', 'euro 6d', 'euro 6d-temp', 'euro 6e',
]);

const YES_VARIANTS = new Set(['si', 'sì', 'yes', 'true', '1', 'vero']);
const NO_VARIANTS  = new Set(['no', 'false', '0', 'falso']);

function normalizeYesNo(value) {
  if (!value) return null;
  const lower = value.toString().trim().toLowerCase();
  if (YES_VARIANTS.has(lower)) return 'Sì';
  if (NO_VARIANTS.has(lower)) return 'No';
  return null;
}

// ── Post-extraction validation ────────────────────────────────

function validateNormalizedOutput(fields) {
  const issues = [];

  for (const field of fields) {
    if (field.required && (field.value === null || field.value === '')) {
      issues.push({
        fieldKey: field.key,
        type: 'missing_required',
        message: `${field.label} è obbligatorio ma non è stato estratto`,
      });
      continue;
    }

    if (field.value !== null && field.confidence < ocrConfig.confidence.lowThreshold) {
      issues.push({
        fieldKey: field.key,
        type: 'low_confidence',
        message: `${field.label}: confidenza bassa (${Math.round(field.confidence * 100)}%)`,
      });
    }

    if (field.value !== null && field.value !== '') {
      issues.push(...validateFieldValue(field));
    }
  }

  return issues;
}

function validateFieldValue(field) {
  const issues = [];

  switch (field.key) {
    case 'registrationYear': {
      const year = parseInt(field.value, 10);
      const current = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > current + 1) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: `Anno "${field.value}" non è un anno valido (1900–${current + 1})`,
        });
      }
      break;
    }

    case 'euroClass': {
      if (!KNOWN_EURO_CLASSES.has(field.value.toString().trim().toLowerCase())) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Classe Euro "${field.value}" non riconosciuta`,
        });
      }
      break;
    }

    case 'fuelType': {
      if (!KNOWN_FUEL_TYPES.has(field.value.toString().trim().toLowerCase())) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Tipo carburante "${field.value}" non riconosciuto`,
        });
      }
      break;
    }

    case 'wltpHomologation': {
      if (normalizeYesNo(field.value) === null) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Valore WLTP "${field.value}" non riconosciuto (atteso: Sì/No)`,
        });
      }
      break;
    }

    case 'goodsVehicleOver2_5Tons': {
      if (field.value !== null && field.value !== '' && normalizeYesNo(field.value) === null) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Valore "${field.value}" non riconosciuto (atteso: Sì/No)`,
        });
      }
      break;
    }
  }

  return issues;
}

// ── Value normalization pass ──────────────────────────────────

function applyNormalizations(fields) {
  return fields.map((field) => {
    const copy = { ...field };

    switch (field.key) {
      case 'wltpHomologation':
      case 'goodsVehicleOver2_5Tons': {
        const n = normalizeYesNo(field.value);
        if (n !== null) copy.value = n;
        break;
      }
      case 'euroClass': {
        if (field.value) {
          const v = field.value.toString().trim();
          copy.value = v.charAt(0).toUpperCase() + v.slice(1);
        }
        break;
      }
      case 'fuelType': {
        if (field.value) {
          const v = field.value.toString().trim();
          copy.value = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
        }
        break;
      }
    }

    return copy;
  });
}

module.exports = { validateNormalizedOutput, applyNormalizations, normalizeYesNo };
