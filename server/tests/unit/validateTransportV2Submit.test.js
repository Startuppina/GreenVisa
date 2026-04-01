const { validateTransportV2Block2SubmitPayload } = require('../../services/validateTransportv2');
const {
  buildCompleteGoodsDraft,
  buildCompleteMixedDraft,
  buildCompletePassengerDraft,
  buildGoodsVehicle,
  buildPassengerVehicle,
} = require('../helpers/fixtures');

describe('validateTransportV2Block2SubmitPayload', () => {
  const certificationId = 123;

  it('accepts a complete passenger-only draft', () => {
    const result = validateTransportV2Block2SubmitPayload(
      buildCompletePassengerDraft(certificationId),
    );

    expect(result.valid).toBe(true);
  });

  it('accepts a complete goods-only draft', () => {
    const result = validateTransportV2Block2SubmitPayload(
      buildCompleteGoodsDraft(certificationId),
    );

    expect(result.valid).toBe(true);
  });

  it('accepts a complete mixed draft', () => {
    const result = validateTransportV2Block2SubmitPayload(
      buildCompleteMixedDraft(certificationId),
    );

    expect(result.valid).toBe(true);
  });

  it('rejects a missing questionnaire flag', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      questionnaireFlagOverrides: {
        uses_navigator: null,
      },
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.questionnaire_flags.uses_navigator',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects an empty vehicles array', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicles: [],
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft.vehicles', code: 'required' }),
      ]),
    );
  });

  it('rejects a row with missing transport_mode', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({ transport_mode: null }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].transport_mode',
          code: 'invalid_enum',
        }),
      ]),
    );
  });

  it('rejects a row with missing co2_emissions_g_km', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { co2_emissions_g_km: null },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.co2_emissions_g_km',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a row with missing annual_km', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { annual_km: null },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.annual_km',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a passenger row without occupancy_profile_code', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { occupancy_profile_code: null },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.occupancy_profile_code',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a goods row without load_profile_code', () => {
    const draft = buildCompleteGoodsDraft(certificationId, {
      vehicle: buildGoodsVehicle({
        fields: { load_profile_code: null },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.load_profile_code',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a goods row without goods_vehicle_over_3_5_tons', () => {
    const draft = buildCompleteGoodsDraft(certificationId, {
      vehicle: buildGoodsVehicle({
        fields: {
          goods_vehicle_over_3_5_tons: null,
        },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.goods_vehicle_over_3_5_tons',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a goods row when only legacy goods_vehicle_over_2_5_tons is a boolean', () => {
    const draft = buildCompleteGoodsDraft(certificationId, {
      vehicle: buildGoodsVehicle({
        fields: {
          goods_vehicle_over_3_5_tons: null,
          goods_vehicle_over_2_5_tons: true,
        },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.goods_vehicle_over_3_5_tons',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a GPL row without alt-fuel WLTP', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: {
          fuel_type: 'gpl',
          wltp_co2_g_km_alt_fuel: null,
        },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.wltp_co2_g_km_alt_fuel',
          code: 'required',
        }),
      ]),
    );
  });

  it('rejects a Metano row without alt-fuel WLTP', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: {
          fuel_type: 'metano',
          wltp_co2_g_km_alt_fuel: null,
        },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
  });

  it('accepts a non-GPL/non-Metano row without alt-fuel WLTP', () => {
    const result = validateTransportV2Block2SubmitPayload(
      buildCompletePassengerDraft(certificationId, {
        vehicle: buildPassengerVehicle({
          fields: {
            fuel_type: 'diesel',
            wltp_co2_g_km_alt_fuel: null,
          },
        }),
      }),
    );

    expect(result.valid).toBe(true);
  });

  it('rejects a utilization code outside 1..6', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { occupancy_profile_code: 7 },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.vehicles[0].fields.occupancy_profile_code',
          code: 'out_of_range',
        }),
      ]),
    );
  });

  it('rejects negative annual_km', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { annual_km: -1 },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
  });

  it('rejects negative co2_emissions_g_km', () => {
    const draft = buildCompletePassengerDraft(certificationId, {
      vehicle: buildPassengerVehicle({
        fields: { co2_emissions_g_km: -1 },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
  });

  it('rejects negative alternate-fuel CO2 (wltp_co2_g_km_alt_fuel) for dual-fuel vehicles', () => {
    const draft = buildCompleteGoodsDraft(certificationId, {
      vehicle: buildGoodsVehicle({
        fields: {
          fuel_type: 'gpl',
          co2_emissions_g_km: 100,
          wltp_co2_g_km_alt_fuel: -1,
        },
      }),
    });

    const result = validateTransportV2Block2SubmitPayload(draft);

    expect(result.valid).toBe(false);
  });
});
