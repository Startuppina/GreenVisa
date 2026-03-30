const express = require('express');
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const ocrConfig = require('../config/ocr');
const { validateFile } = require('../services/documentValidationService');
const { storeFileFromBuffer } = require('../services/documentStorageService');
const repo = require('../services/documentRepository');
const ocrService = require('../services/ocrService');
const { applyNormalizations, validateNormalizedOutput } = require('../services/ocrOutputValidator');
const { buildTransportV2VehiclePrefill, normalizeTransportMode } = require('../services/transportV2OcrPrefillService');
const {
  TransportV2HttpError,
  parseCertificationId,
  resolveTransportSurveyResponse,
  upsertTransportV2OcrVehicle,
} = require('../services/transportV2DraftService');

const router = express.Router();

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ocrConfig.upload.maxFileSizeBytes },
}).array('files', ocrConfig.upload.maxFilesPerBatch);

function handleMulterUpload(req, res, next) {
  docUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ msg: 'Un file supera la dimensione massima consentita.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ msg: 'Troppi file in un singolo upload.' });
      }
      return res.status(400).json({ msg: 'Errore durante l\'upload.', error: err.message });
    }
    if (err) return next(err);
    next();
  });
}

// ── POST /api/documents/upload ────────────────────────────────
router.post(
  '/documents/upload',
  authenticateJWT,
  handleMulterUpload,
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const buildingId = req.body.buildingId ? parseInt(req.body.buildingId, 10) : null;
      const category = req.body.category || 'transport';
      const certificationId = req.body.certificationId ? parseCertificationId(req.body.certificationId) : null;
      const files = req.files;
      let surveyResponseId = null;

      if (!files || files.length === 0) {
        return res.status(400).json({ msg: 'Nessun file fornito.' });
      }

      if (category === 'transport' && certificationId) {
        const transportLink = await resolveTransportSurveyResponse({
          userId,
          certificationId,
        });
        surveyResponseId = transportLink.surveyResponseId;
      }

      const batch = await repo.createBatch({
        userId,
        buildingId,
        category,
        fileCount: files.length,
      });

      const existingHashes = new Set();
      const documentSummaries = [];

      for (const file of files) {
        const validation = validateFile(file, existingHashes);

        if (!validation.valid) {
          const doc = await repo.createDocument({
            batchId: batch.id,
            userId,
            buildingId,
            originalName: file.originalname,
            storedName: '',
            storagePath: '',
            mimeType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            sha256: validation.hash,
            ocrProvider: ocrConfig.provider,
            ocrRegion: ocrConfig.google.location,
            ocrStatus: 'failed',
            surveyResponseId,
          });

          await repo.updateDocumentStatus(doc.id, 'failed', {
            errorCode: 'VALIDATION_FAILED',
            errorMessage: validation.issues.map((i) => i.message).join('; '),
          });

          documentSummaries.push({
            documentId: doc.id,
            fileName: file.originalname,
            status: 'failed',
            errors: validation.issues,
          });
          continue;
        }

        if (validation.hash) existingHashes.add(validation.hash);

        const stored = storeFileFromBuffer(file.buffer, file.originalname);

        const doc = await repo.createDocument({
          batchId: batch.id,
          userId,
          buildingId,
          originalName: file.originalname,
          storedName: stored.storedName,
          storagePath: stored.storagePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          sha256: validation.hash,
          ocrProvider: ocrConfig.provider,
          ocrRegion: ocrConfig.google.location,
          ocrStatus: 'uploaded',
          surveyResponseId,
        });

        const result = await ocrService.processDocument(doc);

        documentSummaries.push({
          documentId: doc.id,
          fileName: file.originalname,
          status: result.status,
          fields: result.fields || null,
          validationIssues: result.validationIssues || null,
          error: result.error || null,
        });
      }

      const batchStatus = await repo.updateBatchStatus(batch.id);

      res.status(200).json({
        batchId: batch.id,
        batchStatus,
        fileCount: files.length,
        documents: documentSummaries,
      });
    } catch (err) {
      if (err instanceof TransportV2HttpError) {
        return res.status(err.statusCode).json({ msg: err.message });
      }
      console.error('Document upload error:', err);
      res.status(500).json({ msg: 'Errore durante il caricamento dei documenti.' });
    }
  },
);

// ── GET /api/documents/user ───────────────────────────────────
router.get('/documents/user', authenticateJWT, async (req, res) => {
  try {
    const docs = await repo.getDocumentsByUserId(req.user.user_id);
    res.json(
      docs.map((d) => ({
        documentId: d.id,
        batchId: d.batch_id,
        fileName: d.original_name,
        status: d.ocr_status,
        uploadedAt: d.uploaded_at,
        processedAt: d.processed_at,
        confirmedAt: d.confirmed_at,
        appliedAt: d.applied_at,
      })),
    );
  } catch (err) {
    console.error('List user documents error:', err);
    res.status(500).json({ msg: 'Errore nel recupero dei documenti.' });
  }
});

// ── GET /api/document-batches/:batchId ────────────────────────
router.get('/document-batches/:batchId', authenticateJWT, async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    if (isNaN(batchId)) return res.status(400).json({ msg: 'ID batch non valido.' });

    const batch = await repo.getBatchWithDocuments(batchId);
    if (!batch) return res.status(404).json({ msg: 'Batch non trovato.' });
    if (batch.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    const statusCounts = {};
    for (const doc of batch.documents) {
      statusCounts[doc.ocr_status] = (statusCounts[doc.ocr_status] || 0) + 1;
    }

    res.json({
      id: batch.id,
      status: batch.status,
      fileCount: batch.file_count,
      category: batch.category,
      createdAt: batch.created_at,
      statusCounts,
      documents: batch.documents.map((d) => ({
        documentId: d.id,
        fileName: d.original_name,
        status: d.ocr_status,
        uploadedAt: d.uploaded_at,
        processedAt: d.processed_at,
        confirmedAt: d.confirmed_at,
        appliedAt: d.applied_at,
        error: d.ocr_error_message,
      })),
    });
  } catch (err) {
    console.error('Get batch error:', err);
    res.status(500).json({ msg: 'Errore nel recupero del batch.' });
  }
});

// ── GET /api/documents/:documentId ────────────────────────────
router.get('/documents/:documentId', authenticateJWT, async (req, res) => {
  try {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId)) return res.status(400).json({ msg: 'ID documento non valido.' });

    const doc = await repo.getDocumentById(docId);
    if (!doc) return res.status(404).json({ msg: 'Documento non trovato.' });
    if (doc.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    res.json({
      documentId: doc.id,
      batchId: doc.batch_id,
      fileName: doc.original_name,
      mimeType: doc.mime_type,
      fileSize: doc.file_size,
      status: doc.ocr_status,
      provider: doc.ocr_provider,
      error: doc.ocr_error_message,
      uploadedAt: doc.uploaded_at,
      processedAt: doc.processed_at,
      confirmedAt: doc.confirmed_at,
      appliedAt: doc.applied_at,
    });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ msg: 'Errore nel recupero del documento.' });
  }
});

// ── GET /api/documents/:documentId/result ─────────────────────
router.get('/documents/:documentId/result', authenticateJWT, async (req, res) => {
  try {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId)) return res.status(400).json({ msg: 'ID documento non valido.' });

    const doc = await repo.getDocumentById(docId);
    if (!doc) return res.status(404).json({ msg: 'Documento non trovato.' });
    if (doc.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    const result = await repo.getResultByDocumentId(docId);
    if (!result) {
      return res.status(404).json({ msg: 'Risultato non ancora disponibile.' });
    }

    res.json({
      documentId: doc.id,
      fileName: doc.original_name,
      status: doc.ocr_status,
      reviewPayload: result.review_payload || null,
      normalizedOutput: result.normalized_output || null,
      derivedOutput: result.derived_output || null,
      transportV2VehiclePrefill:
        result.confirmed_output?.transport_v2_vehicle_prefill ||
        result.normalized_output?.transport_v2_vehicle_prefill ||
        null,
      validationIssues: result.validation_issues || [],
      confirmedOutput: result.confirmed_output || null,
    });
  } catch (err) {
    console.error('Get result error:', err);
    res.status(500).json({ msg: 'Errore nel recupero del risultato.' });
  }
});

// ── POST /api/documents/:documentId/confirm ───────────────────
router.post('/documents/:documentId/confirm', authenticateJWT, async (req, res) => {
  try {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId)) return res.status(400).json({ msg: 'ID documento non valido.' });

    const { fields } = req.body;
    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ msg: 'Campo "fields" mancante o non valido.' });
    }

    const doc = await repo.getDocumentById(docId);
    if (!doc) return res.status(404).json({ msg: 'Documento non trovato.' });
    if (doc.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    if (doc.ocr_status !== 'needs_review') {
      return res.status(400).json({
        msg: `Impossibile confermare un documento in stato "${doc.ocr_status}". Stato atteso: "needs_review".`,
      });
    }

    const normalizedFields = applyNormalizations(fields);
    const validationIssues = validateNormalizedOutput(normalizedFields);
    const transportV2VehiclePrefill = buildTransportV2VehiclePrefill({
      documentId: docId,
      reviewFields: normalizedFields,
    });

    const confirmedOutput = {
      fields: normalizedFields,
      validationIssues,
      transport_v2_vehicle_prefill: transportV2VehiclePrefill,
      confirmedBy: req.user.user_id,
      confirmedAt: new Date().toISOString(),
    };

    await repo.updateResultConfirmed(docId, confirmedOutput);
    await repo.updateDocumentStatus(docId, 'confirmed', { confirmedBy: req.user.user_id });
    await repo.updateBatchStatus(doc.batch_id);

    res.json({
      msg: 'Dati OCR confermati. Il passaggio successivo puo prefilarli nel draft Transport V2.',
      documentId: docId,
      status: 'confirmed',
      confirmedOutput,
    });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ msg: 'Errore durante la conferma.' });
  }
});

// ── POST /api/documents/:documentId/apply ─────────────────────
router.post('/documents/:documentId/apply', authenticateJWT, async (req, res) => {
  try {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId)) return res.status(400).json({ msg: 'ID documento non valido.' });

    const doc = await repo.getDocumentById(docId);
    if (!doc) return res.status(404).json({ msg: 'Documento non trovato.' });
    if (doc.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    if (!['needs_review', 'confirmed', 'applied'].includes(doc.ocr_status)) {
      return res.status(400).json({
        msg: `Impossibile applicare un documento in stato "${doc.ocr_status}". Stati ammessi: "needs_review", "confirmed", "applied".`,
      });
    }

    const result = await repo.getResultByDocumentId(docId);
    if (!result) {
      return res.status(400).json({ msg: 'Nessun risultato OCR trovato per questo documento.' });
    }

    if (!req.body || req.body.certificationId == null) {
      return res.status(400).json({ msg: 'certificationId e obbligatorio per il prefill OCR.' });
    }

    const certificationId = parseCertificationId(req.body.certificationId);
    const transportMode = normalizeTransportMode(req.body.transportMode);
    const prefillFields =
      result.confirmed_output?.fields ||
      result.normalized_output?.fields ||
      [];
    const basePrefill =
      result.confirmed_output?.transport_v2_vehicle_prefill ||
      result.normalized_output?.transport_v2_vehicle_prefill ||
      buildTransportV2VehiclePrefill({
        documentId: docId,
        reviewFields: prefillFields,
      });

    const vehiclePrefill = {
      ...basePrefill,
      transport_mode: transportMode ?? basePrefill.transport_mode ?? null,
    };

    const upsertResult = await upsertTransportV2OcrVehicle({
      userId: req.user.user_id,
      certificationId,
      vehiclePrefill,
      transportMode,
    });

    if (doc.survey_response_id !== upsertResult.surveyResponseId) {
      await repo.linkDocumentToSurveyResponse(docId, upsertResult.surveyResponseId);
    }

    await repo.updateDocumentStatus(docId, 'applied');
    await repo.updateBatchStatus(doc.batch_id);

    res.json({
      msg: 'Veicolo OCR prefillato nel draft condiviso Transport V2.',
      documentId: docId,
      status: 'applied',
      certificationId,
      vehicle: upsertResult.vehicle,
      transport_v2: upsertResult.transportV2,
    });
  } catch (err) {
    if (err instanceof TransportV2HttpError) {
      return res.status(err.statusCode).json({ msg: err.message, ...(err.extras.errors ? { errors: err.extras.errors } : {}) });
    }
    console.error('Apply error:', err);
    res.status(500).json({ msg: 'Errore durante l\'applicazione dei dati.' });
  }
});

// ── POST /api/documents/:documentId/retry ─────────────────────
router.post('/documents/:documentId/retry', authenticateJWT, async (req, res) => {
  try {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId)) return res.status(400).json({ msg: 'ID documento non valido.' });

    const doc = await repo.getDocumentById(docId);
    if (!doc) return res.status(404).json({ msg: 'Documento non trovato.' });
    if (doc.user_id !== req.user.user_id) return res.status(403).json({ msg: 'Accesso negato.' });

    if (doc.ocr_status !== 'failed') {
      return res.status(400).json({ msg: 'Solo documenti in stato "failed" possono essere riprovati.' });
    }

    if (!doc.storage_path) {
      return res.status(400).json({
        msg: 'File non disponibile per il retry (errore di validazione originale).',
      });
    }

    const result = await ocrService.processDocument(doc);
    await repo.updateBatchStatus(doc.batch_id);

    res.json({
      documentId: docId,
      status: result.status,
      fields: result.fields || null,
      validationIssues: result.validationIssues || null,
      error: result.error || null,
    });
  } catch (err) {
    console.error('Retry error:', err);
    res.status(500).json({ msg: 'Errore durante il retry.' });
  }
});

module.exports = router;
