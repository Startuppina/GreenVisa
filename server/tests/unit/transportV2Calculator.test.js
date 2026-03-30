const {
  calculateVehicleResult,
  calculateSectionResult,
  calculateTransportV2Results,
  getEffectiveEmissionsGKm,
  getEmissionClass,
  getPenalty,
} = require('../../services/transportV2Calculator');
const {
  buildGoodsVehicle,
  buildPassengerVehicle,
} = require('../helpers/fixtures');

describe('transportV2Calculator', () => {
  it('uses only the primary WLTP value for standard fuels', () => {
    const vehicleResult = calculateVehicleResult(
      buildPassengerVehicle({
        fields: {
          fuel_type: 'diesel',
          annual_km: 10000,
          wltp_co2_g_km: 150,
          occupancy_profile_code: 6,
        },
      }),
      'passenger',
    );

    expect(vehicleResult.effective_emissions_g_km).toBe(150);
    expect(vehicleResult.annual_co2_g).toBe(1500000);
  });

  it('uses the average of the two WLTP values for GPL vehicles', () => {
    const result = getEffectiveEmissionsGKm({
      fuel_type: 'gpl',
      wltp_co2_g_km: 100,
      wltp_co2_g_km_alt_fuel: 140,
    });

    expect(result).toBe(120);
  });

  it('uses the average of the two WLTP values for Metano vehicles', () => {
    const result = getEffectiveEmissionsGKm({
      fuel_type: 'metano',
      wltp_co2_g_km: 90,
      wltp_co2_g_km_alt_fuel: 150,
    });

    expect(result).toBe(120);
  });

  it('preserves decimal precision for averaged alternate-fuel emissions', () => {
    const result = getEffectiveEmissionsGKm({
      fuel_type: 'gpl',
      wltp_co2_g_km: 101,
      wltp_co2_g_km_alt_fuel: 100,
    });

    expect(result).toBe(100.5);
  });

  it('preserves passenger class threshold behavior', () => {
    expect(getEmissionClass('passenger', 0).class).toBe('A');
    expect(getEmissionClass('passenger', 51).class).toBe('C');
    expect(getEmissionClass('passenger', 80).class).toBe('C');
    expect(getEmissionClass('passenger', 101).class).toBe('E');
  });

  it('preserves the legacy freight overlap behavior at 50 g/km', () => {
    const emissionClass = getEmissionClass('goods', 50);

    expect(emissionClass).toEqual({
      class: 'B',
      minEmissions: 1,
      maxEmissions: 50,
      maxScore: 90,
    });
  });

  it('preserves other freight class threshold behavior', () => {
    expect(getEmissionClass('goods', 51).class).toBe('C');
    expect(getEmissionClass('goods', 301).class).toBe('H');
  });

  it('preserves the exact penalty map values', () => {
    expect(getPenalty(1)).toBe(9);
    expect(getPenalty(2)).toBe(8);
    expect(getPenalty(3)).toBe(5);
    expect(getPenalty(4)).toBe(4);
    expect(getPenalty(5)).toBe(2);
    expect(getPenalty(6)).toBe(0);
  });

  it('preserves the per-vehicle raw score formula', () => {
    const result = calculateVehicleResult(
      buildPassengerVehicle({
        fields: {
          fuel_type: 'diesel',
          wltp_co2_g_km: 120,
          annual_km: 10000,
          occupancy_profile_code: 4,
        },
      }),
      'passenger',
    );

    expect(result).toEqual({
      effective_emissions_g_km: 120,
      annual_co2_g: 1200000,
      emission_class: 'E',
      vehicle_score_raw: 56,
    });
  });

  it('preserves the section score formula as average raw score divided by 10', () => {
    const result = calculateSectionResult(
      [
        buildPassengerVehicle({
          vehicle_id: 'p1',
          fields: {
            wltp_co2_g_km: 120,
            occupancy_profile_code: 4,
            annual_km: 10000,
          },
        }),
        buildPassengerVehicle({
          vehicle_id: 'p2',
          fields: {
            wltp_co2_g_km: 90,
            occupancy_profile_code: 4,
            annual_km: 10000,
          },
        }),
      ],
      'passenger',
    );

    expect(result.score).toBe(6.1);
  });

  it('preserves the section CO2 conversion from grams to tons', () => {
    const result = calculateSectionResult(
      [
        buildPassengerVehicle({
          fields: {
            annual_km: 10000,
            wltp_co2_g_km: 150,
            occupancy_profile_code: 6,
          },
        }),
        buildPassengerVehicle({
          vehicle_id: 'p2',
          fields: {
            annual_km: 13000,
            wltp_co2_g_km: 150,
            occupancy_profile_code: 6,
          },
        }),
      ],
      'passenger',
    );

    expect(result.co2_tons_per_year).toBe(3.45);
  });

  it('returns zero score and zero CO2 for an empty section', () => {
    const result = calculateSectionResult([], 'passenger');

    expect(result).toEqual({
      vehicle_count: 0,
      score: 0,
      co2_tons_per_year: 0,
    });
  });

  it('returns zero score and zero CO2 for an empty goods section', () => {
    const result = calculateSectionResult([], 'goods');

    expect(result).toEqual({
      vehicle_count: 0,
      score: 0,
      co2_tons_per_year: 0,
    });
  });

  it('preserves the legacy final formula across passenger and goods sections', () => {
    const results = calculateTransportV2Results(
      {
        vehicles: [
          buildPassengerVehicle({
            fields: {
              fuel_type: 'diesel',
              annual_km: 10000,
              wltp_co2_g_km: 100,
              occupancy_profile_code: 4,
            },
          }),
          buildGoodsVehicle({
            fields: {
              fuel_type: 'gpl',
              annual_km: 20000,
              wltp_co2_g_km: 100,
              wltp_co2_g_km_alt_fuel: 140,
              load_profile_code: 3,
            },
          }),
        ],
      },
      {
        calculatedAt: '2026-03-30T10:20:00.000Z',
      },
    );

    expect(results.co2).toEqual({
      total_tons_per_year: 3.4,
      passenger_tons_per_year: 1,
      goods_tons_per_year: 2.4,
    });
    expect(results.score).toEqual({
      passenger_score: 6.6,
      goods_score: 6.5,
      total_score: 6.55,
    });
  });

  it('is deterministic for repeated runs on the same draft', () => {
    const draft = {
      vehicles: [
        buildPassengerVehicle(),
        buildGoodsVehicle(),
      ],
    };

    expect(
      calculateTransportV2Results(draft, { calculatedAt: '2026-03-30T10:20:00.000Z' }),
    ).toEqual(
      calculateTransportV2Results(draft, { calculatedAt: '2026-03-30T10:20:00.000Z' }),
    );
  });

  it('matches the one passenger diesel golden case', () => {
    const results = calculateTransportV2Results(
      {
        vehicles: [
          buildPassengerVehicle({
            fields: {
              annual_km: 10000,
              fuel_type: 'diesel',
              wltp_co2_g_km: 120,
              occupancy_profile_code: 4,
            },
          }),
        ],
      },
      { calculatedAt: '2026-03-30T10:20:00.000Z' },
    );

    expect(results.co2.total_tons_per_year).toBe(1.2);
    expect(results.score.passenger_score).toBe(5.6);
    expect(results.score.goods_score).toBe(0);
    expect(results.score.total_score).toBe(2.8);
  });

  it('matches the one goods diesel golden case', () => {
    const results = calculateTransportV2Results(
      {
        vehicles: [
          buildGoodsVehicle({
            fields: {
              annual_km: 20000,
              fuel_type: 'diesel',
              wltp_co2_g_km: 280,
              load_profile_code: 2,
            },
          }),
        ],
      },
      { calculatedAt: '2026-03-30T10:20:00.000Z' },
    );

    expect(results.co2.total_tons_per_year).toBe(5.6);
    expect(results.score.goods_score).toBe(3.2);
    expect(results.score.total_score).toBe(1.6);
  });

  it('matches the one GPL passenger golden case', () => {
    const results = calculateTransportV2Results(
      {
        vehicles: [
          buildPassengerVehicle({
            fields: {
              annual_km: 10000,
              fuel_type: 'gpl',
              wltp_co2_g_km: 100,
              wltp_co2_g_km_alt_fuel: 140,
              occupancy_profile_code: 6,
            },
          }),
        ],
      },
      { calculatedAt: '2026-03-30T10:20:00.000Z' },
    );

    expect(results.co2.total_tons_per_year).toBe(1.2);
    expect(results.score.passenger_score).toBe(6);
    expect(results.score.total_score).toBe(3);
  });

  it('averages two vehicles in the same passenger section correctly', () => {
    const results = calculateTransportV2Results(
      {
        vehicles: [
          buildPassengerVehicle({
            vehicle_id: 'p1',
            fields: {
              annual_km: 10000,
              wltp_co2_g_km: 120,
              occupancy_profile_code: 4,
            },
          }),
          buildPassengerVehicle({
            vehicle_id: 'p2',
            fields: {
              annual_km: 10000,
              wltp_co2_g_km: 120,
              occupancy_profile_code: 6,
            },
          }),
        ],
      },
      { calculatedAt: '2026-03-30T10:20:00.000Z' },
    );

    expect(results.score.passenger_score).toBe(5.8);
    expect(results.score.total_score).toBe(2.9);
  });

  it('locks the goods threshold overlap golden case at exactly 50 g/km', () => {
    const result = calculateVehicleResult(
      buildGoodsVehicle({
        fields: {
          annual_km: 10000,
          fuel_type: 'diesel',
          wltp_co2_g_km: 50,
          load_profile_code: 6,
        },
      }),
      'goods',
    );

    expect(result).toEqual({
      effective_emissions_g_km: 50,
      annual_co2_g: 500000,
      emission_class: 'B',
      vehicle_score_raw: 90,
    });
  });
});
