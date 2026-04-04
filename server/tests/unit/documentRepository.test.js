const pool = require('../../db');
const repo = require('../../services/documents/documentRepository');

describe('documentRepository.updateDocumentStatus', () => {
  beforeEach(() => {
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [{}] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets ocr_error_code and ocr_error_message when status is failed', async () => {
    await repo.updateDocumentStatus(42, 'failed', {
      errorCode: 'PROCESSING_ERROR',
      errorMessage: 'boom',
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('ocr_error_code = $3');
    expect(sql).toContain('ocr_error_message = $4');
    expect(params).toEqual([42, 'failed', 'PROCESSING_ERROR', 'boom']);
  });

  it('clears ocr_error columns when moving to processing', async () => {
    await repo.updateDocumentStatus(7, 'processing');

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/ocr_error_code\s*=\s*NULL/);
    expect(sql).toMatch(/ocr_error_message\s*=\s*NULL/);
  });

  it('clears ocr_error columns when moving to needs_review', async () => {
    await repo.updateDocumentStatus(7, 'needs_review');

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toMatch(/ocr_error_code\s*=\s*NULL/);
    expect(sql).toMatch(/ocr_error_message\s*=\s*NULL/);
  });

  it('after failed then processing then needs_review, success path SQL clears errors each time', async () => {
    await repo.updateDocumentStatus(1, 'failed', {
      errorCode: 'OLD',
      errorMessage: 'stale',
    });
    const [failedSql, failedParams] = pool.query.mock.calls[0];
    expect(failedSql).toContain('ocr_error_code = $3');
    expect(failedParams).toContain('OLD');

    vi.mocked(pool.query).mockClear();
    vi.mocked(pool.query).mockResolvedValue({ rows: [{}] });

    await repo.updateDocumentStatus(1, 'processing');
    expect(pool.query.mock.calls[0][0]).toMatch(/ocr_error_code\s*=\s*NULL/);

    vi.mocked(pool.query).mockClear();
    vi.mocked(pool.query).mockResolvedValue({ rows: [{}] });

    await repo.updateDocumentStatus(1, 'needs_review');
    expect(pool.query.mock.calls[0][0]).toMatch(/ocr_error_message\s*=\s*NULL/);
  });

  it('sets ocr_error columns to NULL when null is passed explicitly (non-processing status)', async () => {
    await repo.updateDocumentStatus(9, 'confirmed', {
      confirmedBy: 3,
      errorCode: null,
      errorMessage: null,
    });

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('ocr_error_code = $4');
    expect(sql).toContain('ocr_error_message = $5');
    expect(params).toEqual([9, 'confirmed', 3, null, null]);
  });

  it('does not touch ocr_error columns when error fields are omitted (e.g. applied)', async () => {
    await repo.updateDocumentStatus(5, 'applied');

    const [sql] = pool.query.mock.calls[0];
    expect(sql).not.toMatch(/ocr_error_code/);
    expect(sql).not.toMatch(/ocr_error_message/);
  });
});
