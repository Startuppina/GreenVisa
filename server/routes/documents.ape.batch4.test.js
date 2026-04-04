/**
 * Batch 4 — APE confirm / apply + transport regression on shared routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const require = createRequire(import.meta.url);
const repoMod = require('../services/documents/documentRepository.js');
const buildingApplyMod = require('../services/buildingCertification/buildingCertificationOcrApplyService.js');
const transportDraftMod = require('../services/transportV2/transportV2DraftService.js');

const documentsRouter = require('./documents.js');

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use((req, _res, next) => {
    req.log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    next();
  });
  app.use('/api', documentsRouter);
  return app;
}

function authCookie(userId = 42) {
  const token = jwt.sign({ user_id: userId }, process.env.SECRET_KEY);
  return [`accessToken=${token}`];
}

describe('POST /api/documents/:id/confirm — APE Batch 4', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('persists confirmed_output with APE prefill and sets status confirmed', async () => {
    const updateConfirmed = vi.spyOn(repoMod, 'updateResultConfirmed').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateBatchStatus').mockResolvedValue('confirmed');
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 5,
      user_id: 42,
      batch_id: 10,
      ocr_status: 'needs_review',
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 10, category: 'ape', user_id: 42 });

    const fields = [
      {
        key: 'building.location.region',
        label: 'Regione',
        value: 'TOSCANA',
        confidence: 0.99,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
        sourceEntityType: 'building_region',
        required: false,
      },
    ];

    const res = await request(app)
      .post('/api/documents/5/confirm')
      .set('Cookie', authCookie())
      .send({ fields });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(updateConfirmed).toHaveBeenCalled();
    const payload = updateConfirmed.mock.calls[0][1];
    expect(payload.building_certification_prefill).toBeDefined();
    expect(payload.fields[0].normalizedValue).toBe('TOSCANA');
    expect(payload).not.toHaveProperty('transport_v2_vehicle_prefill');
    expect(repoMod.updateDocumentStatus).toHaveBeenCalledWith(5, 'confirmed', { confirmedBy: 42 });
  });

  it('omits GPL from confirmed prefill when user does not submit a GPL field', async () => {
    const updateConfirmed = vi.spyOn(repoMod, 'updateResultConfirmed').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateBatchStatus').mockResolvedValue('confirmed');
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 6,
      user_id: 42,
      batch_id: 11,
      ocr_status: 'needs_review',
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 11, category: 'ape' });

    const fields = [
      {
        key: 'consumptions.electricity.amount',
        label: 'E',
        value: '10 kWh',
        confidence: 0.99,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
        sourceEntityType: 'grid_electricity_annual_consumption_raw',
        required: false,
      },
    ];

    const res = await request(app)
      .post('/api/documents/6/confirm')
      .set('Cookie', authCookie())
      .send({ fields });

    expect(res.status).toBe(200);
    const prefill = updateConfirmed.mock.calls[0][1].building_certification_prefill;
    expect(prefill.consumptions.some((c) => c.energySource === 'gpl')).toBe(false);
  });

  it('transport confirm path unchanged (still uses transport_v2_vehicle_prefill)', async () => {
    const updateConfirmed = vi.spyOn(repoMod, 'updateResultConfirmed').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateBatchStatus').mockResolvedValue('confirmed');
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 8,
      user_id: 42,
      batch_id: 12,
      ocr_status: 'needs_review',
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 12, category: 'transport' });

    const fields = [
      {
        key: 'fuel_type',
        label: 'Carburante',
        value: 'diesel',
        confidence: 0.99,
        required: false,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ];

    const res = await request(app)
      .post('/api/documents/8/confirm')
      .set('Cookie', authCookie())
      .send({ fields });

    expect(res.status).toBe(200);
    const payload = updateConfirmed.mock.calls[0][1];
    expect(payload.transport_v2_vehicle_prefill).toBeDefined();
    expect(payload).not.toHaveProperty('building_certification_prefill');
  });
});

describe('POST /api/documents/:id/apply — APE Batch 4', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers confirmed_output.building_certification_prefill and calls building apply', async () => {
    const applySpy = vi.spyOn(buildingApplyMod, 'applyBuildingCertificationOcrPrefill').mockResolvedValue({
      building: { id: 7, region: 'Toscana' },
      consumptions: [{ id: 1, energy_source: 'Elettricità', consumption: 10 }],
    });
    vi.spyOn(repoMod, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateBatchStatus').mockResolvedValue('applied');
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 20,
      user_id: 42,
      batch_id: 30,
      building_id: 7,
      ocr_status: 'confirmed',
      survey_response_id: null,
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 30, category: 'ape' });
    vi.spyOn(repoMod, 'getResultByDocumentId').mockResolvedValue({
      confirmed_output: {
        building_certification_prefill: {
          building: { location: { region: 'Toscana' }, details: {} },
          consumptions: [{ energySource: 'electricity', amount: 10, plantId: null }],
        },
      },
      normalized_output: {
        building_certification_prefill: {
          building: { location: { region: 'LAZIO' }, details: {} },
          consumptions: [],
        },
      },
    });

    const res = await request(app).post('/api/documents/20/apply').set('Cookie', authCookie()).send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('applied');
    expect(res.body.buildingId).toBe(7);
    expect(applySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        buildingId: 7,
        prefill: expect.objectContaining({
          building: expect.objectContaining({ location: expect.objectContaining({ region: 'Toscana' }) }),
        }),
      }),
    );
  });

  it('returns 400 when APE document has no building_id', async () => {
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 21,
      user_id: 42,
      batch_id: 31,
      building_id: null,
      ocr_status: 'confirmed',
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 31, category: 'ape' });
    vi.spyOn(repoMod, 'getResultByDocumentId').mockResolvedValue({
      confirmed_output: { building_certification_prefill: { building: { location: {}, details: {} }, consumptions: [] } },
    });

    const res = await request(app).post('/api/documents/21/apply').set('Cookie', authCookie()).send({});
    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/building_id/i);
  });

  it('transport apply still requires certificationId', async () => {
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 22,
      user_id: 42,
      batch_id: 32,
      building_id: 1,
      ocr_status: 'confirmed',
      survey_response_id: null,
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 32, category: 'transport' });
    vi.spyOn(repoMod, 'getResultByDocumentId').mockResolvedValue({
      confirmed_output: { fields: [], transport_v2_vehicle_prefill: { ocr_document_id: 22, vehicle_id: 'v' } },
    });

    const res = await request(app).post('/api/documents/22/apply').set('Cookie', authCookie()).send({});
    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/certificationId/i);
  });

  it('transport apply still invokes upsertTransportV2OcrVehicle when certificationId provided', async () => {
    const upsert = vi.spyOn(transportDraftMod, 'upsertTransportV2OcrVehicle').mockResolvedValue({
      surveyResponseId: 99,
      transportV2: { draft: { vehicles: [] } },
      vehicle: {},
    });
    vi.spyOn(repoMod, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repoMod, 'updateBatchStatus').mockResolvedValue('applied');
    vi.spyOn(repoMod, 'linkDocumentToSurveyResponse').mockResolvedValue({});
    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 23,
      user_id: 42,
      batch_id: 33,
      building_id: 1,
      ocr_status: 'confirmed',
      survey_response_id: null,
    });
    vi.spyOn(repoMod, 'getBatchById').mockResolvedValue({ id: 33, category: 'transport' });
    vi.spyOn(repoMod, 'getResultByDocumentId').mockResolvedValue({
      confirmed_output: {
        fields: [],
        transport_v2_vehicle_prefill: { ocr_document_id: 23, vehicle_id: 'v1' },
      },
    });

    const res = await request(app)
      .post('/api/documents/23/apply')
      .set('Cookie', authCookie())
      .send({ certificationId: '5' });

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalled();
    expect(res.body.transport_v2).toBeDefined();
  });
});
