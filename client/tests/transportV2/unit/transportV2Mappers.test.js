import { describe, expect, it } from 'vitest';
import { normalizeTransportV2Envelope } from '../../../src/features/transportV2/api/transportV2Mappers.js';

describe('normalizeTransportV2Envelope', () => {
  it('coerces string integer vehicle fields including co2_emissions_g_km from API payloads', () => {
    const payload = {
      transport_v2: {
        meta: { certification_id: 9, version: 1 },
        draft: {
          questionnaire_flags: {},
          vehicles: [
            {
              vehicle_id: 'v-1',
              transport_mode: 'goods',
              ocr_document_id: 77,
              fields: {
                registration_year: '2018',
                euro_class: 'EURO_5',
                fuel_type: 'diesel',
                co2_emissions_g_km: '143',
                wltp_co2_g_km_alt_fuel: null,
                annual_km: '12000',
                occupancy_profile_code: null,
                load_profile_code: '4',
              },
              field_sources: {},
              field_warnings: {},
              row_notes: null,
            },
          ],
        },
      },
    };

    const normalized = normalizeTransportV2Envelope(payload, 9);
    const fields = normalized.draft.vehicles[0].fields;

    expect(fields.registration_year).toBe(2018);
    expect(fields.co2_emissions_g_km).toBe(143);
    expect(fields.annual_km).toBe(12000);
    expect(fields.load_profile_code).toBe(4);
  });
});
