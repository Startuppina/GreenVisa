export const TRANSPORT_V2_FLAG_FIELDS = [
  {
    key: 'compliance_with_vehicle_regulations',
    label: 'Conformita dei veicoli alle normative vigenti',
  },
  {
    key: 'uses_navigator',
    label: 'Utilizzo di sistemi di navigazione',
  },
  {
    key: 'uses_class_a_tires',
    label: 'Uso di pneumatici di classe A',
  },
  {
    key: 'eco_drive_training',
    label: 'Formazione eco-drive per il personale',
  },
  {
    key: 'interested_in_mobility_manager_course',
    label: 'Interesse per il corso mobility manager',
  },
  {
    key: 'interested_in_second_level_certification',
    label: 'Interesse per la certificazione di secondo livello',
  },
];

export const TRANSPORT_MODE_OPTIONS = [
  { value: '', label: 'Non impostato' },
  { value: 'passenger', label: 'Passeggeri' },
  { value: 'goods', label: 'Merci' },
];

export const EURO_CLASS_OPTIONS = [
  '',
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
  '',
  'benzina',
  'diesel',
  'gpl',
  'metano',
  'metano_monovalente',
  'mild_hybrid',
  'full_hybrid',
  'plug_in_hybrid',
  'elettrico',
];

export const PROFILE_CODE_OPTIONS = [
  { value: '', label: 'Non impostato' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
];

export const BOOLEAN_SELECT_OPTIONS = [
  { value: '', label: 'Non impostato' },
  { value: 'true', label: 'Si' },
  { value: 'false', label: 'No' },
];

export const TRANSPORT_V2_FIELD_KEYS = [
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

export function createEmptyVehicleFields() {
  return TRANSPORT_V2_FIELD_KEYS.reduce((accumulator, key) => {
    accumulator[key] = null;
    return accumulator;
  }, {});
}

export function createEmptyVehicleRow() {
  return {
    vehicle_id: createManualVehicleId(),
    transport_mode: null,
    ocr_document_id: null,
    fields: createEmptyVehicleFields(),
    field_sources: {},
    field_warnings: {},
    row_notes: null,
  };
}

export function parseBooleanSelectValue(value) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return null;
}

export function parseIntegerSelectValue(value) {
  if (value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export function booleanToSelectValue(value) {
  if (value === true) {
    return 'true';
  }

  if (value === false) {
    return 'false';
  }

  return '';
}

export function formatEntryMode(mode) {
  if (mode === 'form') {
    return 'Form';
  }

  if (mode === 'chatbot') {
    return 'Chatbot';
  }

  return 'Da selezionare';
}

export function formatTransportMode(mode) {
  if (mode === 'passenger') {
    return 'Passeggeri';
  }

  if (mode === 'goods') {
    return 'Merci';
  }

  return 'Non impostato';
}

export function getVehicleDisplayName(vehicle, index) {
  if (vehicle?.vehicle_id) {
    return vehicle.vehicle_id;
  }

  return `Veicolo ${index + 1}`;
}

export function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Non impostato';
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No';
  }

  return String(value);
}

function createManualVehicleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `manual-${crypto.randomUUID()}`;
  }

  return `manual-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
