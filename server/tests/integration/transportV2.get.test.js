const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  getTransportV2FromRow,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

describe('GET /api/transport-v2/:certificationId', () => {
  it('creates and returns a canonical draft when the anchor row is missing', async () => {
    const user = await createUserFixture({ suffix: 'get-create-user' });
    const certification = await createCertificationFixture({ suffix: 'get-create-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.meta.certification_id).toBe(certification.id);
    expect(response.body.transport_v2.meta).not.toHaveProperty('entry_mode');
    expect(response.body.transport_v2.meta.status).toBe('draft');
    expect(response.body.transport_v2.meta.submitted_at).toBeNull();
    expect(response.body.transport_v2.draft).toEqual({
      questionnaire_flags: {},
      vehicles: [],
    });
    expect(response.body.transport_v2.derived).toEqual({});
    expect(response.body.transport_v2.results).toEqual({});

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row).not.toBeNull();
    expect(row.survey_data.transport_v2).toEqual(response.body.transport_v2);
  });

  it('initializes transport_v2 on an existing row with survey_data = null', async () => {
    const user = await createUserFixture({ suffix: 'get-null-user' });
    const certification = await createCertificationFixture({ suffix: 'get-null-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: null,
    });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(getTransportV2FromRow(row)).toEqual(response.body.transport_v2);
  });

  it('preserves unrelated survey_data keys when initializing transport_v2', async () => {
    const user = await createUserFixture({ suffix: 'get-legacy-user' });
    const certification = await createCertificationFixture({ suffix: 'get-legacy-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        some_other_key: { a: 1 },
      },
    });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.some_other_key).toEqual({ a: 1 });
    expect(row.survey_data.transport_v2).toEqual(response.body.transport_v2);
  });

  it('loads an existing transport_v2 draft without resetting preserved values', async () => {
    const user = await createUserFixture({ suffix: 'get-existing-user' });
    const certification = await createCertificationFixture({ suffix: 'get-existing-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const existingTransportV2 = {
      meta: {
        version: 1,
        certification_id: certification.id,
        status: 'draft',
        started_at: '2026-03-30T10:00:00.000Z',
        updated_at: '2026-03-30T10:00:00.000Z',
        submitted_at: null,
      },
      draft: {
        questionnaire_flags: {
          uses_navigator: true,
        },
        vehicles: [
          {
            vehicle_id: 'vehicle-1',
            transport_mode: 'goods',
            ocr_document_id: null,
            fields: {
              registration_year: 2020,
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

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: existingTransportV2,
      },
    });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.transport_v2).toEqual(existingTransportV2);
  });

  it('returns and persists a canonical shape for partially malformed stored transport_v2 data', async () => {
    const user = await createUserFixture({ suffix: 'get-malformed-user' });
    const certification = await createCertificationFixture({ suffix: 'get-malformed-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: {
          meta: {
            certification_id: certification.id,
            started_at: '2026-03-30T10:00:00.000Z',
          },
          draft: {
            vehicles: [
              {
                vehicle_id: 'ocr-1',
                fields: {
                  fuel_type: 'diesel',
                },
              },
            ],
          },
        },
      },
    });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.meta.version).toBe(1);
    expect(response.body.transport_v2.meta.status).toBe('draft');
    expect(response.body.transport_v2.meta.certification_id).toBe(certification.id);
    expect(response.body.transport_v2.meta.started_at).toBe('2026-03-30T10:00:00.000Z');
    expect(response.body.transport_v2.meta.submitted_at).toBeNull();
    expect(response.body.transport_v2.draft.questionnaire_flags).toEqual({});
    expect(response.body.transport_v2.draft.vehicles[0]).toEqual({
      vehicle_id: 'ocr-1',
      transport_mode: null,
      ocr_document_id: null,
      fields: {
        fuel_type: 'diesel',
      },
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
    expect(response.body.transport_v2.derived).toEqual({});
    expect(response.body.transport_v2.results).toEqual({});

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2).toEqual(response.body.transport_v2);
  });

  it('does not populate submit-time outputs on load', async () => {
    const user = await createUserFixture({ suffix: 'get-final-user' });
    const certification = await createCertificationFixture({ suffix: 'get-final-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.meta.status).toBe('draft');
    expect(response.body.transport_v2.meta.submitted_at).toBeNull();
    expect(response.body.transport_v2.derived).toEqual({});
    expect(response.body.transport_v2.results).toEqual({});
  });
});
