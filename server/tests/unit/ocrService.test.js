const googleDocAi = require('../../services/ocr/googleDocumentAiService');
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
});
