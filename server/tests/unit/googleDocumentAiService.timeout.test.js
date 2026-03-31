/**
 * Isolated file so `vi.mock('@google-cloud/documentai')` is hoisted without affecting other unit tests.
 */
vi.mock('@google-cloud/documentai', () => ({
  v1: {
    DocumentProcessorServiceClient: vi.fn().mockImplementation(() => ({
      processDocument: vi.fn(() => new Promise(() => {})),
    })),
  },
}));

describe('googleDocumentAiService.processDocument (provider timeout)', () => {
  const prevProject = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const prevProcessor = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
  const prevTimeoutMs = process.env.OCR_PROVIDER_TIMEOUT_MS;

  afterEach(() => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = prevProject;
    process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID = prevProcessor;
    process.env.OCR_PROVIDER_TIMEOUT_MS = prevTimeoutMs;
    vi.resetModules();
  });

  afterAll(() => {
    vi.unmock('@google-cloud/documentai');
    vi.resetModules();
  });

  it('rejects with OCR_PROVIDER_TIMEOUT when the RPC does not settle in time', async () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project';
    process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID = 'test-processor';
    process.env.OCR_PROVIDER_TIMEOUT_MS = '40';

    vi.resetModules();
    const { processDocument } = require('../../services/ocr/googleDocumentAiService');

    await expect(processDocument(Buffer.from('x'), 'application/pdf')).rejects.toMatchObject({
      code: 'OCR_PROVIDER_TIMEOUT',
      name: 'OcrProviderTimeoutError',
      retryable: true,
      message: 'Google Document AI request timed out',
    });
  });
});
