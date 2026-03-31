export const TRANSPORT_MODE_OPTIONS = [
  { value: 'passenger', label: 'Passenger' },
  { value: 'goods', label: 'Goods' },
];

export const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export const COVERAGE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'some', label: 'Some' },
  { value: 'none', label: 'None' },
];

export const EURO_CLASS_OPTIONS = [
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
];

export const FUEL_TYPE_OPTIONS = [
  'diesel',
  'benzina',
  'gpl',
  'metano',
  'metano_monovalente',
  'mild_hybrid',
  'full_hybrid',
  'plug_in_hybrid',
  'elettrico',
];

export const PROFILE_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
];

export const QUESTIONNAIRE_FLAG_FIELDS = [
  {
    key: 'compliance_with_vehicle_regulations',
    label: 'Vehicles comply with regulations',
    type: 'boolean',
  },
  {
    key: 'uses_navigator',
    label: 'Uses navigator systems',
    type: 'boolean',
  },
  {
    key: 'uses_class_a_tires',
    label: 'Class A tire adoption',
    type: 'coverage',
  },
  {
    key: 'eco_drive_training',
    label: 'Eco-drive training coverage',
    type: 'coverage',
  },
  {
    key: 'interested_in_mobility_manager_course',
    label: 'Interested in mobility manager course',
    type: 'boolean',
  },
  {
    key: 'interested_in_second_level_certification',
    label: 'Interested in second level certification',
    type: 'boolean',
  },
];

export function isDualFuelType(fuelType) {
  return fuelType === 'gpl' || fuelType === 'metano';
}

export function isBooleanString(value) {
  return value === 'true' || value === 'false';
}

export function toBoolean(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return null;
}

function addError(errors, field, message) {
  errors.push({ field, message });
}

export function getVehicleValidationErrors(vehicle, vehicleIndex) {
  const errors = [];
  const basePath = `draft.vehicles[${vehicleIndex}]`;
  const fields = vehicle?.fields || {};

  if (!vehicle?.vehicle_id) {
    addError(errors, `${basePath}.vehicle_id`, 'Vehicle id is missing.');
  }

  if (!['goods', 'passenger'].includes(vehicle?.transport_mode)) {
    addError(errors, `${basePath}.transport_mode`, 'Select a transport mode.');
  }

  if (fields.registration_year == null) {
    addError(errors, `${basePath}.fields.registration_year`, 'Registration year is required.');
  }

  if (!fields.euro_class) {
    addError(errors, `${basePath}.fields.euro_class`, 'Euro class is required.');
  }

  if (!fields.fuel_type) {
    addError(errors, `${basePath}.fields.fuel_type`, 'Fuel type is required.');
  }

  if (fields.wltp_homologation == null) {
    addError(errors, `${basePath}.fields.wltp_homologation`, 'WLTP homologation is required.');
  }

  if (fields.wltp_co2_g_km == null) {
    addError(errors, `${basePath}.fields.wltp_co2_g_km`, 'WLTP CO2 is required.');
  }

  if (!fields.last_revision_date) {
    addError(errors, `${basePath}.fields.last_revision_date`, 'Last revision date is required.');
  }

  if (fields.blue_sticker == null) {
    addError(errors, `${basePath}.fields.blue_sticker`, 'Blue sticker value is required.');
  }

  if (fields.annual_km == null) {
    addError(errors, `${basePath}.fields.annual_km`, 'Annual km is required.');
  }

  if (isDualFuelType(fields.fuel_type) && fields.wltp_co2_g_km_alt_fuel == null) {
    addError(
      errors,
      `${basePath}.fields.wltp_co2_g_km_alt_fuel`,
      'Second WLTP CO2 value is required for GPL or methane vehicles.',
    );
  }

  if (vehicle?.transport_mode === 'passenger' && fields.occupancy_profile_code == null) {
    addError(
      errors,
      `${basePath}.fields.occupancy_profile_code`,
      'Occupancy profile is required for passenger vehicles.',
    );
  }

  if (vehicle?.transport_mode === 'goods' && fields.load_profile_code == null) {
    addError(
      errors,
      `${basePath}.fields.load_profile_code`,
      'Load profile is required for goods vehicles.',
    );
  }

  if (vehicle?.transport_mode === 'goods' && fields.goods_vehicle_over_3_5_tons == null) {
    addError(
      errors,
      `${basePath}.fields.goods_vehicle_over_3_5_tons`,
      'Weight class is required for goods vehicles.',
    );
  }

  return errors;
}

export function validateTransportV2ForSubmit(transportV2) {
  const errors = [];
  const questionnaireFlags = transportV2?.draft?.questionnaire_flags || {};
  const vehicles = transportV2?.draft?.vehicles || [];

  QUESTIONNAIRE_FLAG_FIELDS.forEach((field) => {
    if (questionnaireFlags[field.key] == null) {
      addError(errors, `draft.questionnaire_flags.${field.key}`, `${field.label} is required.`);
    }
  });

  if (!vehicles.length) {
    addError(errors, 'draft.vehicles', 'Add at least one vehicle before submit.');
  }

  vehicles.forEach((vehicle, index) => {
    errors.push(...getVehicleValidationErrors(vehicle, index));
  });

  return errors;
}

export function groupErrorsByField(errors = []) {
  return errors.reduce((accumulator, error) => {
    if (!error?.field) {
      return accumulator;
    }

    const current = accumulator[error.field] || [];
    current.push(error.message || 'Unknown validation error.');
    accumulator[error.field] = current;
    return accumulator;
  }, {});
}

export function getFirstFieldError(errorMap, field) {
  const messages = errorMap?.[field];
  return Array.isArray(messages) && messages.length ? messages[0] : null;
}

export function vehicleHasMissingRequiredData(vehicle, vehicleIndex = 0) {
  return getVehicleValidationErrors(vehicle, vehicleIndex).length > 0;
}
