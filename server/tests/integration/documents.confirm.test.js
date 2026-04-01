const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildMinimalPdfBuffer,
  createCertificationFixture,
  createUserFixture,
  getDocumentFixtureById,
  getDocumentResultFixtureByDocumentId,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { useDocAiSuccessByDefault } = require('../helpers/docAiTestStub');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();
useDocAiSuccessByDefault();

async function uploadAndFetchResult({ user, certificationId }) {
  const uploadResponse = await request(app)
    .post('/api/documents/upload')
    .set('Cookie', authCookieForUser(user))
    .field('category', 'transport')
    .field('certificationId', String(certificationId))
    .attach('files', buildMinimalPdfBuffer(), {
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

  const documentId = uploadResponse.body.documents[0].documentId;
  const resultResponse = await request(app)
    .get(`/api/documents/${documentId}/result`)
    .set('Cookie', authCookieForUser(user));

  return {
    documentId,
    fields: resultResponse.body.normalizedOutput.fields,
  };
}

describe('POST /api/documents/:documentId/confirm', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/documents/123/confirm')
      .send({ fields: [] });

    expect(response.status).toBe(401);
  });

  it('enforces ownership, stores confirmed output, and does not mutate the draft yet', async () => {
    const owner = await createUserFixture({ suffix: 'docs-confirm-owner' });
    const intruder = await createUserFixture({ suffix: 'docs-confirm-intruder' });
    const certification = await createCertificationFixture({ suffix: 'docs-confirm-cert' });
    await grantCertificationAccess({ userId: owner.id, certificationId: certification.id });
    const { documentId, fields } = await uploadAndFetchResult({
      user: owner,
      certificationId: certification.id,
    });

    const forbiddenResponse = await request(app)
      .post(`/api/documents/${documentId}/confirm`)
      .set('Cookie', authCookieForUser(intruder))
      .send({ fields });

    expect(forbiddenResponse.status).toBe(403);

    const response = await request(app)
      .post(`/api/documents/${documentId}/confirm`)
      .set('Cookie', authCookieForUser(owner))
      .send({ fields });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('confirmed');
    expect(response.body.confirmedOutput.transport_v2_vehicle_prefill).toEqual(
      expect.objectContaining({
        ocr_document_id: documentId,
      }),
    );

    const document = await getDocumentFixtureById(documentId);
    const result = await getDocumentResultFixtureByDocumentId(documentId);
    const surveyResponse = await getSurveyResponse({
      userId: owner.id,
      certificationId: certification.id,
    });

    expect(document.ocr_status).toBe('confirmed');
    expect(result.confirmed_output).toEqual(
      expect.objectContaining({
        transport_v2_vehicle_prefill: expect.objectContaining({
          ocr_document_id: documentId,
        }),
      }),
    );
    expect(surveyResponse.survey_data.transport_v2).toBeUndefined();
  });
});
