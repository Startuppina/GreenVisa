const request = require('supertest');
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
  getOcrLinkedVehicle,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

function buildConfirmedOutput(documentId, overrides = {}) {
  const transportV2VehiclePrefill = {
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
    field_sources: {
      registration_year: {
        source: 'ocr',
        document_id: documentId,
        confidence: 0.99,
      },
      euro_class: {
        source: 'ocr',
        document_id: documentId,
        confidence: 0.94,
      },
      fuel_type: {
        source: 'ocr',
        document_id: documentId,
        confidence: 0.96,
      },
      goods_vehicle_over_3_5_tons: {
        source: 'ocr_derived',
        document_id: documentId,
        confidence: 0.92,
      },
    },
    field_warnings: {
      euro_class: [
        {
          code: 'low_confidence',
          message: 'Classe Euro: confidenza bassa (74%).',
          confidence: 0.74,
        },
      ],
    },
    row_notes: null,
    ...overrides,
  };

  return {
    fields: [],
    validationIssues: [],
    transport_v2_vehicle_prefill: transportV2VehiclePrefill,
    confirmedBy: 1,
    confirmedAt: '2026-03-30T10:00:00.000Z',
  };
}

describe('POST /api/documents/:documentId/apply', () => {
  async function seedConfirmedDocument({
    user,
    certification,
    surveyData = null,
    totalScore = 42,
    co2emissions = 10.5,
    completed = false,
    documentStatus = 'confirmed',
    prefillOverrides = {},
  }) {
    const surveyResponse = await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData,
      totalScore,
      co2emissions,
      completed,
    });
    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      surveyResponseId: surveyResponse.id,
      ocrStatus: documentStatus,
    });

    await createDocumentResultFixture({
      documentId: doc.id,
      normalizedOutput: {
        transport_v2_vehicle_prefill: buildConfirmedOutput(doc.id, prefillOverrides).transport_v2_vehicle_prefill,
      },
      confirmedOutput: buildConfirmedOutput(doc.id, prefillOverrides),
    });

    return {
      batch,
      doc,
      surveyResponse,
    };
  }

  it('rejects unauthenticated apply requests', async () => {
    const response = await request(app)
      .post('/api/documents/123/apply')
      .send({ certificationId: 1 });

    expect(response.status).toBe(401);
  });

  it('enforces ownership on apply', async () => {
    const owner = await createUserFixture({ suffix: 'docs-apply-owner' });
    const intruder = await createUserFixture({ suffix: 'docs-apply-intruder' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-owner-cert' });
    await grantCertificationAccess({ userId: owner.id, certificationId: certification.id });
    const { doc } = await seedConfirmedDocument({
      user: owner,
      certification,
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(intruder))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(403);
  });

  it('requires a valid certification context and blocks arbitrary root payload injection', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-cert-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-cert-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const { doc } = await seedConfirmedDocument({
      user,
      certification,
      surveyData: {
        legacy_key: {
          untouched: true,
        },
      },
    });

    const invalidResponse = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: 'not-a-number',
        registrationYear: 1999,
        fuelType: 'Hack',
        ocrAppliedAt: '2026-01-01T00:00:00.000Z',
      });

    expect(invalidResponse.status).toBe(400);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.legacy_key).toEqual({ untouched: true });
    expect(row.survey_data.registrationYear).toBeUndefined();
    expect(row.survey_data.fuelType).toBeUndefined();
    expect(row.survey_data.ocrAppliedAt).toBeUndefined();
  });

  it('prefills one OCR-linked row into survey_data.transport_v2.draft.vehicles[]', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const { doc } = await seedConfirmedDocument({
      user,
      certification,
      surveyData: {
        legacy_key: {
          untouched: true,
        },
      },
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('applied');
    expect(response.body.vehicle).toEqual({
      vehicle_id: `ocr-doc-${doc.id}`,
      transport_mode: null,
      ocr_document_id: doc.id,
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
      field_sources: {
        registration_year: {
          source: 'ocr',
          document_id: doc.id,
          confidence: 0.99,
        },
        euro_class: {
          source: 'ocr',
          document_id: doc.id,
          confidence: 0.94,
        },
        fuel_type: {
          source: 'ocr',
          document_id: doc.id,
          confidence: 0.96,
        },
        goods_vehicle_over_3_5_tons: {
          source: 'ocr_derived',
          document_id: doc.id,
          confidence: 0.92,
        },
      },
      field_warnings: {
        euro_class: [
          {
            code: 'low_confidence',
            message: 'Classe Euro: confidenza bassa (74%).',
            confidence: 0.74,
          },
        ],
      },
      row_notes: null,
    });

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.legacy_key).toEqual({ untouched: true });
    expect(row.survey_data.ocrDocumentId).toBeUndefined();
    expect(row.survey_data.registrationYear).toBeUndefined();
    expect(row.survey_data.fuelType).toBeUndefined();
    expect(row.survey_data.ocrAppliedAt).toBeUndefined();
    expect(row.survey_data.transport_v2.draft.vehicles).toHaveLength(1);
    expect(row.survey_data.transport_v2.derived).toEqual({});
    expect(row.survey_data.transport_v2.results).toEqual({});
    expect(Number(row.total_score)).toBe(42);
    expect(Number(row.co2emissions)).toBe(10.5);
    expect(row.completed).toBe(false);
    expect(row.survey_data.transport_v2.draft.vehicles[0].fields.goods_vehicle_over_2_5_tons).toBeUndefined();
    expect(row.survey_data.transport_v2.draft.vehicles[0].fields.goodsVehicleOver2_5Tons).toBeUndefined();
  });

  it('stores transport_mode when provided and otherwise allows null transport_mode', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-mode-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-mode-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const { doc } = await seedConfirmedDocument({
      user,
      certification,
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
        transportMode: 'goods',
      });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.transport_mode).toBe('goods');

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(getOcrLinkedVehicle(row, doc.id).transport_mode).toBe('goods');
  });

  it('preserves existing draft rows and questionnaire_flags', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-preserve-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-preserve-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const { doc } = await seedConfirmedDocument({
      user,
      certification,
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
            questionnaire_flags: {
              uses_navigator: true,
            },
            vehicles: [
              {
                vehicle_id: 'manual-1',
                transport_mode: 'passenger',
                ocr_document_id: null,
                fields: {
                  registration_year: 2024,
                },
                field_sources: {},
                field_warnings: {},
                row_notes: null,
              },
            ],
          },
          derived: {},
          results: {},
        },
      },
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.draft.questionnaire_flags).toEqual({
      uses_navigator: true,
    });
    expect(row.survey_data.transport_v2.draft.vehicles).toHaveLength(2);
    expect(row.survey_data.transport_v2.draft.vehicles[0].vehicle_id).toBe('manual-1');
  });

  it('reapplies the same document by updating the OCR-linked row in place', async () => {
    const user = await createUserFixture({ suffix: 'docs-reapply-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-reapply-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      ocrStatus: 'applied',
    });

    await createSurveyResponseFixture({
      userId: user.id,
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
            questionnaire_flags: {},
            vehicles: [
              {
                vehicle_id: `ocr-doc-${doc.id}`,
                transport_mode: 'goods',
                ocr_document_id: doc.id,
                fields: {
                  registration_year: 2018,
                  euro_class: 'EURO_5',
                  fuel_type: 'diesel',
                  wltp_co2_g_km: null,
                  wltp_co2_g_km_alt_fuel: null,
                  goods_vehicle_over_3_5_tons: false,
                  occupancy_profile_code: null,
                  load_profile_code: 2,
                  last_revision_date: null,
                  blue_sticker: null,
                  annual_km: 24000,
                },
                field_sources: {
                  annual_km: {
                    source: 'user',
                  },
                },
                field_warnings: {},
                row_notes: null,
              },
            ],
          },
          derived: {},
          results: {},
        },
      },
    });

    await createDocumentResultFixture({
      documentId: doc.id,
      confirmedOutput: buildConfirmedOutput(doc.id, {
        transport_mode: 'goods',
      }),
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
        transportMode: 'goods',
      });

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.draft.vehicles).toHaveLength(1);
    expect(getOcrLinkedVehicle(row, doc.id).fields.registration_year).toBe(2020);
    expect(getOcrLinkedVehicle(row, doc.id).fields.load_profile_code).toBe(2);
    expect(getOcrLinkedVehicle(row, doc.id).fields.annual_km).toBe(24000);
    expect(await countSurveyResponses({ userId: user.id, certificationId: certification.id })).toBe(1);
  });

  it('fails cleanly when document_results are missing and does not mutate the draft', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-missing-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-missing-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const surveyResponse = await createSurveyResponseFixture({
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
      surveyResponseId: surveyResponse.id,
      ocrStatus: 'confirmed',
    });

    const response = await request(app)
      .post(`/api/documents/${doc.id}/apply`)
      .set('Cookie', authCookieForUser(user))
      .send({
        certificationId: certification.id,
      });

    expect(response.status).toBe(400);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2).toBeUndefined();
    expect(row.survey_data.legacy_key).toEqual({ untouched: true });
  });
});
