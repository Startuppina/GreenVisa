const ocrConfig = require('../../config/ocr');

const VALID_CLIMATE_ZONES = new Set(['A', 'B', 'C', 'D', 'E', 'F']);

const CONSUMPTION_FIELD_KEYS = new Set([
  'consumptions.electricity.amount',
  'consumptions.natural_gas.amount',
  'consumptions.gpl.amount',
]);

/**
 * Parse strings like `4130.84 kWh`, `2000 m3`, `2000 m³`, `4130,84 kWh`.
 *
 * @returns {{ ok: true, amount: number, unit: string } | { ok: false, code: string }}
 */
function parseConsumptionText(raw) {
  if (raw == null) return { ok: false, code: 'parse_error' };
  let s = String(raw).trim().replace(/\s+/g, ' ');
  if (!s) return { ok: false, code: 'parse_error' };

  s = s.replace(/m³/gi, 'm3').replace(/\u00b3/g, '3');

  const m = s.match(/^(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z0-9²³/^]+)?\s*$/i);
  if (!m) return { ok: false, code: 'parse_error' };

  let numPart = m[1];
  if (numPart.includes(',') && !numPart.includes('.')) {
    numPart = numPart.replace(',', '.');
  }
  const amount = Number(numPart);
  if (!Number.isFinite(amount)) return { ok: false, code: 'parse_error' };
  if (amount < 0) return { ok: false, code: 'negative_amount', amount };

  let unitRaw = (m[2] || '').trim().toLowerCase();
  if (!unitRaw) return { ok: false, code: 'parse_error' };

  let unit;
  if (unitRaw === 'kwh' || unitRaw.startsWith('kwh')) unit = 'kWh';
  else if (unitRaw === 'm3' || unitRaw === 'm^3') unit = 'm3';
  else return { ok: false, code: 'parse_error' };

  return { ok: true, amount, unit };
}

function normalizeUseType(raw) {
  const t = String(raw ?? '')
    .toLowerCase()
    .trim();
  if (!t) return 'other';
  if (t.includes('non') && t.includes('residenz')) return 'non_residential';
  if (t.includes('residenz')) return 'residential';
  return 'other';
}

function normalizeConstructionYearField(field) {
  let y = field.providerIntegerValue;
  if (y == null) {
    const m = String(field.value ?? '').match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    y = m ? parseInt(m[1], 10) : null;
  }
  field.normalizedValue = y;
}

function applyApeNormalizations(fields) {
  if (!Array.isArray(fields)) return [];

  return fields.map((field) => {
    const f = { ...field };
    const { key } = f;

    if (key === 'building.location.region') {
      f.normalizedValue = String(f.value ?? '').trim();
      return f;
    }

    if (key === 'building.location.municipality' || key === 'building.location.street') {
      f.normalizedValue = String(f.value ?? '').trim();
      return f;
    }

    if (key === 'building.location.streetNumber') {
      f.normalizedValue = String(f.value ?? '').trim();
      return f;
    }

    if (key === 'building.location.climateZone') {
      f.normalizedValue = String(f.value ?? '')
        .trim()
        .toUpperCase();
      return f;
    }

    if (key === 'building.details.constructionYear') {
      normalizeConstructionYearField(f);
      return f;
    }

    if (key === 'building.details.useType') {
      f.normalizedValue = normalizeUseType(f.value);
      return f;
    }

    if (CONSUMPTION_FIELD_KEYS.has(key)) {
      const parsed = parseConsumptionText(f.value);
      if (parsed.ok) {
        f.normalizedValue = { amount: parsed.amount, unit: parsed.unit };
      } else {
        f.normalizedValue = null;
        f.consumptionParseError = true;
        f.consumptionParseCode = parsed.code;
      }
      if (key === 'consumptions.gpl.amount' && String(f.value ?? '').trim() !== '') {
        f.warnings = [...(f.warnings || []), 'possible_table_row_mismatch'];
      }
      return f;
    }

    f.normalizedValue = f.value;
    return f;
  });
}

function validateApeNormalizedOutput(fields) {
  const issues = [];
  if (!Array.isArray(fields)) return issues;

  for (const field of fields) {
    if (field.value !== null && field.value !== '' && field.confidence < ocrConfig.confidence.lowThreshold) {
      issues.push({
        fieldKey: field.key,
        type: 'low_confidence',
        message: `${field.label}: confidenza bassa (${Math.round(field.confidence * 100)}%)`,
      });
    }

    if (field.key === 'building.location.climateZone') {
      const z = field.normalizedValue;
      if (z && !VALID_CLIMATE_ZONES.has(String(z))) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_enum',
          message: `Zona climatica "${field.value}" non valida`,
        });
      }
    }

    if (field.key === 'building.details.constructionYear') {
      const y = field.normalizedValue;
      if (
        field.value != null &&
        String(field.value).trim() !== '' &&
        (!Number.isInteger(y) || y < 1700 || y > 2100)
      ) {
        issues.push({
          fieldKey: field.key,
          type: 'invalid_number',
          message: `Anno di costruzione "${field.value}" non valido`,
        });
      }
    }

    if (CONSUMPTION_FIELD_KEYS.has(field.key)) {
      if (field.consumptionParseError) {
        const isNegative = field.consumptionParseCode === 'negative_amount';
        issues.push({
          fieldKey: field.key,
          type: isNegative ? 'invalid_number' : 'parse_error',
          message: isNegative
            ? `Quantità negativa non ammessa`
            : `Consumo "${field.value}" non interpretabile`,
        });
      }

      if (field.key === 'consumptions.gpl.amount' && field.value !== null && field.value !== '') {
        issues.push({
          fieldKey: field.key,
          type: 'suspected_false_positive',
          message: 'GPL: possibile errore di allineamento tabella — verificare manualmente',
        });
      }
    }
  }

  return issues;
}

module.exports = {
  validateApeNormalizedOutput,
  applyApeNormalizations,
  parseConsumptionText,
  CONSUMPTION_FIELD_KEYS,
};
