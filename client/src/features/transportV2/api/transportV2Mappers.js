import createEmptyTransportV2Draft from '../utils/emptyTransportV2Draft.js';
import createEmptyVehicleRow from '../utils/emptyVehicleRow.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeNullableInteger(value) {
  if (Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number.parseInt(trimmed, 10);
    }
  }

  return null;
}

const VEHICLE_INTEGER_FIELD_KEYS = [
  'registration_year',
  'co2_emissions_g_km',
  'wltp_co2_g_km_alt_fuel',
  'annual_km',
  'occupancy_profile_code',
  'load_profile_code',
];

function coerceTransportVehicleIntegerFields(fields) {
  if (!isPlainObject(fields)) {
    return fields;
  }

  const next = { ...fields };
  VEHICLE_INTEGER_FIELD_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return;
    }

    const coerced = normalizeNullableInteger(next[key]);
    next[key] = coerced;
  });

  return next;
}

function normalizeVehicleRow(vehicle, index) {
  const defaults = createEmptyVehicleRow({
    vehicle_id: typeof vehicle?.vehicle_id === 'string' && vehicle.vehicle_id.trim()
      ? vehicle.vehicle_id.trim()
      : `vehicle-${index + 1}`,
  });

  return {
    ...defaults,
    ...(isPlainObject(vehicle) ? vehicle : {}),
    vehicle_id: typeof vehicle?.vehicle_id === 'string' && vehicle.vehicle_id.trim()
      ? vehicle.vehicle_id.trim()
      : defaults.vehicle_id,
    transport_mode: vehicle?.transport_mode === 'goods' || vehicle?.transport_mode === 'passenger'
      ? vehicle.transport_mode
      : null,
    ocr_document_id: normalizeNullableInteger(vehicle?.ocr_document_id),
    fields: coerceTransportVehicleIntegerFields({
      ...defaults.fields,
      ...(isPlainObject(vehicle?.fields) ? vehicle.fields : {}),
    }),
    field_sources: isPlainObject(vehicle?.field_sources) ? vehicle.field_sources : {},
    field_warnings: isPlainObject(vehicle?.field_warnings) ? vehicle.field_warnings : {},
    row_notes: typeof vehicle?.row_notes === 'string' ? vehicle.row_notes : null,
  };
}

export function normalizeTransportV2Envelope(payload, certificationId) {
  const fallback = createEmptyTransportV2Draft(certificationId);
  const transportV2 = isPlainObject(payload?.transport_v2)
    ? payload.transport_v2
    : isPlainObject(payload)
      ? payload
      : fallback;

  return {
    meta: {
      ...fallback.meta,
      ...(isPlainObject(transportV2.meta) ? transportV2.meta : {}),
      certification_id: normalizeNullableInteger(
        transportV2?.meta?.certification_id ?? certificationId ?? fallback.meta.certification_id,
      ),
    },
    draft: {
      questionnaire_flags: isPlainObject(transportV2?.draft?.questionnaire_flags)
        ? transportV2.draft.questionnaire_flags
        : {},
      vehicles: Array.isArray(transportV2?.draft?.vehicles)
        ? transportV2.draft.vehicles.map(normalizeVehicleRow)
        : [],
    },
    derived: isPlainObject(transportV2?.derived) ? transportV2.derived : {},
    results: isPlainObject(transportV2?.results) ? transportV2.results : {},
  };
}

export function sanitizeDraftForSave(transportV2) {
  return {
    draft: {
      questionnaire_flags: isPlainObject(transportV2?.draft?.questionnaire_flags)
        ? transportV2.draft.questionnaire_flags
        : {},
      vehicles: Array.isArray(transportV2?.draft?.vehicles)
        ? transportV2.draft.vehicles.map((vehicle, index) => {
            const normalizedVehicle = normalizeVehicleRow(vehicle, index);

            return {
              vehicle_id: normalizedVehicle.vehicle_id,
              transport_mode: normalizedVehicle.transport_mode,
              ocr_document_id: normalizedVehicle.ocr_document_id,
              fields: normalizedVehicle.fields,
              field_sources: normalizedVehicle.field_sources,
              field_warnings: normalizedVehicle.field_warnings,
              row_notes: normalizedVehicle.row_notes,
            };
          })
        : [],
    },
  };
}

export function extractApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallbackMessage
  );
}

export function extractApiFieldErrors(error) {
  if (!Array.isArray(error?.response?.data?.errors)) {
    return {};
  }

  return error.response.data.errors.reduce((accumulator, item) => {
    if (!item?.field) {
      return accumulator;
    }

    const next = accumulator[item.field] || [];
    next.push(item.message || item.code || 'Unknown error.');
    accumulator[item.field] = next;
    return accumulator;
  }, {});
}
