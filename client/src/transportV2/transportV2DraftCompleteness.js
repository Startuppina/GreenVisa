import { TRANSPORT_V2_FLAG_FIELDS } from './transportV2Model';
import { getRequiredVehicleFieldKeys } from './transportV2VehicleRules';

function isMissingValue(value) {
  return value === null || value === undefined || value === '';
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function getSafeVehicleFields(vehicle) {
  return isPlainObject(vehicle?.fields) ? vehicle.fields : {};
}

function formatFieldLabel(fieldKey) {
  return fieldKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildVehicleLabel(vehicle, fallbackIndex) {
  if (vehicle?.vehicle_id) {
    return vehicle.vehicle_id;
  }

  return `vehicle-${fallbackIndex + 1}`;
}

function getForbiddenFieldIssues(vehicle, fields) {
  if (vehicle?.transport_mode === 'passenger') {
    return isMissingValue(fields.load_profile_code)
      ? []
      : [
          {
            field: 'load_profile_code',
            code: 'forbidden_for_transport_mode',
            message: 'Profilo merci deve essere vuoto per un veicolo passeggeri.',
          },
        ];
  }

  if (vehicle?.transport_mode === 'goods') {
    return isMissingValue(fields.occupancy_profile_code)
      ? []
      : [
          {
            field: 'occupancy_profile_code',
            code: 'forbidden_for_transport_mode',
            message: 'Profilo passeggeri deve essere vuoto per un veicolo merci.',
          },
        ];
  }

  return [];
}

export function getMissingQuestionnaireFlags(questionnaireFlags) {
  const safeFlags = isPlainObject(questionnaireFlags) ? questionnaireFlags : {};

  return TRANSPORT_V2_FLAG_FIELDS.filter((field) => isMissingValue(safeFlags[field.key])).map(
    (field) => ({
      key: field.key,
      label: field.label,
    }),
  );
}

export function getVehicleCompletenessIssues(vehicle, index = 0) {
  const fields = getSafeVehicleFields(vehicle);
  const missingFields = [];
  const invalidFields = [];
  const messages = [];
  const vehicleId = buildVehicleLabel(vehicle, index);

  if (vehicle?.transport_mode !== 'passenger' && vehicle?.transport_mode !== 'goods') {
    missingFields.push('transport_mode');
    messages.push('Seleziona il transport mode del veicolo.');
  }

  getRequiredVehicleFieldKeys(vehicle?.transport_mode).forEach((fieldKey) => {
    if (isMissingValue(fields[fieldKey])) {
      missingFields.push(fieldKey);
    }
  });

  getForbiddenFieldIssues(vehicle, fields).forEach((issue) => {
    invalidFields.push(issue.field);
    messages.push(issue.message);
  });

  if (missingFields.length > 0) {
    messages.push(
      `Campi mancanti: ${missingFields.map(formatFieldLabel).join(', ')}.`,
    );
  }

  return {
    vehicle_id: vehicle?.vehicle_id || null,
    vehicleLabel: vehicleId,
    transport_mode: vehicle?.transport_mode ?? null,
    isComplete: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
    messages,
  };
}

export function getTransportV2DraftCompleteness(transportV2) {
  const draft = isPlainObject(transportV2?.draft) ? transportV2.draft : {};
  const vehicles = Array.isArray(draft.vehicles) ? draft.vehicles : [];
  const missingFlags = getMissingQuestionnaireFlags(draft.questionnaire_flags);
  const rowIssues = vehicles
    .map((vehicle, index) => getVehicleCompletenessIssues(vehicle, index))
    .filter((issue) => !issue.isComplete);

  const summaryMessages = [];
  if (missingFlags.length > 0) {
    summaryMessages.push(
      `Questionnaire flags mancanti: ${missingFlags.map((flag) => flag.label).join(', ')}.`,
    );
  }

  if (vehicles.length === 0) {
    summaryMessages.push('Aggiungi almeno un veicolo al draft.');
  }

  if (rowIssues.length > 0) {
    summaryMessages.push(
      `${rowIssues.length} ${rowIssues.length === 1 ? 'veicolo incompleto' : 'veicoli incompleti'} da completare.`,
    );
  }

  const totalIssues =
    missingFlags.length +
    (vehicles.length === 0 ? 1 : 0) +
    rowIssues.reduce(
      (count, issue) => count + issue.missingFields.length + issue.invalidFields.length,
      0,
    );

  return {
    isComplete: missingFlags.length === 0 && vehicles.length > 0 && rowIssues.length === 0,
    questionnaire: {
      isComplete: missingFlags.length === 0,
      missingFlags,
    },
    vehicles: {
      isComplete: vehicles.length > 0 && rowIssues.length === 0,
      hasAtLeastOneVehicle: vehicles.length > 0,
      rowIssues,
    },
    summary: {
      totalIssues,
      messages: summaryMessages,
    },
  };
}
