const ocrConfig = require('../../config/ocr');

const REGION_OPTIONS = new Set([
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
]);

const CLIMATE_ZONE = new Set(['A', 'B', 'C', 'D', 'E', 'F']);

function normalizeDisplayValue(value) {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeConstructionYear(value) {
  if (value == null) {
    return null;
  }
  const digits = String(value).match(/\b(19\d{2}|20\d{2})\b/);
  if (!digits) {
    return null;
  }
  return Number.parseInt(digits[1], 10);
}

function normalizeClimateZone(value) {
  const raw = normalizeDisplayValue(value);
  if (!raw) {
    return null;
  }
  const letter = raw.toUpperCase().replace(/[^A-F]/g, '').slice(0, 1);
  return letter && CLIMATE_ZONE.has(letter) ? letter : null;
}

function normalizeConsumptionNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 0 ? value : null;
  }
  const raw = String(value).trim().replace(/\s+/g, '').replace(',', '.');
  if (!raw) {
    return null;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function buildFieldWarnings(field) {
  const warnings = [];
  if (field.value !== null && field.confidence < ocrConfig.confidence.lowThreshold) {
    warnings.push({
      code: 'low_confidence',
      message: `${field.label}: confidenza bassa (${Math.round(field.confidence * 100)}%).`,
      confidence: field.confidence,
    });
  }
  if (field.value !== null && field.value !== '' && field.normalizedValue === null) {
    warnings.push({
      code: 'manual_check_required',
      message: `${field.label}: valore da verificare manualmente.`,
      confidence: field.confidence,
    });
  }
  return warnings;
}

function normalizeApeFieldValue(fieldKey, value) {
  switch (fieldKey) {
    case 'construction_year':
      return normalizeConstructionYear(value);
    case 'climate_zone':
      return normalizeClimateZone(value);
    case 'consumption_electricity':
    case 'consumption_natural_gas':
    case 'consumption_lpg':
    case 'consumption_diesel':
      return normalizeConsumptionNumber(value);
    default:
      return normalizeDisplayValue(value);
  }
}

/**
 * @param {Array<object>} fields
 * @returns {Array<object>}
 */
function applyApeNormalizations(fields) {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.map((field) => {
    const copy = { ...field };
    copy.value = normalizeDisplayValue(field.value);
    copy.normalizedValue = normalizeApeFieldValue(field.key, copy.value);
    copy.warnings = buildFieldWarnings(copy);
    return copy;
  });
}

function validateApeFieldValue(field) {
  const issues = [];
  switch (field.key) {
    case 'region': {
      if (field.normalizedValue && !REGION_OPTIONS.has(field.normalizedValue)) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Regione "${field.value}" non è nella lista standard (verificare ortografia).`,
        });
      }
      break;
    }
    case 'construction_year': {
      const y = field.normalizedValue;
      const current = new Date().getFullYear();
      if (y !== null && (!Number.isInteger(y) || y < 1800 || y > current)) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: `Anno di costruzione "${field.value}" non valido.`,
        });
      }
      break;
    }
    case 'use_type': {
      if (field.normalizedValue && field.normalizedValue.length > 50) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: "Destinazione d'uso supera 50 caratteri.",
        });
      }
      break;
    }
    case 'consumption_electricity':
    case 'consumption_natural_gas':
    case 'consumption_lpg':
    case 'consumption_diesel': {
      const n = field.normalizedValue;
      if (field.value !== null && field.value !== '' && (n === null || !Number.isFinite(n))) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: `Consumo "${field.value}" non è un numero valido.`,
        });
      }
      break;
    }
    default:
      break;
  }
  return issues;
}

/**
 * @param {Array<object>} fields
 * @returns {Array<object>}
 */
function validateApeNormalizedOutput(fields) {
  const issues = [];
  if (!Array.isArray(fields)) {
    return issues;
  }
  for (const field of fields) {
    if (!field) {
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
      issues.push(...validateApeFieldValue(field));
    }
  }
  return issues;
}

module.exports = {
  applyApeNormalizations,
  validateApeNormalizedOutput,
  normalizeApeFieldValue,
  REGION_OPTIONS,
};
