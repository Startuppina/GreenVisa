const { deriveTransportModeFromVehicleUseText } = require('./ocr/fieldMapper');

const OCR_MANAGED_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'co2_emissions_g_km',
  'goods_vehicle_over_3_5_tons',
];

const TRANSPORT_V2_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'co2_emissions_g_km',
  'wltp_co2_g_km_alt_fuel',
  'goods_vehicle_over_3_5_tons',
  'occupancy_profile_code',
  'load_profile_code',
  'last_revision_date',
  'blue_sticker',
  'annual_km',
];

const DIRECT_FIELD_KEYS = new Set([
  'registration_year',
  'euro_class',
  'fuel_type',
  'co2_emissions_g_km',
  'goods_vehicle_over_3_5_tons',
]);

function pickMassKgFromReviewFields(reviewFields) {
  if (!Array.isArray(reviewFields)) {
    return null;
  }

  const massField = reviewFields.find((f) => f && f.key === 'max_vehicle_mass_kg');
  if (!massField) {
    return null;
  }

  return normalizePositiveInteger(massField.normalizedValue);
}

function hasExplicitGoodsVehicleBooleanInReview(reviewFields) {
  if (!Array.isArray(reviewFields)) {
    return false;
  }

  return reviewFields.some(
    (f) =>
      f &&
      f.key === 'goods_vehicle_over_3_5_tons' &&
      typeof f.normalizedValue === 'boolean',
  );
}

function buildTransportV2VehiclePrefill({
  documentId,
  reviewFields,
  transportMode = null,
  vehicleId = null,
}) {
  const normalizedDocumentId = normalizePositiveInteger(documentId);
  const ocrTransportMode = transportModeFromVehicleUseReviewFields(reviewFields);
  const massKgFromReview = pickMassKgFromReviewFields(reviewFields);
  const skipMassDerivedGoodsBool = hasExplicitGoodsVehicleBooleanInReview(reviewFields);

  const row = {
    vehicle_id: normalizeVehicleId(vehicleId, normalizedDocumentId),
    transport_mode:
      normalizeTransportMode(transportMode) ?? ocrTransportMode ?? null,
    ocr_document_id: normalizedDocumentId,
    fields: createEmptyFields(),
    field_sources: {},
    field_warnings: {},
    row_notes: null,
  };

  if (!Array.isArray(reviewFields)) {
    return row;
  }

  reviewFields.forEach((field) => {
    if (!field || typeof field !== 'object') {
      return;
    }

    const { key } = field;

    if (DIRECT_FIELD_KEYS.has(key)) {
      applyDirectField(row, field, { massKgFromReview });
      return;
    }

    if (key === 'max_vehicle_mass_kg') {
      applyMaxVehicleMassDerivedField(row, field, skipMassDerivedGoodsBool);
    }
  });

  return row;
}

function transportModeFromVehicleUseReviewFields(reviewFields) {
  if (!Array.isArray(reviewFields)) {
    return null;
  }

  const field = reviewFields.find((f) => f && f.key === 'vehicle_use_text');
  if (!field) {
    return null;
  }

  const raw =
    field.normalizedValue !== undefined && field.normalizedValue !== null
      ? field.normalizedValue
      : field.value;

  return deriveTransportModeFromVehicleUseText(raw);
}

function mergeOcrVehiclePrefill(existingVehicle, prefillVehicle, overrideTransportMode = null) {
  if (!existingVehicle || typeof existingVehicle !== 'object') {
    return {
      ...prefillVehicle,
      transport_mode:
        normalizeTransportMode(overrideTransportMode) ?? prefillVehicle.transport_mode ?? null,
    };
  }

  const nextVehicle = {
    ...existingVehicle,
    vehicle_id: normalizeVehicleId(existingVehicle.vehicle_id, prefillVehicle.ocr_document_id),
    transport_mode:
      normalizeTransportMode(overrideTransportMode) ??
      prefillVehicle.transport_mode ??
      existingVehicle.transport_mode ??
      null,
    ocr_document_id: prefillVehicle.ocr_document_id,
    fields: {
      ...createEmptyFields(),
      ...(existingVehicle.fields || {}),
    },
    field_sources: {
      ...(existingVehicle.field_sources || {}),
    },
    field_warnings: {
      ...(existingVehicle.field_warnings || {}),
    },
    row_notes: existingVehicle.row_notes ?? null,
  };

  OCR_MANAGED_FIELD_KEYS.forEach((fieldKey) => {
    const prefillValue = prefillVehicle.fields[fieldKey];
    if (
      fieldKey === 'co2_emissions_g_km' &&
      (prefillValue === null || prefillValue === undefined)
    ) {
      nextVehicle.fields[fieldKey] = existingVehicle.fields[fieldKey];
      if (Object.prototype.hasOwnProperty.call(existingVehicle.field_sources, fieldKey)) {
        nextVehicle.field_sources[fieldKey] = existingVehicle.field_sources[fieldKey];
      } else {
        delete nextVehicle.field_sources[fieldKey];
      }
      if (Object.prototype.hasOwnProperty.call(existingVehicle.field_warnings, fieldKey)) {
        nextVehicle.field_warnings[fieldKey] = existingVehicle.field_warnings[fieldKey];
      } else {
        delete nextVehicle.field_warnings[fieldKey];
      }
      return;
    }

    nextVehicle.fields[fieldKey] = prefillValue;

    if (Object.prototype.hasOwnProperty.call(prefillVehicle.field_sources, fieldKey)) {
      nextVehicle.field_sources[fieldKey] = prefillVehicle.field_sources[fieldKey];
    } else {
      delete nextVehicle.field_sources[fieldKey];
    }

    if (Object.prototype.hasOwnProperty.call(prefillVehicle.field_warnings, fieldKey)) {
      nextVehicle.field_warnings[fieldKey] = prefillVehicle.field_warnings[fieldKey];
    } else {
      delete nextVehicle.field_warnings[fieldKey];
    }
  });

  return nextVehicle;
}

function createEmptyFields() {
  return TRANSPORT_V2_FIELD_KEYS.reduce((accumulator, key) => {
    accumulator[key] = null;
    return accumulator;
  }, {});
}

function applyDirectField(row, field, ctx = {}) {
  if (!Object.prototype.hasOwnProperty.call(row.fields, field.key)) {
    return;
  }

  row.fields[field.key] = normalizeFieldValue(field.normalizedValue);

  if (row.fields[field.key] !== null) {
    let source = 'ocr';
    if (field.key === 'goods_vehicle_over_3_5_tons') {
      const massKg = ctx.massKgFromReview;
      const suggested = massKg !== null && massKg !== undefined ? massKg >= 3500 : null;
      if (field.sourceMethod === 'DERIVED_FROM_MASS') {
        source = 'ocr_derived';
      }
      if (
        suggested !== null &&
        typeof row.fields[field.key] === 'boolean' &&
        row.fields[field.key] !== suggested
      ) {
        source = 'user';
      }
    }

    row.field_sources[field.key] = buildFieldSource({
      documentId: row.ocr_document_id,
      confidence: field.confidence,
      source,
    });
  }

  const warnings = buildWarnings(field);
  if (warnings.length > 0) {
    row.field_warnings[field.key] = warnings;
  }
}

function applyMaxVehicleMassDerivedField(row, field, skipBoolDerivation) {
  const massKg = normalizePositiveInteger(field.normalizedValue);
  if (massKg === null) {
    const warnings = buildWarnings(field);
    if (warnings.length > 0 && !skipBoolDerivation) {
      row.field_warnings.goods_vehicle_over_3_5_tons = warnings;
    }
    return;
  }

  if (skipBoolDerivation) {
    return;
  }

  row.fields.goods_vehicle_over_3_5_tons = massKg >= 3500;
  row.field_sources.goods_vehicle_over_3_5_tons = buildFieldSource({
    documentId: row.ocr_document_id,
    confidence: field.confidence,
    source: 'ocr_derived',
  });

  const warnings = buildWarnings(field);
  if (warnings.length > 0) {
    row.field_warnings.goods_vehicle_over_3_5_tons = warnings;
  }
}

function buildFieldSource({ documentId, confidence, source }) {
  const fieldSource = {
    source,
    document_id: documentId,
  };

  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    fieldSource.confidence = +confidence.toFixed(4);
  }

  return fieldSource;
}

function buildWarnings(field) {
  if (!Array.isArray(field.warnings)) {
    return [];
  }

  return field.warnings
    .filter((warning) => warning && typeof warning === 'object')
    .map((warning) => ({
      code: warning.code || 'manual_check_required',
      message: warning.message || 'Verifica manuale richiesta.',
      ...(typeof warning.confidence === 'number' && Number.isFinite(warning.confidence)
        ? { confidence: +warning.confidence.toFixed(4) }
        : {}),
    }));
}

function normalizeFieldValue(value) {
  if (value === undefined) {
    return null;
  }

  return value === null ? null : value;
}

function normalizeVehicleId(vehicleId, documentId) {
  if (typeof vehicleId === 'string' && vehicleId.trim()) {
    return vehicleId.trim();
  }

  return documentId ? `ocr-doc-${documentId}` : `ocr-doc-pending`;
}

function normalizeTransportMode(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized === 'goods' || normalized === 'passenger' ? normalized : null;
}

function normalizePositiveInteger(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }

  return null;
}

module.exports = {
  OCR_MANAGED_FIELD_KEYS,
  TRANSPORT_V2_FIELD_KEYS,
  buildTransportV2VehiclePrefill,
  createEmptyFields,
  mergeOcrVehiclePrefill,
  normalizeTransportMode,
};
