-- Processor version is not returned usefully on ProcessDocument responses; column removed from app.
ALTER TABLE document_results
  DROP COLUMN IF EXISTS provider_processor_version;
