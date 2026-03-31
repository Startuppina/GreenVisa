const request = require('supertest');
const surveyResponsesRepository = require('../../repositories/surveyResponsesRepository');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  countSurveyResponses,
  createCertificationFixture,
  createDocumentBatchFixture,
  createDocumentFixture,
  createDocumentResultFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getDocumentFixtureById,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

afterEach(() => {
  vi.restoreAllMocks();
});

function buildConfirmedOutput(documentId) {
  return {
    fields: [],
    validationIssues: [],
    transport_v2_vehicle_prefill: {
      vehicle_id: `ocr-doc-${documentId}`,
      transport_mode: null,
      ocr_document_id: documentId,
      fields: {
        registration_year: 2020,
        euro_class: 'EURO_6',
        fuel_type: 'diesel',
        wltp_co2_g_km: null,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: true,
        occupancy_profile_code: null,
        load_profile_code: null,
        last_revision_date: null,
        blue_sticker: null,
        annual_km: null,
      },
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    },
  };
}

describe('document apply persistence guarantees', () => {
  it('sets applied_at, links the survey response, and keeps one survey_responses row', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-persist-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-persist-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const surveyResponse = await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {},
    });
    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      ocrStatus: 'confirmed',
    });
    await createDocumentResultFixture({
      documentId: doc.id,
      confirmedOutput: buildConfirmedOutput(doc.id),
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(200);

    const document = await getDocumentFixtureById(doc.id);
    expect(document.ocr_status).toBe('applied');
    expect(document.applied_at).toBeTruthy();
    expect(document.survey_response_id).toBe(surveyResponse.id);
    expect(await countSurveyResponses({ userId: user.id, certificationId: certification.id })).toBe(1);
  });

  it('rolls back cleanly when draft persistence fails during apply', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-rollback-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-rollback-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: {
          untouched: true,
        },
      },
    });
    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      ocrStatus: 'confirmed',
    });
    await createDocumentResultFixture({
      documentId: doc.id,
      confirmedOutput: buildConfirmedOutput(doc.id),
    });
    vi.spyOn(surveyResponsesRepository, 'saveTransportV2').mockRejectedValueOnce(new Error('forced save failure'));

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(500);

    const document = await getDocumentFixtureById(doc.id);
    const surveyResponse = await getSurveyResponse({
      userId: user.id,
      certificationId: certification.id,
    });

    expect(document.ocr_status).toBe('confirmed');
    expect(document.applied_at).toBeNull();
    expect(surveyResponse.survey_data.legacy_key).toEqual({ untouched: true });
    expect(surveyResponse.survey_data.transport_v2).toBeUndefined();
  });
});
