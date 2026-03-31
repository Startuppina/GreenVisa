const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildCompleteQuestionnaireFlags,
  buildMinimalPdfBuffer,
  createCertificationFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

async function uploadConfirmAndApply({ user, certificationId, transportMode = null }) {
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

  await request(app)
    .post(`/api/documents/${documentId}/confirm`)
    .set('Cookie', authCookieForUser(user))
    .send({
      fields: resultResponse.body.normalizedOutput.fields,
    })
    .expect(200);

  await request(app)
    .post(`/api/documents/${documentId}/apply`)
    .set('Cookie', authCookieForUser(user))
    .send({
      certificationId,
      ...(transportMode ? { transportMode } : {}),
    })
    .expect(200);

  return documentId;
}

describe('Block 3 Transport V2 compatibility', () => {
  it('returns the OCR-prefilled row through the Block 1 draft GET path', async () => {
    const user = await createUserFixture({ suffix: 'docs-compat-get-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-compat-get-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const documentId = await uploadConfirmAndApply({
      user,
      certificationId: certification.id,
    });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.draft.vehicles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ocr_document_id: documentId,
          vehicle_id: expect.any(String),
          fields: expect.any(Object),
          field_sources: expect.any(Object),
        }),
      ]),
    );
  });

  it('lets an OCR-prefilled row participate in Block 2 submit after manual completion', async () => {
    const user = await createUserFixture({ suffix: 'docs-compat-submit-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-compat-submit-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const documentId = await uploadConfirmAndApply({
      user,
      certificationId: certification.id,
      transportMode: 'goods',
    });

    const draftResponse = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(draftResponse.status).toBe(200);

    const completedVehicle = {
      ...draftResponse.body.transport_v2.draft.vehicles.find(
        (vehicle) => vehicle.ocr_document_id === documentId,
      ),
      transport_mode: 'goods',
      fields: {
        ...draftResponse.body.transport_v2.draft.vehicles.find(
          (vehicle) => vehicle.ocr_document_id === documentId,
        ).fields,
        wltp_homologation: true,
        wltp_co2_g_km: 180,
        load_profile_code: 2,
        last_revision_date: '2025-03-01',
        blue_sticker: true,
        annual_km: 25000,
      },
    };

    const saveResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: buildCompleteQuestionnaireFlags(),
          vehicles: [completedVehicle],
        },
      });

    expect(saveResponse.status).toBe(200);

    const submitResponse = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.transport_v2.meta.status).toBe('submitted');
    expect(submitResponse.body.transport_v2.results).toEqual(expect.any(Object));
  });
});
