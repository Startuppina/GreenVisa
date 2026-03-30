const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

function createSubmitReadyTransportV2Draft(certificationId) {
  return {
    meta: {
      version: 1,
      certification_id: certificationId,
      entry_mode: 'form',
      status: 'draft',
      started_at: '2026-03-30T10:00:00.000Z',
      updated_at: '2026-03-30T10:05:00.000Z',
      submitted_at: null,
    },
    draft: {
      questionnaire_flags: {
        compliance_with_vehicle_regulations: true,
        uses_navigator: true,
        uses_class_a_tires: 'some',
        eco_drive_training: 'all',
        interested_in_mobility_manager_course: false,
        interested_in_second_level_certification: true,
      },
      vehicles: [
        {
          vehicle_id: 'passenger-1',
          transport_mode: 'passenger',
          ocr_document_id: null,
          fields: {
            registration_year: 2020,
            euro_class: 'EURO_6',
            fuel_type: 'diesel',
            wltp_homologation: true,
            wltp_co2_g_km: 100,
            wltp_co2_g_km_alt_fuel: null,
            goods_vehicle_over_3_5_tons: null,
            occupancy_profile_code: 4,
            load_profile_code: null,
            last_revision_date: '2025-06-01',
            blue_sticker: true,
            annual_km: 10000,
          },
          field_sources: {},
          field_warnings: {},
          row_notes: null,
        },
        {
          vehicle_id: 'goods-1',
          transport_mode: 'goods',
          ocr_document_id: null,
          fields: {
            registration_year: 2019,
            euro_class: 'EURO_5',
            fuel_type: 'gpl',
            wltp_homologation: true,
            wltp_co2_g_km: 100,
            wltp_co2_g_km_alt_fuel: 140,
            goods_vehicle_over_3_5_tons: true,
            occupancy_profile_code: null,
            load_profile_code: 3,
            last_revision_date: '2024-03-15',
            blue_sticker: false,
            annual_km: 20000,
          },
          field_sources: {},
          field_warnings: {},
          row_notes: null,
        },
      ],
    },
    derived: {},
    results: {},
  };
}

describe('POST /api/transport-v2/:certificationId/submit', () => {
  it('rejects unauthenticated submit requests', async () => {
    const response = await request(app).post('/api/transport-v2/123/submit');

    expect(response.status).toBe(401);
  });

  it('rejects submit for inaccessible certifications', async () => {
    const userA = await createUserFixture({ suffix: 'submit-auth-a' });
    const userB = await createUserFixture({ suffix: 'submit-auth-b' });
    const certification = await createCertificationFixture({ suffix: 'submit-auth-cert' });
    await grantCertificationAccess({ userId: userB.id, certificationId: certification.id });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(403);
  });

  it('rejects incomplete drafts on submit', async () => {
    const user = await createUserFixture({ suffix: 'submit-invalid-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-invalid-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: {
          meta: {
            version: 1,
            certification_id: certification.id,
            entry_mode: 'form',
            status: 'draft',
            started_at: '2026-03-30T10:00:00.000Z',
            updated_at: '2026-03-30T10:05:00.000Z',
            submitted_at: null,
          },
          draft: {
            questionnaire_flags: {
              compliance_with_vehicle_regulations: true,
            },
            vehicles: [],
          },
          derived: {},
          results: {},
        },
      },
    });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'draft.questionnaire_flags.uses_navigator',
          code: 'required',
        }),
        expect.objectContaining({
          field: 'draft.vehicles',
          code: 'required',
        }),
      ]),
    );
  });

  it('computes backend-owned results from the stored draft and updates summary columns', async () => {
    const user = await createUserFixture({ suffix: 'submit-success-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-success-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: {
          preserved: true,
        },
        transport_v2: createSubmitReadyTransportV2Draft(certification.id),
      },
      totalScore: 0,
      co2emissions: 0,
      completed: false,
    });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .send({
        total_score: 999,
        co2emissions: 999,
      });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.meta.status).toBe('submitted');
    expect(response.body.transport_v2.meta.submitted_at).toBeTruthy();
    expect(response.body.transport_v2.derived).toEqual({
      vehicle_counts: {
        total: 2,
        passenger: 1,
        goods: 1,
      },
      registration_year_counts: {
        2019: 1,
        2020: 1,
      },
      euro_class_counts: {
        EURO_6: 1,
        EURO_5: 1,
      },
      fuel_type_counts: {
        diesel: 1,
        gpl: 1,
      },
      revision_year_counts: {
        2025: 1,
        2024: 1,
      },
      blue_sticker_counts: {
        true: 1,
        false: 1,
      },
      annual_km: {
        total: 30000,
        passenger: 10000,
        goods: 20000,
      },
    });
    expect(response.body.transport_v2.results.calculator_version).toBe('transport_v2_v1');
    expect(response.body.transport_v2.results.co2).toEqual({
      total_tons_per_year: 3.4,
      passenger_tons_per_year: 1,
      goods_tons_per_year: 2.4,
    });
    expect(response.body.transport_v2.results.score).toEqual({
      passenger_score: 6.6,
      goods_score: 6.5,
      total_score: 6.55,
    });

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.legacy_key).toEqual({ preserved: true });
    expect(row.survey_data.transport_v2.meta.status).toBe('submitted');
    expect(row.survey_data.transport_v2.draft).toEqual(
      createSubmitReadyTransportV2Draft(certification.id).draft,
    );
    expect(Number(row.total_score)).toBe(6.55);
    expect(Number(row.co2emissions)).toBe(3.4);
    expect(row.completed).toBe(true);
  });

  it('supports deterministic resubmission from the current stored draft', async () => {
    const user = await createUserFixture({ suffix: 'submit-repeat-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-repeat-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const transportV2 = createSubmitReadyTransportV2Draft(certification.id);
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: transportV2,
      },
    });

    await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    transportV2.draft.vehicles[1].fields.annual_km = 10000;
    const updateResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: transportV2.draft,
      });

    expect(updateResponse.status).toBe(200);

    const secondSubmit = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    expect(secondSubmit.body.transport_v2.results.co2.total_tons_per_year).toBe(2.2);
    expect(secondSubmit.body.transport_v2.results.score.total_score).toBe(6.55);
  });
});
