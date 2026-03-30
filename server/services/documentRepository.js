const pool = require('../db');

// ── Batches ───────────────────────────────────────────────────

async function createBatch({ userId, buildingId, category, fileCount }) {
  const { rows } = await pool.query(
    `INSERT INTO document_batches (user_id, building_id, category, file_count, status)
     VALUES ($1, $2, $3, $4, 'processing')
     RETURNING *`,
    [userId, buildingId || null, category || null, fileCount],
  );
  return rows[0];
}

async function updateBatchStatus(batchId) {
  const { rows: docs } = await pool.query(
    'SELECT ocr_status FROM documents WHERE batch_id = $1',
    [batchId],
  );

  let status;
  if (docs.length === 0) {
    status = 'empty';
  } else if (docs.every((d) => d.ocr_status === 'applied')) {
    status = 'applied';
  } else if (docs.every((d) => d.ocr_status === 'confirmed')) {
    status = 'confirmed';
  } else if (docs.every((d) => ['needs_review', 'confirmed', 'applied'].includes(d.ocr_status))) {
    status = 'needs_review';
  } else if (docs.some((d) => d.ocr_status === 'processing')) {
    status = 'processing';
  } else if (docs.every((d) => d.ocr_status === 'failed')) {
    status = 'failed';
  } else {
    status = 'partial';
  }

  await pool.query(
    'UPDATE document_batches SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, batchId],
  );
  return status;
}

async function getBatchById(batchId) {
  const { rows } = await pool.query('SELECT * FROM document_batches WHERE id = $1', [batchId]);
  return rows[0] || null;
}

async function getBatchWithDocuments(batchId) {
  const batch = await getBatchById(batchId);
  if (!batch) return null;
  const { rows: docs } = await pool.query(
    'SELECT * FROM documents WHERE batch_id = $1 ORDER BY id',
    [batchId],
  );
  return { ...batch, documents: docs };
}

// ── Documents ─────────────────────────────────────────────────

async function createDocument({
  batchId, userId, buildingId, originalName, storedName,
  storagePath, mimeType, fileSize, sha256, ocrProvider, ocrRegion, ocrStatus, surveyResponseId,
}) {
  const { rows } = await pool.query(
    `INSERT INTO documents
       (batch_id, user_id, building_id, survey_response_id, original_name, stored_name, storage_path,
        mime_type, file_size, sha256, ocr_provider, ocr_region, ocr_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      batchId, userId, buildingId || null, surveyResponseId || null, originalName, storedName, storagePath,
      mimeType, fileSize, sha256, ocrProvider, ocrRegion, ocrStatus,
    ],
  );
  return rows[0];
}

async function updateDocumentStatus(docId, status, { errorCode, errorMessage, confirmedBy } = {}) {
  const sets = ['ocr_status = $2', 'updated_at = NOW()'];
  const params = [docId, status];
  let idx = 3;

  if (status === 'needs_review') {
    sets.push('processed_at = NOW()');
  }
  if (status === 'confirmed') {
    sets.push('confirmed_at = NOW()');
    if (confirmedBy !== undefined) {
      sets.push(`confirmed_by = $${idx}`);
      params.push(confirmedBy);
      idx++;
    }
  }
  if (status === 'applied') {
    sets.push('applied_at = NOW()');
  }
  if (errorCode !== undefined) {
    sets.push(`ocr_error_code = $${idx}`);
    params.push(errorCode);
    idx++;
  }
  if (errorMessage !== undefined) {
    sets.push(`ocr_error_message = $${idx}`);
    params.push(errorMessage);
    idx++;
  }

  const { rows } = await pool.query(
    `UPDATE documents SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  );
  return rows[0];
}

async function getDocumentById(docId) {
  const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [docId]);
  return rows[0] || null;
}

async function getDocumentsByBatchId(batchId) {
  const { rows } = await pool.query(
    'SELECT * FROM documents WHERE batch_id = $1 ORDER BY id',
    [batchId],
  );
  return rows;
}

async function getDocumentsByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM documents WHERE user_id = $1 AND deleted_at IS NULL ORDER BY uploaded_at DESC',
    [userId],
  );
  return rows;
}

async function linkDocumentToSurveyResponse(docId, surveyResponseId) {
  const { rows } = await pool.query(
    `UPDATE documents
     SET survey_response_id = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [docId, surveyResponseId],
  );

  return rows[0] || null;
}

// ── Results ───────────────────────────────────────────────────

async function createResult({
  documentId, rawProviderOutput, normalizedOutput, derivedOutput,
  reviewPayload, validationIssues, processorId, processorVersion,
}) {
  const { rows } = await pool.query(
    `INSERT INTO document_results
       (document_id, raw_provider_output, normalized_output, derived_output,
        review_payload, validation_issues,
        provider_processor_id, provider_processor_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      documentId,
      JSON.stringify(rawProviderOutput),
      JSON.stringify(normalizedOutput),
      JSON.stringify(derivedOutput || null),
      JSON.stringify(reviewPayload || null),
      JSON.stringify(validationIssues),
      processorId || null,
      processorVersion || null,
    ],
  );
  return rows[0];
}

async function getResultByDocumentId(docId) {
  const { rows } = await pool.query(
    'SELECT * FROM document_results WHERE document_id = $1',
    [docId],
  );
  return rows[0] || null;
}

async function updateResultConfirmed(docId, confirmedOutput) {
  const { rows } = await pool.query(
    `UPDATE document_results
     SET confirmed_output = $2, updated_at = NOW()
     WHERE document_id = $1
     RETURNING *`,
    [docId, JSON.stringify(confirmedOutput)],
  );
  return rows[0] || null;
}

async function updateResultReviewPayload(docId, reviewPayload) {
  const { rows } = await pool.query(
    `UPDATE document_results
     SET review_payload = $2, updated_at = NOW()
     WHERE document_id = $1
     RETURNING *`,
    [docId, JSON.stringify(reviewPayload)],
  );
  return rows[0] || null;
}

module.exports = {
  createBatch,
  updateBatchStatus,
  getBatchById,
  getBatchWithDocuments,
  createDocument,
  updateDocumentStatus,
  getDocumentById,
  getDocumentsByBatchId,
  getDocumentsByUserId,
  linkDocumentToSurveyResponse,
  createResult,
  getResultByDocumentId,
  updateResultConfirmed,
  updateResultReviewPayload,
};
