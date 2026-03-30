const crypto = require('crypto');

const CURRENT_TRANSPORT_V2_VERSION = 1;
const ALLOWED_ENTRY_MODES = new Set(['form', 'chatbot']);
const ALLOWED_TRANSPORT_MODES = new Set(['goods', 'passenger']);

function createDefaultTransportV2({ certificationId, now }) {
  return {
    meta: {
      version: CURRENT_TRANSPORT_V2_VERSION,
      certification_id: certificationId,
      entry_mode: null,
      status: 'draft',
      started_at: now,
      updated_at: now,
      submitted_at: null,
    },
    draft: {
      questionnaire_flags: {},
      vehicles: [],
    },
    derived: {},
    results: {},
  };
}

function normalizeTransportV2(rawTransportV2, { certificationId, now }) {
  const base = isPlainObject(rawTransportV2)
    ? rawTransportV2
    : createDefaultTransportV2({ certificationId, now });

  const meta = isPlainObject(base.meta) ? base.meta : {};
  const draft = isPlainObject(base.draft) ? base.draft : {};

  return {
    meta: {
      version: CURRENT_TRANSPORT_V2_VERSION,
      certification_id: certificationId,
      entry_mode: normalizeEntryMode(meta.entry_mode),
      status: 'draft',
      started_at: normalizeIsoTimestamp(meta.started_at) || now,
      updated_at: normalizeIsoTimestamp(meta.updated_at) || now,
      submitted_at: normalizeIsoTimestamp(meta.submitted_at),
    },
    draft: {
      questionnaire_flags: normalizeObject(draft.questionnaire_flags),
      vehicles: normalizeVehicles(draft.vehicles),
    },
    derived: {},
    results: {},
  };
}

function applyDraftWritePayload(existingTransportV2, payload, { certificationId, now }) {
  const nextTransportV2 = normalizeTransportV2(existingTransportV2, { certificationId, now });

  if (Object.prototype.hasOwnProperty.call(payload, 'entry_mode') && nextTransportV2.meta.entry_mode == null) {
    nextTransportV2.meta.entry_mode = normalizeEntryMode(payload.entry_mode);
  }

  nextTransportV2.draft = {
    questionnaire_flags: normalizeObject(payload.draft.questionnaire_flags),
    vehicles: normalizeVehicles(payload.draft.vehicles),
  };
  nextTransportV2.meta.updated_at = now;
  nextTransportV2.meta.status = 'draft';

  return nextTransportV2;
}

function normalizeVehicles(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isPlainObject)
    .map((vehicle) => ({
      vehicle_id: normalizeVehicleId(vehicle.vehicle_id),
      transport_mode: normalizeTransportMode(vehicle.transport_mode),
      ocr_document_id: normalizePositiveInteger(vehicle.ocr_document_id),
      fields: normalizeObject(vehicle.fields),
      field_sources: normalizeObject(vehicle.field_sources),
      field_warnings: normalizeObject(vehicle.field_warnings),
      row_notes: normalizeNullableString(vehicle.row_notes),
    }));
}

function normalizeVehicleId(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return crypto.randomUUID();
}

function normalizeTransportMode(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return ALLOWED_TRANSPORT_MODES.has(normalized) ? normalized : null;
}

function normalizeEntryMode(value) {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return ALLOWED_ENTRY_MODES.has(normalized) ? normalized : null;
}

function normalizeObject(value) {
  return isPlainObject(value) ? value : {};
}

function normalizeNullableString(value) {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizePositiveInteger(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return parsed > 0 ? parsed : null;
  }

  return null;
}

function normalizeIsoTimestamp(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : normalized;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  CURRENT_TRANSPORT_V2_VERSION,
  createDefaultTransportV2,
  normalizeTransportV2,
  applyDraftWritePayload,
};
