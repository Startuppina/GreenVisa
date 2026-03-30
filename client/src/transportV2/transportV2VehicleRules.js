const COMMON_VEHICLE_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'wltp_homologation',
  'wltp_co2_g_km',
  'wltp_co2_g_km_alt_fuel',
  'last_revision_date',
  'blue_sticker',
  'annual_km',
];

const COMMON_REQUIRED_FIELD_KEYS = [
  'registration_year',
  'euro_class',
  'fuel_type',
  'wltp_homologation',
  'wltp_co2_g_km',
  'last_revision_date',
  'blue_sticker',
  'annual_km',
];

const MODE_VISIBLE_FIELD_KEYS = {
  passenger: ['occupancy_profile_code'],
  goods: ['goods_vehicle_over_3_5_tons', 'load_profile_code'],
};

const MODE_REQUIRED_FIELD_KEYS = {
  passenger: ['occupancy_profile_code'],
  goods: ['goods_vehicle_over_3_5_tons', 'load_profile_code'],
};

const MODE_FORBIDDEN_FIELD_KEYS = {
  passenger: ['goods_vehicle_over_3_5_tons', 'load_profile_code'],
  goods: ['occupancy_profile_code'],
  none: ['goods_vehicle_over_3_5_tons', 'occupancy_profile_code', 'load_profile_code'],
};

function normalizeTransportMode(transportMode) {
  return transportMode === 'passenger' || transportMode === 'goods' ? transportMode : null;
}

function getSafeVehicleFields(vehicle) {
  return vehicle?.fields && typeof vehicle.fields === 'object' && !Array.isArray(vehicle.fields)
    ? vehicle.fields
    : {};
}

function getForbiddenVehicleFieldKeys(transportMode) {
  if (transportMode === 'passenger') {
    return MODE_FORBIDDEN_FIELD_KEYS.passenger;
  }

  if (transportMode === 'goods') {
    return MODE_FORBIDDEN_FIELD_KEYS.goods;
  }

  return MODE_FORBIDDEN_FIELD_KEYS.none;
}

export function getVisibleVehicleFieldKeys(transportMode) {
  const normalizedTransportMode = normalizeTransportMode(transportMode);
  const modeSpecificKeys = normalizedTransportMode
    ? MODE_VISIBLE_FIELD_KEYS[normalizedTransportMode] || []
    : [];

  return [...COMMON_VEHICLE_FIELD_KEYS, ...modeSpecificKeys];
}

export function getRequiredVehicleFieldKeys(transportMode) {
  const normalizedTransportMode = normalizeTransportMode(transportMode);
  const modeSpecificKeys = normalizedTransportMode
    ? MODE_REQUIRED_FIELD_KEYS[normalizedTransportMode] || []
    : [];

  return [...COMMON_REQUIRED_FIELD_KEYS, ...modeSpecificKeys];
}

export function normalizeVehicleForTransportMode(vehicle, nextTransportMode) {
  const normalizedTransportMode = normalizeTransportMode(nextTransportMode);
  const nextFields = {
    ...getSafeVehicleFields(vehicle),
  };

  getForbiddenVehicleFieldKeys(normalizedTransportMode).forEach((fieldKey) => {
    nextFields[fieldKey] = null;
  });

  return {
    ...(vehicle || {}),
    transport_mode: normalizedTransportMode,
    fields: nextFields,
  };
}
