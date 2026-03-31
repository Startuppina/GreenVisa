const OCR_PROVIDER_TIMEOUT = 'OCR_PROVIDER_TIMEOUT';

class OcrProviderTimeoutError extends Error {
  constructor(message = 'Google Document AI request timed out') {
    super(message);
    this.name = 'OcrProviderTimeoutError';
    this.code = OCR_PROVIDER_TIMEOUT;
    this.retryable = true;
  }
}

module.exports = {
  OcrProviderTimeoutError,
  OCR_PROVIDER_TIMEOUT,
};
