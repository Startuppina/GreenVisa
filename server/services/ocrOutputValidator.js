const ocrConfig = require('../config/ocr');

const CANONICAL_EURO_CLASSES = new Set([
  'EURO_1',
  'EURO_2',
  'EURO_3',
  'EURO_4',
  'EURO_5',
  'EURO_6',
  'EURO_6b',
  'EURO_6c',
  'EURO_6d',
  'EURO_6d_temp',
  'EURO_6e',
]);

const CANONICAL_FUEL_TYPES = new Set([
  'benzina',
  'diesel',
  'gpl',
  'metano',
  'metano_monovalente',
  'mild_hybrid',
  'full_hybrid',
  'plug_in_hybrid',
  'elettrico',
]);

const YES_VARIANTS = new Set(['si', 'sì', 'yes', 'true', '1', 'vero', 'y']);
const NO_VARIANTS = new Set(['no', 'false', '0', 'falso', 'n']);

function validateNormalizedOutput(fields) {
  const issues = [];

  for (const field of fields) {
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
    case 'registration_year': {
      const year = field.normalizedValue;
      const current = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1900 || year > current) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: `Anno "${field.value}" non è un anno valido (1900-${current})`,
        });
      }
      break;
    }

    case 'euro_class': {
      if (field.normalizedValue === null || !CANONICAL_EURO_CLASSES.has(field.normalizedValue)) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Classe Euro "${field.value}" non riconosciuta`,
        });
      }
      break;
    }

    case 'fuel_type': {
      if (field.normalizedValue === null || !CANONICAL_FUEL_TYPES.has(field.normalizedValue)) {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Tipo carburante "${field.value}" non riconosciuto`,
        });
      }
      break;
    }

    case 'wltp_homologation': {
      if (typeof field.normalizedValue !== 'boolean') {
        issues.push({
          fieldKey: field.key,
          type: 'unrecognized_value',
          message: `Valore WLTP "${field.value}" non riconosciuto (atteso: si/no).`,
        });
      }
      break;
    }

    case 'vehicle_mass_kg': {
      if (field.normalizedValue === null || field.normalizedValue <= 0) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_format',
          message: `Massa veicolo "${field.value}" non riconosciuta come peso in kg.`,
        });
      }
      break;
    }
  }

  return issues;
}

function applyNormalizations(fields) {
  return fields.map((field) => {
    const copy = { ...field };
    copy.value = normalizeDisplayValue(field.value);
    copy.normalizedValue = normalizeFieldValue(field.key, copy.value);
    copy.warnings = buildFieldWarnings(copy);

    return copy;
  });
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

function normalizeFieldValue(fieldKey, value) {
  switch (fieldKey) {
    case 'registration_year':
      return normalizeRegistrationYear(value);
    case 'euro_class':
      return normalizeEuroClass(value);
    case 'fuel_type':
      return normalizeFuelType(value);
    case 'wltp_homologation':
    case 'goods_vehicle_over_3_5_tons':
      return normalizeYesNo(value);
    case 'vehicle_mass_kg':
      return normalizeMassKg(value);
    default:
      return normalizeDisplayValue(value);
  }
}

function normalizeRegistrationYear(value) {
  if (value == null) {
    return null;
  }

  const digits = String(value).match(/\b(19\d{2}|20\d{2})\b/);
  if (!digits) {
    return null;
  }

  return Number.parseInt(digits[1], 10);
}

function normalizeEuroClass(value) {
  if (value == null) {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const compact = raw
    .toLowerCase()
    .replace(/classe/g, '')
    .replace(/class/g, '')
    .replace(/euro/g, '')
    .replace(/[^a-z0-9]+/g, '');

  if (!compact) {
    return null;
  }

  if (compact === '5a' || compact === '5b' || compact === '5') {
    return 'EURO_5';
  }

  const euroMap = {
    '1': 'EURO_1',
    '2': 'EURO_2',
    '3': 'EURO_3',
    '4': 'EURO_4',
    '5': 'EURO_5',
    '6': 'EURO_6',
    '6b': 'EURO_6b',
    '6c': 'EURO_6c',
    '6d': 'EURO_6d',
    '6dtemp': 'EURO_6d_temp',
    '6temp': 'EURO_6d_temp',
    '6e': 'EURO_6e',
  };

  return euroMap[compact] || null;
}

function normalizeFuelType(value) {
  if (value == null) {
    return null;
  }

  const raw = String(value).trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const compact = raw.replace(/[^a-z0-9]+/g, ' ').trim();

  if (compact.includes('plug') || compact.includes('phev')) {
    return 'plug_in_hybrid';
  }

  if (compact.includes('mild')) {
    return 'mild_hybrid';
  }

  if (
    compact === 'ibrido' ||
    compact.includes('full hybrid') ||
    compact.includes('hybrid') ||
    compact.includes('ibrido benzina') ||
    compact.includes('ibrido diesel')
  ) {
    return 'full_hybrid';
  }

  if (compact.includes('metano') && compact.includes('monovalente')) {
    return 'metano_monovalente';
  }

  if (compact === 'metano' || compact.includes('cng') || compact.includes('natural gas')) {
    return 'metano';
  }

  if (compact === 'gpl' || compact.includes('lpg')) {
    return 'gpl';
  }

  if (compact === 'diesel' || compact === 'gasolio') {
    return 'diesel';
  }

  if (compact === 'benzina' || compact === 'gasoline' || compact === 'petrol') {
    return 'benzina';
  }

  if (compact === 'elettrico' || compact === 'electric' || compact === 'bev') {
    return 'elettrico';
  }

  return null;
}

function normalizeMassKg(value) {
  if (value == null) {
    return null;
  }

  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return parsed > 0 ? parsed : null;
}

function normalizeYesNo(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const lower = String(value).trim().toLowerCase();
  if (!lower) {
    return null;
  }

  if (YES_VARIANTS.has(lower)) {
    return true;
  }

  if (NO_VARIANTS.has(lower)) {
    return false;
  }

  return null;
}

function normalizeDisplayValue(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

module.exports = {
  applyNormalizations,
  normalizeFieldValue,
  normalizeFuelType,
  normalizeYesNo,
  validateNormalizedOutput,
};
