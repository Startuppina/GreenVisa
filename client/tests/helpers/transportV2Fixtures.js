function deepMerge(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) {
    return overrides ?? base;
  }

  if (isPlainObject(base) && isPlainObject(overrides)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(overrides)]);
    return Array.from(keys).reduce((accumulator, key) => {
      accumulator[key] = deepMerge(base[key], overrides[key]);
      return accumulator;
    }, {});
  }

  return overrides === undefined ? base : overrides;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function makeTransportV2Fixture(overrides = {}) {
  const base = {
    meta: {
      version: 1,
      certification_id: 123,
      status: 'draft',
      started_at: '2026-03-30T10:00:00.000Z',
      updated_at: '2026-03-30T10:00:00.000Z',
      submitted_at: null,
    },
    draft: {
      questionnaire_flags: {},
      vehicles: [],
    },
    derived: {},
    results: {},
  };

  return deepMerge(base, overrides);
}

export function makeFreshDraftFixture(overrides = {}) {
  return makeTransportV2Fixture(overrides);
}

export function makeManualVehicleRow(overrides = {}) {
  return deepMerge(
    {
      vehicle_id: 'manual-vehicle-1',
      transport_mode: 'passenger',
      ocr_document_id: null,
      fields: {
        registration_year: 2020,
        euro_class: 'EURO_6',
        fuel_type: 'diesel',
        co2_emissions_g_km: 110,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: null,
        occupancy_profile_code: 2,
        load_profile_code: null,
        last_revision_date: '2026-01-10',
        blue_sticker: true,
        annual_km: 24000,
      },
      field_sources: {},
      field_warnings: {},
      row_notes: 'Veicolo inserito manualmente',
    },
    overrides,
  );
}

/** Complete goods row for completeness / display tests. */
export function makeCompleteGoodsVehicleRow(overrides = {}) {
  return deepMerge(
    {
      vehicle_id: 'goods-complete-1',
      transport_mode: 'goods',
      ocr_document_id: null,
      fields: {
        registration_year: 2019,
        euro_class: 'EURO_6',
        fuel_type: 'diesel',
        co2_emissions_g_km: 140,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: false,
        occupancy_profile_code: null,
        load_profile_code: 4,
        last_revision_date: '2025-06-01',
        blue_sticker: false,
        annual_km: 12000,
      },
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    },
    overrides,
  );
}

/** OCR-style passenger row (sources + document id) still editable in UI. */
export function makeOcrPrefilledPassengerRow(overrides = {}) {
  return deepMerge(
    deepMerge(makeManualVehicleRow(), {
      vehicle_id: 'ocr-passenger-1',
      ocr_document_id: 501,
      field_sources: {
        registration_year: { source: 'ocr', document_id: 501, confidence: 0.95 },
      },
    }),
    overrides,
  );
}

export function makeOcrVehicleRow(overrides = {}) {
  return deepMerge(
    {
      vehicle_id: 'ocr-doc-77',
      transport_mode: 'goods',
      ocr_document_id: 77,
      fields: {
        registration_year: 2018,
        euro_class: 'EURO_5',
        fuel_type: 'diesel',
        co2_emissions_g_km: 143,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: true,
        occupancy_profile_code: null,
        load_profile_code: null,
        last_revision_date: null,
        blue_sticker: null,
        annual_km: null,
      },
      field_sources: {
        registration_year: {
          source: 'ocr',
          document_id: 77,
          confidence: 0.9812,
        },
        co2_emissions_g_km: {
          source: 'ocr',
          document_id: 77,
          confidence: 0.96,
        },
        goods_vehicle_over_3_5_tons: {
          source: 'ocr_derived',
          document_id: 77,
          confidence: 0.8765,
        },
      },
      field_warnings: {
        fuel_type: [
          {
            code: 'manual_check_required',
            message: 'Verifica manuale richiesta.',
          },
        ],
      },
      row_notes: null,
    },
    overrides,
  );
}

export function makeFormModeDraftFixture(overrides = {}) {
  return makeTransportV2Fixture({
    meta: {
      updated_at: '2026-03-30T10:05:00.000Z',
    },
    draft: {
      questionnaire_flags: {
        compliance_with_vehicle_regulations: true,
        uses_navigator: false,
        uses_class_a_tires: true,
        eco_drive_training: true,
        interested_in_mobility_manager_course: false,
        interested_in_second_level_certification: null,
      },
      vehicles: [makeManualVehicleRow()],
    },
    ...overrides,
  });
}

export function makeOcrPrefilledDraftFixture(overrides = {}) {
  return makeTransportV2Fixture({
    meta: {
      updated_at: '2026-03-30T10:06:00.000Z',
    },
    draft: {
      questionnaire_flags: {
        compliance_with_vehicle_regulations: true,
      },
      vehicles: [
        makeManualVehicleRow({ vehicle_id: 'manual-vehicle-1' }),
        makeOcrVehicleRow(),
      ],
    },
    ...overrides,
  });
}

/** All questionnaire flags non-null and one complete passenger vehicle row. */
export function makeCompleteDraftFixture(overrides = {}) {
  return makeTransportV2Fixture({
    meta: {
      updated_at: '2026-03-30T11:00:00.000Z',
    },
    draft: {
      questionnaire_flags: {
        compliance_with_vehicle_regulations: true,
        uses_navigator: false,
        uses_class_a_tires: true,
        eco_drive_training: true,
        interested_in_mobility_manager_course: false,
        interested_in_second_level_certification: true,
      },
      vehicles: [makeManualVehicleRow()],
    },
    ...overrides,
  });
}

export function makeSubmittedDraftFixture(overrides = {}) {
  return makeTransportV2Fixture({
    meta: {
      status: 'submitted',
      updated_at: '2026-03-30T10:12:00.000Z',
      submitted_at: '2026-03-30T10:12:00.000Z',
    },
    draft: {
      questionnaire_flags: {
        compliance_with_vehicle_regulations: true,
        uses_navigator: true,
        uses_class_a_tires: false,
        eco_drive_training: true,
        interested_in_mobility_manager_course: false,
        interested_in_second_level_certification: true,
      },
      vehicles: [makeManualVehicleRow()],
    },
    derived: {
      fleet_size: 1,
      source: 'backend-only-derived',
    },
    results: {
      calculator_version: 'transport_v2_v1',
      score: {
        total_score: 87,
      },
      co2: {
        total_tons_per_year: 12.34,
      },
    },
    ...overrides,
  });
}
