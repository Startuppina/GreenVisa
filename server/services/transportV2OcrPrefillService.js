const OCR_MANAGED_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'wltp_homologation',
  'goods_vehicle_over_3_5_tons',
];

const TRANSPORT_V2_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'wltp_homologation',
  'wltp_co2_g_km',
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
  'wltp_homologation',
  'goods_vehicle_over_3_5_tons',
]);

function buildTransportV2VehiclePrefill({
  documentId,
  reviewFields,
  transportMode = null,
  vehicleId = null,
}) {
  const normalizedDocumentId = normalizePositiveInteger(documentId);
  const row = {
    vehicle_id: normalizeVehicleId(vehicleId, normalizedDocumentId),
    transport_mode: normalizeTransportMode(transportMode),
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
      applyDirectField(row, field);
      return;
    }

    if (key === 'vehicle_mass_kg') {
      applyVehicleMassDerivedField(row, field);
    }
  });

  return row;
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
    nextVehicle.fields[fieldKey] = prefillVehicle.fields[fieldKey];

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

function applyDirectField(row, field) {
  if (!Object.prototype.hasOwnProperty.call(row.fields, field.key)) {
    return;
  }

  row.fields[field.key] = normalizeFieldValue(field.normalizedValue);

  if (row.fields[field.key] !== null) {
    row.field_sources[field.key] = buildFieldSource({
      documentId: row.ocr_document_id,
      confidence: field.confidence,
      source: 'ocr',
    });
  }

  const warnings = buildWarnings(field);
  if (warnings.length > 0) {
    row.field_warnings[field.key] = warnings;
  }
}

function applyVehicleMassDerivedField(row, field) {
  const massKg = normalizePositiveInteger(field.normalizedValue);
  if (massKg === null) {
    const warnings = buildWarnings(field);
    if (warnings.length > 0) {
      row.field_warnings.goods_vehicle_over_3_5_tons = warnings;
    }
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
