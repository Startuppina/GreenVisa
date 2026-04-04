/**
 * Batch 1 — POST /api/documents/upload: category, survey linking, validation shell.
 *
 * Uses `vi.spyOn` on the same CommonJS module instances the router requires.
 * Under Vitest (`VITEST=true`), `server/db.js` exports `tests/mocks/dbPool.testdouble.js`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import * as dbModule from '../db.js';

const pool = dbModule.default ?? dbModule;
const require = createRequire(import.meta.url);

const ocrServiceMod = require('../services/ocr/ocrService');
const documentValidationServiceMod = require('../services/documents/documentValidationService');
const documentStorageServiceMod = require('../services/documents/documentStorageService');
const transportV2DraftServiceMod = require('../services/transportV2/transportV2DraftService');

const documentsRouter = require('./documents.js');

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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

function findBatchInsertCalls() {
  return pool.query.mock.calls.filter(([sql]) => String(sql).includes('INSERT INTO document_batches'));
}

function lastDocumentInsertParams() {
  const inserts = pool.query.mock.calls.filter(([sql]) => String(sql).includes('INSERT INTO documents'));
  expect(inserts.length).toBeGreaterThan(0);
  return inserts[inserts.length - 1][1];
}

describe('POST /api/documents/upload — Batch 1', () => {
  const app = buildApp();
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

  let processDocumentSpy;
  let validateFileSpy;
  let storeFileSpy;
  let resolveSurveySpy;

  beforeEach(() => {
    vi.clearAllMocks();
    pool.resetPoolTestDouble();
    processDocumentSpy = vi.spyOn(ocrServiceMod, 'processDocument').mockResolvedValue({
      status: 'needs_review',
      fields: [],
      validationIssues: [],
    });
    validateFileSpy = vi.spyOn(documentValidationServiceMod, 'validateFile').mockReturnValue({
      valid: true,
      issues: [],
      hash: 'abc123',
    });
    storeFileSpy = vi.spyOn(documentStorageServiceMod, 'storeFileFromBuffer').mockReturnValue({
      storedName: 's.pdf',
      storagePath: '/tmp/s.pdf',
    });
    resolveSurveySpy = vi
      .spyOn(transportV2DraftServiceMod, 'resolveTransportSurveyResponse')
      .mockResolvedValue({ surveyResponseId: 555 });
  });

  it('defaults category to transport when omitted', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(res.status).toBe(200);
    expect(findBatchInsertCalls().length).toBe(1);
    expect(findBatchInsertCalls()[0][1][2]).toBe('transport');
  });

  it('accepts category=transport', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(res.status).toBe(200);
    expect(findBatchInsertCalls()[0][1][2]).toBe('transport');
  });

  it('accepts category=ape', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(res.status).toBe(200);
    expect(findBatchInsertCalls()[0][1][2]).toBe('ape');
  });

  it('returns 400 INVALID_CATEGORY for unknown category and does not create a batch', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'invoice')
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_CATEGORY');
    expect(res.body.accepted).toContain('transport');
    expect(res.body.accepted).toContain('ape');
    expect(findBatchInsertCalls().length).toBe(0);
    expect(processDocumentSpy).not.toHaveBeenCalled();
  });

  it('transport + certificationId invokes resolveTransportSurveyResponse', async () => {
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .field('certificationId', '12')
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(resolveSurveySpy).toHaveBeenCalledWith({
      userId: 42,
      certificationId: 12,
    });
  });

  it('APE + certificationId does not invoke resolveTransportSurveyResponse', async () => {
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .field('certificationId', '12')
      .attach('files', pdfBuffer, 'doc.pdf');

    expect(resolveSurveySpy).not.toHaveBeenCalled();
  });

  it('calls the same validateFile for transport and APE uploads', async () => {
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .attach('files', pdfBuffer, 'a.pdf');
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'b.pdf');

    expect(validateFileSpy).toHaveBeenCalledTimes(2);
  });

  it('APE upload rejects invalid file via generic validateFile (same path as transport)', async () => {
    validateFileSpy.mockReturnValue({
      valid: false,
      issues: [{ message: 'bad' }],
      hash: 'x',
    });
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'failed' }];

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'bad.exe');

    expect(res.status).toBe(200);
    expect(validateFileSpy).toHaveBeenCalled();
    expect(res.body.documents[0].status).toBe('failed');
    expect(processDocumentSpy).not.toHaveBeenCalled();
  });

  it('transport upload still succeeds and runs OCR (regression)', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .attach('files', pdfBuffer, 't.pdf');

    expect(res.status).toBe(200);
    expect(processDocumentSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ category: 'transport' }),
    );
  });

  it('transport + certificationId still links survey when OCR runs', async () => {
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .field('certificationId', '5')
      .attach('files', pdfBuffer, 't.pdf');

    expect(lastDocumentInsertParams()[3]).toBe(555);
  });

  it('APE OCR receives category ape (regression guard)', async () => {
    await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'a.pdf');

    expect(processDocumentSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ category: 'ape' }),
    );
  });
});
