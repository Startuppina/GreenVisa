const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildMinimalPdfBuffer,
  createCertificationFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

async function uploadTransportDocument({ user, certificationId }) {
  const response = await request(app)
    .post('/api/documents/upload')
    .set('Cookie', authCookieForUser(user))
    .field('category', 'transport')
    .field('certificationId', String(certificationId))
    .attach('files', buildMinimalPdfBuffer(), {
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

  return response.body.documents[0].documentId;
}

describe('GET /api/documents/:documentId/result', () => {
  it('lets the owner fetch the OCR result including Transport V2 prefill data', async () => {
    const user = await createUserFixture({ suffix: 'docs-result-owner-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-result-owner-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const documentId = await uploadTransportDocument({ user, certificationId: certification.id });

    const response = await request(app)
      .get(`/api/documents/${documentId}/result`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.documentId).toBe(documentId);
    expect(response.body.status).toBe('needs_review');
    expect(response.body.normalizedOutput).toEqual(
      expect.objectContaining({
        fields: expect.any(Array),
        transport_v2_vehicle_prefill: expect.objectContaining({
          ocr_document_id: documentId,
        }),
      }),
    );
    expect(response.body.reviewPayload).toEqual(
      expect.objectContaining({
        fields: expect.any(Array),
        transport_v2_vehicle_prefill: expect.any(Object),
      }),
    );
    expect(response.body.transportV2VehiclePrefill).toEqual(
      expect.objectContaining({
        ocr_document_id: documentId,
        fields: expect.any(Object),
        field_sources: expect.any(Object),
      }),
    );
  });

  it('blocks non-owners from fetching OCR results', async () => {
    const owner = await createUserFixture({ suffix: 'docs-result-owner-2' });
    const intruder = await createUserFixture({ suffix: 'docs-result-intruder' });
    const certification = await createCertificationFixture({ suffix: 'docs-result-cert-2' });
    await grantCertificationAccess({ userId: owner.id, certificationId: certification.id });
    const documentId = await uploadTransportDocument({ user: owner, certificationId: certification.id });

    const response = await request(app)
      .get(`/api/documents/${documentId}/result`)
      .set('Cookie', authCookieForUser(intruder));

    expect(response.status).toBe(403);
  });
});
