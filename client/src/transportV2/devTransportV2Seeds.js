import { createEmptyVehicleFields, createEmptyVehicleRow, TRANSPORT_V2_FLAG_FIELDS } from './transportV2Model';
import { normalizeVehicleForTransportMode } from './transportV2VehicleRules';

export const DEV_TRANSPORT_V2_STORAGE_KEY = 'greenvisa.dev.transport_v2';

const CURRENT_TRANSPORT_V2_VERSION = 1;
const ALLOWED_ENTRY_MODES = new Set(['form', 'chatbot']);

function createQuestionnaireFlags(overrides = {}) {
  const defaultFlags = TRANSPORT_V2_FLAG_FIELDS.reduce((accumulator, field) => {
    accumulator[field.key] = null;
    return accumulator;
  }, {});

  return {
    ...defaultFlags,
    ...overrides,
  };
}

export function createDevTransportV2({
  now = getNowIsoString(),
  metaOverrides = {},
  questionnaireFlags = createQuestionnaireFlags(),
  vehicles = [],
  derived = {},
  results = {},
} = {}) {
  return normalizeDevTransportV2(
    {
      meta: {
        version: CURRENT_TRANSPORT_V2_VERSION,
        certification_id: null,
        entry_mode: 'form',
        status: 'draft',
        started_at: now,
        updated_at: now,
        submitted_at: null,
        ...metaOverrides,
      },
      draft: {
        questionnaire_flags: questionnaireFlags,
        vehicles,
      },
      derived,
      results,
    },
    { now },
  );
}

export function createEmptyDraftSeed() {
  return createDevTransportV2();
}

export function createPassengerOcrDraftSeed() {
  return createDevTransportV2({
    questionnaireFlags: createQuestionnaireFlags({
      compliance_with_vehicle_regulations: true,
      uses_navigator: true,
      uses_class_a_tires: true,
      eco_drive_training: false,
      interested_in_mobility_manager_course: false,
      interested_in_second_level_certification: true,
    }),
    vehicles: [
      buildVehicle({
        vehicle_id: 'ocr-passenger-1',
        transport_mode: 'passenger',
        ocr_document_id: 101,
        fields: {
          registration_year: 2022,
          euro_class: 'EURO_6d',
          fuel_type: 'diesel',
          wltp_homologation: true,
          wltp_co2_g_km: 128,
          occupancy_profile_code: 4,
          last_revision_date: '2025-11-15',
          blue_sticker: true,
          annual_km: 18000,
        },
        field_sources: {
          registration_year: buildFieldSource({ source: 'ocr', documentId: 101, confidence: 0.99 }),
          euro_class: buildFieldSource({ source: 'ocr', documentId: 101, confidence: 0.96 }),
          fuel_type: buildFieldSource({ source: 'mixed', documentId: 101, confidence: 0.71 }),
          wltp_homologation: buildFieldSource({ source: 'ocr', documentId: 101, confidence: 0.88 }),
          occupancy_profile_code: buildFieldSource({ source: 'user' }),
          annual_km: buildFieldSource({ source: 'user' }),
        },
        field_warnings: {
          fuel_type: [
            {
              code: 'manual_review_recommended',
              message: 'OCR ambiguo sul carburante: verificare il libretto.',
            },
          ],
        },
        row_notes: 'Veicolo passeggeri prefill OCR con alcune correzioni utente.',
      }),
    ],
  });
}

export function createGoodsOcrDraftSeed() {
  return createDevTransportV2({
    questionnaireFlags: createQuestionnaireFlags({
      compliance_with_vehicle_regulations: true,
      uses_navigator: false,
      uses_class_a_tires: true,
      eco_drive_training: true,
      interested_in_mobility_manager_course: true,
      interested_in_second_level_certification: false,
    }),
    vehicles: [
      buildVehicle({
        vehicle_id: 'ocr-goods-1',
        transport_mode: 'goods',
        ocr_document_id: 202,
        fields: {
          registration_year: 2019,
          euro_class: 'EURO_6',
          fuel_type: 'diesel',
          wltp_homologation: true,
          wltp_co2_g_km: 286,
          goods_vehicle_over_3_5_tons: true,
          load_profile_code: 2,
          last_revision_date: '2025-04-10',
          blue_sticker: false,
          annual_km: 34000,
        },
        field_sources: {
          registration_year: buildFieldSource({ source: 'ocr', documentId: 202, confidence: 0.97 }),
          euro_class: buildFieldSource({ source: 'ocr', documentId: 202, confidence: 0.93 }),
          fuel_type: buildFieldSource({ source: 'ocr', documentId: 202, confidence: 0.94 }),
          goods_vehicle_over_3_5_tons: buildFieldSource({
            source: 'ocr_derived',
            documentId: 202,
            confidence: 0.84,
          }),
          load_profile_code: buildFieldSource({ source: 'user' }),
        },
        field_warnings: {
          goods_vehicle_over_3_5_tons: [
            {
              code: 'derived_from_vehicle_mass',
              message: 'Valore derivato dal peso veicolo OCRizzato.',
            },
          ],
        },
        row_notes: 'Veicolo merci OCR-like con tonnellaggio derivato.',
      }),
    ],
  });
}

export function createCompleteishDraftSeed() {
  return createDevTransportV2({
    questionnaireFlags: createQuestionnaireFlags({
      compliance_with_vehicle_regulations: true,
      uses_navigator: true,
      uses_class_a_tires: true,
      eco_drive_training: true,
      interested_in_mobility_manager_course: false,
      interested_in_second_level_certification: true,
    }),
    vehicles: [
      buildVehicle({
        vehicle_id: 'manual-passenger-complete',
        transport_mode: 'passenger',
        fields: {
          registration_year: 2021,
          euro_class: 'EURO_6e',
          fuel_type: 'full_hybrid',
          wltp_homologation: true,
          wltp_co2_g_km: 104,
          occupancy_profile_code: 5,
          last_revision_date: '2025-08-20',
          blue_sticker: true,
          annual_km: 15000,
        },
        field_sources: {
          registration_year: buildFieldSource({ source: 'user' }),
          euro_class: buildFieldSource({ source: 'user' }),
          fuel_type: buildFieldSource({ source: 'user' }),
          occupancy_profile_code: buildFieldSource({ source: 'user' }),
        },
      }),
      buildVehicle({
        vehicle_id: 'ocr-goods-near-complete',
        transport_mode: 'goods',
        ocr_document_id: 303,
        fields: {
          registration_year: 2018,
          euro_class: 'EURO_5',
          fuel_type: 'diesel',
          wltp_homologation: true,
          wltp_co2_g_km: 310,
          goods_vehicle_over_3_5_tons: true,
          load_profile_code: null,
          last_revision_date: '2025-01-09',
          blue_sticker: true,
          annual_km: 42000,
        },
        field_sources: {
          registration_year: buildFieldSource({ source: 'ocr', documentId: 303, confidence: 0.98 }),
          euro_class: buildFieldSource({ source: 'ocr', documentId: 303, confidence: 0.92 }),
          fuel_type: buildFieldSource({ source: 'mixed', documentId: 303, confidence: 0.77 }),
          goods_vehicle_over_3_5_tons: buildFieldSource({
            source: 'ocr_derived',
            documentId: 303,
            confidence: 0.82,
          }),
        },
        field_warnings: {
          fuel_type: [
            {
              code: 'low_confidence',
              message: 'Confermare il tipo carburante prima del submit.',
            },
          ],
        },
        row_notes: 'Bozza quasi completa: manca solo il profilo merci.',
      }),
    ],
  });
}

export function createSubmittedDraftSeed() {
  const now = getNowIsoString();

  return createDevTransportV2({
    now,
    metaOverrides: {
      status: 'submitted',
      submitted_at: now,
    },
    questionnaireFlags: createQuestionnaireFlags({
      compliance_with_vehicle_regulations: true,
      uses_navigator: true,
      uses_class_a_tires: true,
      eco_drive_training: true,
      interested_in_mobility_manager_course: false,
      interested_in_second_level_certification: true,
    }),
    vehicles: [
      buildVehicle({
        vehicle_id: 'submitted-passenger-1',
        transport_mode: 'passenger',
        fields: {
          registration_year: 2020,
          euro_class: 'EURO_6',
          fuel_type: 'benzina',
          wltp_homologation: true,
          wltp_co2_g_km: 132,
          occupancy_profile_code: 3,
          last_revision_date: '2025-02-18',
          blue_sticker: true,
          annual_km: 11000,
        },
        field_sources: {
          registration_year: buildFieldSource({ source: 'user' }),
          euro_class: buildFieldSource({ source: 'user' }),
          fuel_type: buildFieldSource({ source: 'user' }),
        },
      }),
    ],
  });
}

export function cloneTransportV2Draft(transportV2) {
  return JSON.parse(JSON.stringify(transportV2));
}

export function normalizeDevTransportV2(rawTransportV2, { now = getNowIsoString() } = {}) {
  const safeTransportV2 = isPlainObject(rawTransportV2) ? rawTransportV2 : {};
  const meta = isPlainObject(safeTransportV2.meta) ? safeTransportV2.meta : {};
  const draft = isPlainObject(safeTransportV2.draft) ? safeTransportV2.draft : {};
  const startedAt = normalizeIsoTimestamp(meta.started_at) || now;
  const status = meta.status === 'submitted' ? 'submitted' : 'draft';
  const submittedAt =
    status === 'submitted'
      ? normalizeIsoTimestamp(meta.submitted_at) || normalizeIsoTimestamp(meta.updated_at) || now
      : null;

  return {
    meta: {
      version: CURRENT_TRANSPORT_V2_VERSION,
      certification_id: null,
      entry_mode: normalizeEntryMode(meta.entry_mode) ?? 'form',
      status,
      started_at: startedAt,
      updated_at: normalizeIsoTimestamp(meta.updated_at) || startedAt,
      submitted_at: submittedAt,
    },
    draft: {
      questionnaire_flags: normalizeQuestionnaireFlags(draft.questionnaire_flags),
      vehicles: normalizeVehicles(draft.vehicles),
    },
    derived: normalizeObject(safeTransportV2.derived),
    results: normalizeObject(safeTransportV2.results),
  };
}

function buildVehicle({
  vehicle_id,
  transport_mode,
  ocr_document_id = null,
  fields = {},
  field_sources = {},
  field_warnings = {},
  row_notes = null,
}) {
  const baseVehicle = createEmptyVehicleRow();

  return normalizeVehicleForTransportMode(
    {
      ...baseVehicle,
      vehicle_id: vehicle_id || baseVehicle.vehicle_id,
      transport_mode,
      ocr_document_id: normalizePositiveInteger(ocr_document_id),
      fields: {
        ...createEmptyVehicleFields(),
        ...fields,
      },
      field_sources: normalizeObject(field_sources),
      field_warnings: normalizeObject(field_warnings),
      row_notes: normalizeNullableString(row_notes),
    },
    transport_mode,
  );
}

function buildFieldSource({ source, documentId = null, confidence } = {}) {
  const nextFieldSource = {
    source: source || 'user',
  };

  if (documentId != null) {
    nextFieldSource.document_id = documentId;
  }

  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    nextFieldSource.confidence = confidence;
  }

  return nextFieldSource;
}

function normalizeVehicles(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isPlainObject)
    .map((vehicle) => {
      const baseVehicle = createEmptyVehicleRow();

      return normalizeVehicleForTransportMode(
        {
          ...baseVehicle,
          vehicle_id:
            typeof vehicle.vehicle_id === 'string' && vehicle.vehicle_id.trim()
              ? vehicle.vehicle_id.trim()
              : baseVehicle.vehicle_id,
          transport_mode: vehicle.transport_mode,
          ocr_document_id: normalizePositiveInteger(vehicle.ocr_document_id),
          fields: {
            ...createEmptyVehicleFields(),
            ...normalizeObject(vehicle.fields),
          },
          field_sources: normalizeObject(vehicle.field_sources),
          field_warnings: normalizeObject(vehicle.field_warnings),
          row_notes: normalizeNullableString(vehicle.row_notes),
        },
        vehicle.transport_mode,
      );
    });
}

function normalizeQuestionnaireFlags(value) {
  return isPlainObject(value) ? createQuestionnaireFlags(value) : createQuestionnaireFlags();
}

function normalizeEntryMode(value) {
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

function getNowIsoString() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
