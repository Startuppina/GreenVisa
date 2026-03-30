const { buildTransportV2Derived } = require('../../services/transportV2DerivedBuilder');
const { buildGoodsVehicle, buildPassengerVehicle } = require('../helpers/fixtures');

describe('buildTransportV2Derived', () => {
  it('counts total, passenger, and goods vehicles', () => {
    const derived = buildTransportV2Derived({
      vehicles: [buildPassengerVehicle(), buildGoodsVehicle()],
    });

    expect(derived.vehicle_counts).toEqual({
      total: 2,
      passenger: 1,
      goods: 1,
    });
  });

  it('builds year, euro, fuel, revision, and blue sticker counts', () => {
    const derived = buildTransportV2Derived({
      vehicles: [
        buildPassengerVehicle({
          fields: {
            registration_year: 2020,
            euro_class: 'EURO_6',
            fuel_type: 'diesel',
            last_revision_date: '2025-06-01',
            blue_sticker: true,
            annual_km: 10000,
          },
        }),
        buildGoodsVehicle({
          fields: {
            registration_year: 2019,
            euro_class: 'EURO_5',
            fuel_type: 'gpl',
            last_revision_date: '2024-03-15',
            blue_sticker: false,
            annual_km: 20000,
          },
        }),
      ],
    });

    expect(derived.registration_year_counts).toEqual({
      2019: 1,
      2020: 1,
    });
    expect(derived.euro_class_counts).toEqual({
      EURO_6: 1,
      EURO_5: 1,
    });
    expect(derived.fuel_type_counts).toEqual({
      diesel: 1,
      gpl: 1,
    });
    expect(derived.revision_year_counts).toEqual({
      2025: 1,
      2024: 1,
    });
    expect(derived.blue_sticker_counts).toEqual({
      true: 1,
      false: 1,
    });
  });

  it('sums annual_km totals by total, passenger, and goods', () => {
    const derived = buildTransportV2Derived({
      vehicles: [
        buildPassengerVehicle({ fields: { annual_km: 12000 } }),
        buildPassengerVehicle({
          vehicle_id: 'passenger-2',
          fields: { annual_km: 8000, registration_year: 2021 },
        }),
        buildGoodsVehicle({ fields: { annual_km: 25000 } }),
      ],
    });

    expect(derived.annual_km).toEqual({
      total: 45000,
      passenger: 20000,
      goods: 25000,
    });
  });

  it('is deterministic and has no side effects on input vehicles', () => {
    const input = {
      vehicles: [
        buildPassengerVehicle(),
        buildGoodsVehicle(),
      ],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    const first = buildTransportV2Derived(input);
    const second = buildTransportV2Derived(input);

    expect(first).toEqual(second);
    expect(input).toEqual(snapshot);
  });
});
