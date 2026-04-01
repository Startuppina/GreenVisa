const request = require('supertest');
const googleDocAiService = require('../../services/ocr/googleDocumentAiService');
const { OcrProviderTimeoutError } = require('../../services/ocr/ocrProviderErrors');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildInvalidTextBuffer,
  buildMinimalPdfBuffer,
  createCertificationFixture,
  createUserFixture,
  getDocumentBatchFixtureById,
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

async function uploadTransportDocument({ user, certificationId, buffer, filename, contentType }) {
  return request(app)
    .post('/api/documents/upload')
    .set('Cookie', authCookieForUser(user))
    .field('category', 'transport')
    .field('certificationId', String(certificationId))
    .attach('files', buffer, {
      filename,
      contentType,
    });
}

describe('POST /api/documents/upload', () => {
  it('rejects unauthenticated upload requests', async () => {
    const certification = await createCertificationFixture({ suffix: 'docs-upload-auth-cert' });

    const response = await request(app)
      .post('/api/documents/upload')
      .field('category', 'transport')
      .field('certificationId', String(certification.id))
      .attach('files', buildMinimalPdfBuffer(), {
        filename: 'vehicle.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(401);
  });

  it('stores batch, document, and OCR artifacts for a valid upload', async () => {
    const user = await createUserFixture({ suffix: 'docs-upload-valid-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-upload-valid-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await uploadTransportDocument({
      user,
      certificationId: certification.id,
      buffer: buildMinimalPdfBuffer(),
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].status).toBe('needs_review');

    const batch = await getDocumentBatchFixtureById(response.body.batchId);
    const document = await getDocumentFixtureById(response.body.documents[0].documentId);
    const result = await getDocumentResultFixtureByDocumentId(document.id);
    const surveyResponse = await getSurveyResponse({
      userId: user.id,
      certificationId: certification.id,
    });

    expect(batch).toEqual(
      expect.objectContaining({
        user_id: user.id,
        category: 'transport',
        status: 'needs_review',
        file_count: 1,
      }),
    );
    expect(document).toEqual(
      expect.objectContaining({
        user_id: user.id,
        batch_id: batch.id,
        survey_response_id: surveyResponse.id,
        original_name: 'vehicle.pdf',
        mime_type: 'application/pdf',
        ocr_status: 'needs_review',
      }),
    );
    const rawOut =
      typeof result.raw_provider_output === 'string'
        ? JSON.parse(result.raw_provider_output)
        : result.raw_provider_output;
    expect(rawOut).toEqual(
      expect.objectContaining({
        document: expect.objectContaining({
          text: expect.any(String),
          entities: expect.any(Array),
        }),
      }),
    );
    expect(Object.keys(rawOut)).toEqual(['document']);
    expect(Object.keys(rawOut.document).sort()).toEqual(['entities', 'text']);
    expect(result.normalized_output).toEqual(
      expect.objectContaining({
        fields: expect.any(Array),
        transport_v2_vehicle_prefill: expect.objectContaining({
          ocr_document_id: document.id,
        }),
      }),
    );
    expect(result.review_payload).toEqual(
      expect.objectContaining({
        fields: expect.any(Array),
        transport_v2_vehicle_prefill: expect.any(Object),
      }),
    );
    expect(surveyResponse.survey_data.transport_v2).toBeUndefined();
  });

  it('marks invalid uploads as failed without mutating the shared draft', async () => {
    const user = await createUserFixture({ suffix: 'docs-upload-invalid-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-upload-invalid-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await uploadTransportDocument({
      user,
      certificationId: certification.id,
      buffer: buildInvalidTextBuffer(),
      filename: 'vehicle.txt',
      contentType: 'text/plain',
    });

    expect(response.status).toBe(200);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].status).toBe('failed');

    const document = await getDocumentFixtureById(response.body.documents[0].documentId);
    const result = await getDocumentResultFixtureByDocumentId(document.id);
    const surveyResponse = await getSurveyResponse({
      userId: user.id,
      certificationId: certification.id,
    });

    expect(document.ocr_status).toBe('failed');
    expect(document.ocr_error_code).toBe('VALIDATION_FAILED');
    expect(result).toBeNull();
    expect(surveyResponse.survey_data.transport_v2).toBeUndefined();
  });

  it('stores failed status and error info when OCR processing fails', async () => {
    const user = await createUserFixture({ suffix: 'docs-upload-failed-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-upload-failed-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    vi.spyOn(googleDocAiService, 'processDocument').mockRejectedValueOnce(new Error('provider down'));

    const response = await uploadTransportDocument({
      user,
      certificationId: certification.id,
      buffer: buildMinimalPdfBuffer(),
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

    expect(response.status).toBe(200);
    expect(response.body.documents[0].status).toBe('failed');
    expect(response.body.documents[0].error).toContain('provider down');

    const document = await getDocumentFixtureById(response.body.documents[0].documentId);
    const result = await getDocumentResultFixtureByDocumentId(document.id);
    const surveyResponse = await getSurveyResponse({
      userId: user.id,
      certificationId: certification.id,
    });

    expect(document.ocr_status).toBe('failed');
    expect(document.ocr_error_code).toBe('PROCESSING_ERROR');
    expect(document.ocr_error_message).toContain('provider down');
    expect(result).toBeNull();
    expect(surveyResponse.survey_data.transport_v2).toBeUndefined();
  });

  it('stores OCR_PROVIDER_TIMEOUT on timeout failure and clears OCR error fields after successful retry', async () => {
    const user = await createUserFixture({ suffix: 'docs-upload-timeout-retry-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-upload-timeout-retry-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    vi.spyOn(googleDocAiService, 'processDocument').mockRejectedValueOnce(new OcrProviderTimeoutError());

    const uploadResponse = await uploadTransportDocument({
      user,
      certificationId: certification.id,
      buffer: buildMinimalPdfBuffer(),
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.documents[0].status).toBe('failed');

    const failedDoc = await getDocumentFixtureById(uploadResponse.body.documents[0].documentId);
    expect(failedDoc.ocr_status).toBe('failed');
    expect(failedDoc.ocr_error_code).toBe('OCR_PROVIDER_TIMEOUT');
    expect(failedDoc.ocr_error_message).toContain('timed out');

    const retryResponse = await request(app)
      .post(`/api/documents/${uploadResponse.body.documents[0].documentId}/retry`)
      .set('Cookie', authCookieForUser(user));

    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body.status).toBe('needs_review');

    const document = await getDocumentFixtureById(uploadResponse.body.documents[0].documentId);
    expect(document.ocr_status).toBe('needs_review');
    expect(document.ocr_error_code).toBeNull();
    expect(document.ocr_error_message).toBeNull();
  });

  it('can retry a failed document and later move it back into the normal OCR flow', async () => {
    const user = await createUserFixture({ suffix: 'docs-upload-retry-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-upload-retry-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    vi.spyOn(googleDocAiService, 'processDocument').mockRejectedValueOnce(new Error('temporary outage'));

    const uploadResponse = await uploadTransportDocument({
      user,
      certificationId: certification.id,
      buffer: buildMinimalPdfBuffer(),
      filename: 'vehicle.pdf',
      contentType: 'application/pdf',
    });

    expect(uploadResponse.body.documents[0].status).toBe('failed');

    const retryResponse = await request(app)
      .post(`/api/documents/${uploadResponse.body.documents[0].documentId}/retry`)
      .set('Cookie', authCookieForUser(user));

    expect(retryResponse.status).toBe(200);
    expect(retryResponse.body.status).toBe('needs_review');

    const document = await getDocumentFixtureById(uploadResponse.body.documents[0].documentId);
    const result = await getDocumentResultFixtureByDocumentId(document.id);

    expect(document.ocr_status).toBe('needs_review');
    expect(result).not.toBeNull();
    const rawOut =
      typeof result.raw_provider_output === 'string'
        ? JSON.parse(result.raw_provider_output)
        : result.raw_provider_output;
    expect(rawOut).toEqual(
      expect.objectContaining({
        document: expect.objectContaining({
          text: expect.any(String),
          entities: expect.any(Array),
        }),
      }),
    );
    expect(Object.keys(rawOut)).toEqual(['document']);
    expect(Object.keys(rawOut.document).sort()).toEqual(['entities', 'text']);
  });
});
