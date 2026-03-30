import axiosInstance from '../axiosInstance';
import { generateMockExtraction } from './ocrMockData';

const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_OCR_USE_MOCK === 'true';

const MOCK_PROCESSING_DELAY_MS = 2500;

const mockJobs = new Map();

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

// ── Upload a single file ────────────────────────────────────
export async function uploadDocument(file, { signal, certificationId } = {}) {
  if (USE_MOCK) {
    await delay(600 + Math.random() * 1200, signal);
    if (Math.random() < 0.04) throw new Error('Errore simulato durante il caricamento');
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    mockJobs.set(documentId, { startedAt: Date.now(), fileName: file.name });
    return { documentId, fileName: file.name };
  }

  const formData = new FormData();
  formData.append('files', file);
  if (certificationId != null) {
    formData.append('certificationId', String(certificationId));
  }
  const res = await axiosInstance.post('/documents/upload', formData, {
    signal,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const doc = res.data.documents?.[0];
  return { documentId: doc?.documentId, fileName: doc?.fileName || file.name };
}

// ── Poll processing status ──────────────────────────────────
// Valid statuses from backend: uploaded, processing, needs_review, confirmed, applied, failed
export async function getDocumentStatus(documentId) {
  if (USE_MOCK) {
    await delay(150 + Math.random() * 250);
    const job = mockJobs.get(documentId);
    if (!job) return { status: 'failed', error: 'Job not found' };
    const elapsed = Date.now() - job.startedAt;
    if (elapsed < MOCK_PROCESSING_DELAY_MS) {
      return { status: 'processing', progress: Math.min(95, Math.round((elapsed / MOCK_PROCESSING_DELAY_MS) * 100)) };
    }
    return { status: 'needs_review' };
  }

  const res = await axiosInstance.get(`/documents/${documentId}`);
  return { status: res.data.status, error: res.data.error };
}

// ── Fetch extraction result for review ──────────────────────
// Returns review_payload from document_results (fields + validationIssues)
export async function getExtractionResult(documentId) {
  if (USE_MOCK) {
    await delay(100 + Math.random() * 200);
    const job = mockJobs.get(documentId);
    return generateMockExtraction(documentId, job?.fileName ?? 'unknown.pdf');
  }

  const res = await axiosInstance.get(`/documents/${documentId}/result`);
  const data = res.data;

  const reviewPayload = data.reviewPayload || {};
  const fields = reviewPayload.fields || data.normalizedOutput?.fields || [];

  return {
    documentId: data.documentId,
    fileName: data.fileName,
    status: data.status,
    entities: [
      {
        entityId: `doc_${data.documentId}_vehicle`,
        entityType: 'vehicle',
        displayName: 'Veicolo',
        fields,
      },
    ],
    validationIssues: data.validationIssues || [],
    confirmedOutput: data.confirmedOutput || null,
  };
}

// ── Confirm reviewed extraction ─────────────────────────────
// Transitions document from needs_review → confirmed
export async function confirmExtraction(documentId, _entityId, payload) {
  if (USE_MOCK) {
    await delay(200 + Math.random() * 300);
    return { success: true, documentId, status: 'confirmed' };
  }

  const res = await axiosInstance.post(`/documents/${documentId}/confirm`, payload);
  return res.data;
}

// ── Apply confirmed data to business tables ─────────────────
// Transitions document from confirmed → applied
export async function applyDocument(documentId, { certificationId, transportMode } = {}) {
  if (USE_MOCK) {
    await delay(200 + Math.random() * 300);
    return { success: true, documentId, status: 'applied' };
  }

  const res = await axiosInstance.post(`/documents/${documentId}/apply`, {
    certificationId,
    transportMode,
  });
  return res.data;
}
