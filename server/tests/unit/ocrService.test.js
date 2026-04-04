const googleDocAi = require('../../services/ocr/googleDocumentAiService');
const { OcrProviderTimeoutError } = require('../../services/ocr/ocrProviderErrors');
const storage = require('../../services/documents/documentStorageService');
const repo = require('../../services/documents/documentRepository');
const { processDocument: runOcr } = require('../../services/ocr/ocrService');

describe('ocrService.processDocument', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists compact raw_provider_output (document.text + document.entities only)', async () => {
    const rawProviderOutput = {
      document: {
        text: 'ocr text',
        entities: [{ type: 'fuel_type', mentionText: 'BENZ', confidence: 0.9 }],
      },
    };

    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockResolvedValue({
      rawProviderOutput,
      entities: [
        {
          type: 'fuel_type',
          mentionText: 'BENZ',
          confidence: 0.9,
          normalizedValue: 'BENZ',
          pageNumber: 1,
          boundingPoly: null,
        },
      ],
      metadata: { processorName: 'projects/x/processors/y', processorVersion: null },
    });

    const out = await runOcr({
      id: 7,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(out.status).toBe('needs_review');
    expect(repo.createResult).toHaveBeenCalledWith(
      expect.objectContaining({
        rawProviderOutput,
      }),
    );
    const passed = repo.createResult.mock.calls[0][0].rawProviderOutput;
    expect(Object.keys(passed)).toEqual(['document']);
    expect(Object.keys(passed.document).sort()).toEqual(['entities', 'text']);
  });

  it('createResult receives trimmed rawProviderOutput only (no duplicate processor metadata fields)', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockResolvedValue({
      rawProviderOutput: { document: { text: '', entities: [] } },
      entities: [],
      metadata: {
        processorName: 'projects/x/locations/eu/processors/y',
        processorVersion: 'deployed-from-response-7',
      },
    });

    await runOcr({
      id: 101,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.createResult).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 101,
        rawProviderOutput: { document: { text: '', entities: [] } },
      }),
    );
    const payload = repo.createResult.mock.calls[0][0];
    expect(payload).not.toHaveProperty('processorId');
    expect(payload).not.toHaveProperty('processorVersion');
  });

  it('createResult shape unchanged when Google metadata omits processorVersion', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockResolvedValue({
      rawProviderOutput: { document: { text: '', entities: [] } },
      entities: [],
      metadata: { processorName: 'projects/x/processors/y' },
    });

    await runOcr({
      id: 102,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.createResult).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 102,
        rawProviderOutput: { document: { text: '', entities: [] } },
      }),
    );
  });

  it('passes explicit null OCR error fields when entering processing and needs_review', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockResolvedValue({
      rawProviderOutput: { document: { text: '', entities: [] } },
      entities: [],
      metadata: {},
    });

    await runOcr({
      id: 7,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      7,
      'processing',
      expect.objectContaining({ errorCode: null, errorMessage: null }),
    );
    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      7,
      'needs_review',
      expect.objectContaining({ errorCode: null, errorMessage: null }),
    );
  });

  it('skips the processing transition when skipMarkProcessing is true (worker-claimed docs)', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockResolvedValue({
      rawProviderOutput: { document: { text: '', entities: [] } },
      entities: [],
      metadata: {},
    });

    await runOcr(
      {
        id: 7,
        storage_path: '/tmp/x.pdf',
        mime_type: 'application/pdf',
      },
      { skipMarkProcessing: true },
    );

    expect(repo.updateDocumentStatus).not.toHaveBeenCalledWith(
      7,
      'processing',
      expect.anything(),
    );
    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      7,
      'needs_review',
      expect.objectContaining({ errorCode: null, errorMessage: null }),
    );
  });

  it('marks document failed with OCR_PROVIDER_TIMEOUT when the provider times out', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockRejectedValue(new OcrProviderTimeoutError());

    const out = await runOcr({
      id: 42,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(out.status).toBe('failed');
    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      42,
      'failed',
      expect.objectContaining({
        errorCode: 'OCR_PROVIDER_TIMEOUT',
        errorMessage: 'Google Document AI request timed out',
      }),
    );
  });

  it('still uses PROCESSING_ERROR when the provider throws a generic error', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(googleDocAi, 'processDocument').mockRejectedValue(new Error('provider down'));

    await runOcr({
      id: 99,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      99,
      'failed',
      expect.objectContaining({
        errorCode: 'PROCESSING_ERROR',
        errorMessage: 'provider down',
      }),
    );
  });

  it('clears stale OCR error fields after a successful run following a timeout failure', async () => {
    vi.spyOn(storage, 'readFileBytes').mockReturnValue(Buffer.from('%PDF'));
    vi.spyOn(repo, 'updateDocumentStatus').mockResolvedValue({});
    vi.spyOn(repo, 'deleteResultByDocumentId').mockResolvedValue(undefined);
    vi.spyOn(repo, 'createResult').mockResolvedValue({});
    const googleSpy = vi.spyOn(googleDocAi, 'processDocument');

    googleSpy.mockRejectedValueOnce(new OcrProviderTimeoutError());
    await runOcr({
      id: 5,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      5,
      'failed',
      expect.objectContaining({ errorCode: 'OCR_PROVIDER_TIMEOUT' }),
    );

    googleSpy.mockResolvedValueOnce({
      rawProviderOutput: { document: { text: '', entities: [] } },
      entities: [],
      metadata: {},
    });

    await runOcr({
      id: 5,
      storage_path: '/tmp/x.pdf',
      mime_type: 'application/pdf',
    });

    expect(repo.updateDocumentStatus).toHaveBeenCalledWith(
      5,
      'needs_review',
      expect.objectContaining({ errorCode: null, errorMessage: null }),
    );
  });
});
