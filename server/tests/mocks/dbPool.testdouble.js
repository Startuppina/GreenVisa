'use strict';

/**
 * In-memory pool.query stand-in when `process.env.VITEST === 'true'` (see server/db.js).
 * No Vitest imports — works from CommonJS.
 */

const poolQueryState = {
  batchDocumentStatuses: [{ ocr_status: 'needs_review' }],
};

function defaultQueryImpl(sql, params) {
  const s = typeof sql === 'string' ? sql : '';

  if (s.includes('SELECT ocr_status FROM documents WHERE batch_id')) {
    return Promise.resolve({ rows: poolQueryState.batchDocumentStatuses.map((r) => ({ ...r })) });
  }

  if (s.includes('INSERT INTO document_batches')) {
    return Promise.resolve({
      rows: [
        {
          id: 200,
          user_id: params[0],
          building_id: params[1],
          category: params[2],
          file_count: params[3],
          status: 'processing',
        },
      ],
    });
  }

  if (s.includes('INSERT INTO documents')) {
    return Promise.resolve({
      rows: [
        {
          id: 99,
          batch_id: params[0],
          user_id: params[1],
          survey_response_id: params[3],
          original_name: params[4],
          stored_name: params[5],
          storage_path: params[6],
          mime_type: params[7],
          file_size: params[8],
          sha256: params[9],
          ocr_provider: params[10],
          ocr_region: params[11],
          ocr_status: params[12],
        },
      ],
    });
  }

  if (s.includes('INSERT INTO document_results')) {
    return Promise.resolve({ rows: [{ id: 1, document_id: params[0] }] });
  }

  if (s.includes('DELETE FROM document_results')) {
    return Promise.resolve({ rows: [] });
  }

  if (s.includes('UPDATE document_batches SET status')) {
    return Promise.resolve({ rows: [] });
  }

  if (s.includes('UPDATE documents SET')) {
    const status = params[1];
    return Promise.resolve({ rows: [{ id: params[0], ocr_status: status }] });
  }

  return Promise.resolve({ rows: [{ id: 42, ocr_status: 'processing' }] });
}

let queryImpl = defaultQueryImpl;
const queryCalls = [];

function query(sql, params) {
  queryCalls.push([sql, params]);
  return queryImpl(sql, params);
}

query.mock = { calls: queryCalls };
query.mockImplementation = (fn) => {
  queryImpl = fn;
};
query.mockClear = () => {
  queryCalls.length = 0;
};

function resetPoolTestDouble() {
  poolQueryState.batchDocumentStatuses = [{ ocr_status: 'needs_review' }];
  queryImpl = defaultQueryImpl;
  queryCalls.length = 0;
}

const pool = {
  query,
  poolQueryState,
  resetPoolTestDouble,
};

module.exports = pool;
