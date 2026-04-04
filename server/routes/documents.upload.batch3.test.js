/**
 * Batch 3 — GET /api/documents/:id/result APE OCR payload shape (repo boundary).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const require = createRequire(import.meta.url);
const documentsRouter = require('./documents.js');
const repoMod = require('../services/documents/documentRepository.js');

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

describe('GET /api/documents/:documentId/result — Batch 3 APE', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('49: returns meaningful APE reviewPayload, normalizedOutput, derivedOutput, validationIssues', async () => {
    const reviewPayload = {
      category: 'ape',
      version: 1,
      fields: [{ key: 'building.location.region', value: 'TOSCANA', normalizedValue: 'TOSCANA' }],
      validationIssues: [{ type: 'suspected_false_positive', fieldKey: 'consumptions.gpl.amount' }],
      building_certification_prefill: {
        building: { location: { region: 'TOSCANA' }, details: {} },
        consumptions: [{ energySource: 'electricity', amount: 1, plantId: null }],
      },
      derivedSummary: {
        category: 'ape',
        version: 1,
        parsedConsumptions: [{ energySource: 'electricity', amount: 1, unit: 'kWh', fieldKey: 'x' }],
        suspiciousFields: ['consumptions.gpl.amount'],
      },
    };
    const normalizedOutput = {
      category: 'ape',
      version: 1,
      fields: reviewPayload.fields,
      building_certification_prefill: reviewPayload.building_certification_prefill,
    };
    const derivedOutput = reviewPayload.derivedSummary;
    const validationIssues = reviewPayload.validationIssues;

    vi.spyOn(repoMod, 'getDocumentById').mockResolvedValue({
      id: 99,
      user_id: 42,
      original_name: 'ape.pdf',
      ocr_status: 'needs_review',
    });
    vi.spyOn(repoMod, 'getResultByDocumentId').mockResolvedValue({
      review_payload: reviewPayload,
      normalized_output: normalizedOutput,
      derived_output: derivedOutput,
      validation_issues: validationIssues,
      confirmed_output: null,
    });

    const res = await request(app)
      .get('/api/documents/99/result')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.reviewPayload.fields.length).toBeGreaterThan(0);
    expect(res.body.validationIssues.length).toBeGreaterThan(0);
    expect(res.body.normalizedOutput.fields.length).toBeGreaterThan(0);
    expect(res.body.derivedOutput.parsedConsumptions).toBeDefined();
    expect(res.body.derivedOutput.suspiciousFields).toBeDefined();
  });
});
