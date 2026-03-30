const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createDocumentBatchFixture,
  createDocumentFixture,
  createDocumentResultFixture,
  createSurveyResponseFixture,
  createUserFixture,
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
      wltp_homologation: null,
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
  it('prefills one OCR-linked row into survey_data.transport_v2.draft.vehicles[]', async () => {
    const user = await createUserFixture({ suffix: 'docs-apply-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-apply-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const surveyResponse = await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: {
          untouched: true,
        },
      },
      totalScore: 42,
      co2emissions: 10.5,
      completed: false,
    });
    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      surveyResponseId: surveyResponse.id,
      ocrStatus: 'confirmed',
    });
    await createDocumentResultFixture({
      documentId: doc.id,
      normalizedOutput: {
        transport_v2_vehicle_prefill: buildConfirmedOutput(doc.id).transport_v2_vehicle_prefill,
      },
      confirmedOutput: buildConfirmedOutput(doc.id),
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
        wltp_homologation: null,
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
    expect(row.survey_data.transport_v2.draft.vehicles).toHaveLength(1);
    expect(row.survey_data.transport_v2.derived).toEqual({});
    expect(row.survey_data.transport_v2.results).toEqual({});
    expect(Number(row.total_score)).toBe(42);
    expect(Number(row.co2emissions)).toBe(10.5);
    expect(row.completed).toBe(false);
  });

  it('reapplies the same document by updating the OCR-linked row in place', async () => {
    const user = await createUserFixture({ suffix: 'docs-reapply-user' });
    const certification = await createCertificationFixture({ suffix: 'docs-reapply-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: {
          meta: {
            version: 1,
            certification_id: certification.id,
            entry_mode: null,
            status: 'draft',
            started_at: '2026-03-30T10:00:00.000Z',
            updated_at: '2026-03-30T10:00:00.000Z',
            submitted_at: null,
          },
          draft: {
            questionnaire_flags: {},
            vehicles: [
              {
                vehicle_id: 'ocr-doc-1',
                transport_mode: 'goods',
                ocr_document_id: 1,
                fields: {
                  registration_year: 2018,
                  euro_class: 'EURO_5',
                  fuel_type: 'diesel',
                  wltp_homologation: null,
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

    const batch = await createDocumentBatchFixture({ userId: user.id });
    const doc = await createDocumentFixture({
      batchId: batch.id,
      userId: user.id,
      ocrStatus: 'applied',
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
      });

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.draft.vehicles).toHaveLength(1);
    expect(row.survey_data.transport_v2.draft.vehicles[0].fields.registration_year).toBe(2020);
    expect(row.survey_data.transport_v2.draft.vehicles[0].fields.load_profile_code).toBe(2);
    expect(row.survey_data.transport_v2.draft.vehicles[0].fields.annual_km).toBe(24000);
  });
});
