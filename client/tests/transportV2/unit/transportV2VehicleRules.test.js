import { describe, expect, it } from 'vitest';
import {
  getVisibleVehicleFieldKeys,
  normalizeVehicleForTransportMode,
} from '../../../src/transportV2/transportV2VehicleRules.js';

describe('getVisibleVehicleFieldKeys', () => {
  it('passenger includes occupancy_profile_code and excludes goods-only fields', () => {
    const keys = getVisibleVehicleFieldKeys('passenger');
    expect(keys).toContain('occupancy_profile_code');
    expect(keys).not.toContain('goods_vehicle_over_3_5_tons');
    expect(keys).not.toContain('load_profile_code');
  });

  it('goods includes goods-only fields and excludes passenger-only field', () => {
    const keys = getVisibleVehicleFieldKeys('goods');
    expect(keys).toContain('goods_vehicle_over_3_5_tons');
    expect(keys).toContain('load_profile_code');
    expect(keys).not.toContain('occupancy_profile_code');
  });
});

describe('normalizeVehicleForTransportMode', () => {
  it('switching to passenger nulls load_profile_code', () => {
    const vehicle = {
      vehicle_id: 'a',
      transport_mode: 'goods',
      fields: {
        load_profile_code: 3,
        occupancy_profile_code: null,
        annual_km: 100,
      },
    };
    const next = normalizeVehicleForTransportMode(vehicle, 'passenger');
    expect(next.transport_mode).toBe('passenger');
    expect(next.fields.load_profile_code).toBeNull();
    expect(next.fields.goods_vehicle_over_3_5_tons).toBeNull();
  });

  it('switching to goods nulls occupancy_profile_code', () => {
    const vehicle = {
      vehicle_id: 'b',
      transport_mode: 'passenger',
      fields: {
        occupancy_profile_code: 2,
        load_profile_code: null,
        euro_class: 'EURO_6',
      },
    };
    const next = normalizeVehicleForTransportMode(vehicle, 'goods');
    expect(next.transport_mode).toBe('goods');
    expect(next.fields.occupancy_profile_code).toBeNull();
  });

  it('switching to goods preserves allowed common fields', () => {
    const vehicle = {
      vehicle_id: 'c',
      fields: {
        annual_km: 5000,
        euro_class: 'EURO_5',
        fuel_type: 'diesel',
        occupancy_profile_code: 1,
      },
    };
    const next = normalizeVehicleForTransportMode(vehicle, 'goods');
    expect(next.fields.annual_km).toBe(5000);
    expect(next.fields.euro_class).toBe('EURO_5');
    expect(next.fields.fuel_type).toBe('diesel');
  });

  it('handles already-null and missing fields safely', () => {
    const vehicle = { vehicle_id: 'd', fields: {} };
    const nextPassenger = normalizeVehicleForTransportMode(vehicle, 'passenger');
    expect(nextPassenger.fields.load_profile_code).toBeNull();
    const nextGoods = normalizeVehicleForTransportMode(nextPassenger, 'goods');
    expect(nextGoods.fields.occupancy_profile_code).toBeNull();
  });

  it('does not mutate the original vehicle object', () => {
    const vehicle = {
      vehicle_id: 'e',
      transport_mode: 'passenger',
      fields: { occupancy_profile_code: 2, annual_km: 1 },
    };
    const snapshot = JSON.stringify(vehicle);
    normalizeVehicleForTransportMode(vehicle, 'goods');
    expect(JSON.stringify(vehicle)).toBe(snapshot);
  });
});
