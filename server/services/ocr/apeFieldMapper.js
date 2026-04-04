/**
 * APE field mapping — Google Document AI custom entity types → stable review field keys.
 */

const APE_ENTITY_DEFS = [
  { providerType: 'building_region', key: 'building.location.region', label: 'Regione' },
  { providerType: 'building_municipality', key: 'building.location.municipality', label: 'Comune' },
  { providerType: 'building_street_name', key: 'building.location.street', label: 'Indirizzo (via)' },
  { providerType: 'building_street_number', key: 'building.location.streetNumber', label: 'Civico' },
  { providerType: 'building_climate_zone', key: 'building.location.climateZone', label: 'Zona climatica' },
  { providerType: 'building_construction_year', key: 'building.details.constructionYear', label: 'Anno di costruzione' },
  { providerType: 'building_use_type', key: 'building.details.useType', label: "Destinazione d'uso" },
  {
    providerType: 'grid_electricity_annual_consumption_raw',
    key: 'consumptions.electricity.amount',
    label: 'Energia elettrica da rete',
  },
  {
    providerType: 'natural_gas_annual_consumption_raw',
    key: 'consumptions.natural_gas.amount',
    label: 'Gas naturale',
  },
  {
    providerType: 'lpg_annual_consumption_raw',
    key: 'consumptions.gpl.amount',
    label: 'GPL',
  },
];

const DEF_BY_PROVIDER_TYPE = new Map(APE_ENTITY_DEFS.map((d) => [d.providerType, d]));

function pickDisplayText(entity) {
  const m = entity?.mentionText;
  if (m != null && String(m).trim() !== '') return String(m);
  const n = entity?.normalizedValue;
  if (n != null && String(n).trim() !== '') return String(n);
  return '';
}

function pickProviderIntegerValue(rawEnt) {
  const iv = rawEnt?.normalizedValue?.integerValue;
  if (iv === undefined || iv === null || iv === '') return null;
  const n = typeof iv === 'number' ? iv : parseInt(String(iv), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Map uniform provider entities (from googleDocumentAiService.extractEntitiesFromResponse)
 * into raw APE review fields. Unknown entity types are skipped.
 *
 * @param {Array} entities
 * @param {Array} [rawDocumentEntities] — optional Google `document.entities` for integer hints
 * @returns {Array<object>}
 */
function mapApeProviderEntitiesToFields(entities, rawDocumentEntities = []) {
  const fields = [];
  if (!Array.isArray(entities)) return fields;

  const rawByType = new Map();
  for (const e of rawDocumentEntities || []) {
    if (e && e.type && !rawByType.has(e.type)) rawByType.set(e.type, e);
  }

  const keysSeen = new Set();
  for (const ent of entities) {
    const def = DEF_BY_PROVIDER_TYPE.get(ent.type);
    if (!def) continue;
    if (keysSeen.has(def.key)) continue;
    keysSeen.add(def.key);

    const conf = typeof ent.confidence === 'number' ? +ent.confidence.toFixed(4) : 0;
    const field = {
      key: def.key,
      label: def.label,
      value: pickDisplayText(ent),
      confidence: conf,
      required: false,
      sourceMethod: 'EXTRACT',
      sourcePage: ent.pageNumber ?? null,
      boundingPoly: ent.boundingPoly ?? null,
      sourceEntityType: ent.type,
    };

    if (def.key === 'building.details.constructionYear') {
      const hint = pickProviderIntegerValue(rawByType.get(ent.type));
      if (hint != null) field.providerIntegerValue = hint;
    }

    fields.push(field);
  }

  return fields;
}

/**
 * @param {Array} normalizedFields
 */
function buildApeDerivedOutputFromNormalizedFields(normalizedFields) {
  const consumptionMeta = {
    'consumptions.electricity.amount': { energySource: 'electricity' },
    'consumptions.natural_gas.amount': { energySource: 'natural_gas' },
    'consumptions.gpl.amount': { energySource: 'gpl' },
  };

  const parsedConsumptions = [];
  for (const f of normalizedFields || []) {
    const meta = consumptionMeta[f.key];
    if (!meta) continue;
    const nv = f.normalizedValue;
    if (nv && typeof nv === 'object' && Number.isFinite(nv.amount) && nv.unit) {
      parsedConsumptions.push({
        energySource: meta.energySource,
        amount: nv.amount,
        unit: nv.unit,
        fieldKey: f.key,
      });
    }
  }

  const hasGpl = (normalizedFields || []).some((f) => f.key === 'consumptions.gpl.amount');
  const suspiciousFields = hasGpl ? ['consumptions.gpl.amount'] : [];

  return {
    category: 'ape',
    version: 1,
    parsedConsumptions,
    suspiciousFields,
  };
}

/** @param {Array} [fields] @param {object} [building_certification_prefill] */
function buildApeNormalizedOutput(fields = [], building_certification_prefill = {}) {
  return {
    category: 'ape',
    version: 1,
    fields,
    building_certification_prefill,
  };
}

/** @param {object} [partial] */
function buildApeDerivedOutput(partial = {}) {
  return {
    category: 'ape',
    version: 1,
    parsedConsumptions: partial.parsedConsumptions ?? [],
    suspiciousFields: partial.suspiciousFields ?? [],
  };
}

/** @param {object} [partial] */
function buildApeReviewPayload(partial = {}) {
  return {
    category: 'ape',
    version: 1,
    fields: partial.fields ?? [],
    validationIssues: partial.validationIssues ?? [],
    building_certification_prefill: partial.building_certification_prefill ?? {},
    derivedSummary: partial.derivedSummary ?? buildApeDerivedOutput(),
  };
}

module.exports = {
  mapApeProviderEntitiesToFields,
  buildApeDerivedOutputFromNormalizedFields,
  buildApeNormalizedOutput,
  buildApeDerivedOutput,
  buildApeReviewPayload,
  APE_ENTITY_DEFS,
};
