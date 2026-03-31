function createVehicleId(prefix = 'manual') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function createEmptyVehicleRow(overrides = {}) {
  const vehicleId = overrides.vehicle_id || createVehicleId(overrides.ocr_document_id ? 'ocr' : 'manual');

  return {
    vehicle_id: vehicleId,
    transport_mode: null,
    ocr_document_id: null,
    fields: {
      registration_year: null,
      euro_class: null,
      fuel_type: null,
      co2_emissions_g_km: null,
      wltp_co2_g_km_alt_fuel: null,
      goods_vehicle_over_3_5_tons: null,
      occupancy_profile_code: null,
      load_profile_code: null,
      last_revision_date: null,
      blue_sticker: null,
      annual_km: null,
      ...(overrides.fields || {}),
    },
    field_sources: {},
    field_warnings: {},
    row_notes: null,
    ...overrides,
  };
}
