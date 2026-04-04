/**
 * Batch 2 — POST /api/documents/upload: APE response shape, errors, batch aggregation, transport regression.
 *
 * Same wiring as Batch 1 route tests: `vi.spyOn` on CommonJS modules the router uses.
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

describe('POST /api/documents/upload — Batch 2', () => {
  const app = buildApp();
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
  const pdfBufferB = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n%\n');

  let processDocumentSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    pool.resetPoolTestDouble();
    processDocumentSpy = vi.spyOn(ocrServiceMod, 'processDocument').mockResolvedValue({
      status: 'needs_review',
      fields: [],
      validationIssues: [],
    });
    vi.spyOn(documentValidationServiceMod, 'validateFile').mockReturnValue({
      valid: true,
      issues: [],
      hash: 'abc123',
    });
    vi.spyOn(documentStorageServiceMod, 'storeFileFromBuffer').mockReturnValue({
      storedName: 's.pdf',
      storagePath: '/tmp/s.pdf',
    });
    vi.spyOn(transportV2DraftServiceMod, 'resolveTransportSurveyResponse').mockResolvedValue({
      surveyResponseId: 555,
    });
  });

  it('successful APE upload returns document status needs_review', async () => {
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'a.pdf');

    expect(res.status).toBe(200);
    expect(res.body.documents[0].status).toBe('needs_review');
  });

  it('successful APE upload returns empty fields and validationIssues (placeholder path)', async () => {
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'a.pdf');

    expect(res.body.documents[0].fields).toEqual([]);
    expect(res.body.documents[0].validationIssues).toEqual([]);
  });

  it('failed APE upload returns failed document summary with error', async () => {
    processDocumentSpy.mockResolvedValue({
      status: 'failed',
      error: 'Document AI refused the file',
    });
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'failed' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'bad.pdf');

    expect(res.status).toBe(200);
    expect(res.body.documents[0].status).toBe('failed');
    expect(res.body.documents[0].error).toMatch(/refused the file/i);
  });

  it('single successful APE upload yields batchStatus needs_review', async () => {
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'one.pdf');

    expect(res.body.batchStatus).toBe('needs_review');
  });

  it('single failed APE upload yields batchStatus failed', async () => {
    processDocumentSpy.mockResolvedValue({ status: 'failed', error: 'x' });
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'failed' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'f.pdf');

    expect(res.body.batchStatus).toBe('failed');
  });

  it('mixed APE outcomes yield batchStatus partial', async () => {
    processDocumentSpy
      .mockResolvedValueOnce({ status: 'needs_review', fields: [], validationIssues: [] })
      .mockResolvedValueOnce({ status: 'failed', error: 'second file failed' });
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }, { ocr_status: 'failed' }];

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'ape')
      .attach('files', pdfBuffer, 'ok.pdf')
      .attach('files', pdfBufferB, 'bad.pdf');

    expect(res.body.fileCount).toBe(2);
    expect(res.body.documents[0].status).toBe('needs_review');
    expect(res.body.documents[1].status).toBe('failed');
    expect(res.body.batchStatus).toBe('partial');
  });

  it('transport upload still succeeds with needs_review (regression)', async () => {
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .attach('files', pdfBuffer, 't.pdf');

    expect(res.status).toBe(200);
    expect(res.body.documents[0].status).toBe('needs_review');
    expect(processDocumentSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ category: 'transport' }),
    );
  });

  it('transport upload failure returns failed document (regression)', async () => {
    processDocumentSpy.mockResolvedValue({ status: 'failed', error: 'transport ocr failed' });
    pool.poolQueryState.batchDocumentStatuses = [{ ocr_status: 'failed' }];
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', authCookie())
      .field('category', 'transport')
      .attach('files', pdfBuffer, 't.pdf');

    expect(res.body.documents[0].status).toBe('failed');
    expect(res.body.documents[0].error).toMatch(/transport ocr failed/i);
  });
});
