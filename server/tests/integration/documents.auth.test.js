const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildCompleteQuestionnaireFlags,
  createCertificationFixture,
  createDocumentBatchFixture,
  createDocumentFixture,
  createDocumentResultFixture,
  createSurveyResponseFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

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
        co2_emissions_g_km: null,
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

describe('document route authorization', () => {
  it('lists only the authenticated user documents', async () => {
    const userA = await createUserFixture({ suffix: 'docs-auth-user-a' });
    const userB = await createUserFixture({ suffix: 'docs-auth-user-b' });
    const batchA = await createDocumentBatchFixture({ userId: userA.id });
    const batchB = await createDocumentBatchFixture({ userId: userB.id });

    await createDocumentFixture({
      batchId: batchA.id,
      userId: userA.id,
      originalName: 'owner-a.pdf',
    });
    await createDocumentFixture({
      batchId: batchB.id,
      userId: userB.id,
      originalName: 'owner-b.pdf',
    });

    const response = await request(app)
      .get('/api/documents/user')
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].fileName).toBe('owner-a.pdf');
  });

  it('prevents batch and apply tampering across users', async () => {
    const owner = await createUserFixture({ suffix: 'docs-auth-owner' });
    const intruder = await createUserFixture({ suffix: 'docs-auth-intruder' });
    const certification = await createCertificationFixture({ suffix: 'docs-auth-cert' });
    await grantCertificationAccess({ userId: owner.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: owner.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: {
          meta: {
            version: 1,
            certification_id: certification.id,
            status: 'draft',
            started_at: '2026-03-30T10:00:00.000Z',
            updated_at: '2026-03-30T10:00:00.000Z',
            submitted_at: null,
          },
          draft: {
            questionnaire_flags: buildCompleteQuestionnaireFlags(),
            vehicles: [],
          },
          derived: {},
          results: {},
        },
      },
    });

    const batch = await createDocumentBatchFixture({ userId: owner.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: owner.id,
      ocrStatus: 'confirmed',
    });
    await createDocumentResultFixture({
      documentId: doc.id,
      confirmedOutput: buildConfirmedOutput(doc.id),
    });

    const batchResponse = await request(app)
      .get(`/api/document-batches/${batch.id}`)
      .set('Cookie', authCookieForUser(intruder));

    expect(batchResponse.status).toBe(403);

    const applyResponse = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(intruder))
      .send({
        certificationId: certification.id,
      });

    expect(applyResponse.status).toBe(403);
  });
});
