import axiosInstance from '../axiosInstance';
import { generateMockExtraction } from './ocrMockData';

// ──────────────────────────────────────────────────────────────
// Toggle this flag to switch between mock responses and real backend.
// When the backend endpoints are ready, set USE_MOCK to false and
// update the endpoint paths below if they differ from the placeholders.
// ──────────────────────────────────────────────────────────────
const USE_MOCK = true;

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
// Returns { documentId, fileName }
export async function uploadDocument(file, { signal } = {}) {
  if (USE_MOCK) {
    await delay(600 + Math.random() * 1200, signal);
    if (Math.random() < 0.04) throw new Error('Errore simulato durante il caricamento');
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    mockJobs.set(documentId, { startedAt: Date.now(), fileName: file.name });
    return { documentId, fileName: file.name };
  }

  // TODO: replace with real endpoint
  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosInstance.post('/ocr/upload', formData, {
    signal,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ── Poll processing status ──────────────────────────────────
// Returns { status: 'processing' | 'completed' | 'failed', progress?, error? }
export async function getDocumentStatus(documentId) {
  if (USE_MOCK) {
    await delay(150 + Math.random() * 250);
    const job = mockJobs.get(documentId);
    if (!job) return { status: 'failed', error: 'Job not found' };
    const elapsed = Date.now() - job.startedAt;
    if (elapsed < MOCK_PROCESSING_DELAY_MS) {
      return { status: 'processing', progress: Math.min(95, Math.round((elapsed / MOCK_PROCESSING_DELAY_MS) * 100)) };
    }
    return { status: 'completed' };
  }

  // TODO: replace with real endpoint
  const res = await axiosInstance.get(`/ocr/status/${documentId}`);
  return res.data;
}

// ── Fetch extraction result ─────────────────────────────────
// Returns full document extraction object (see ocrMockData shape)
export async function getExtractionResult(documentId) {
  if (USE_MOCK) {
    await delay(100 + Math.random() * 200);
    const job = mockJobs.get(documentId);
    return generateMockExtraction(documentId, job?.fileName ?? 'unknown.pdf');
  }

  // TODO: replace with real endpoint
  const res = await axiosInstance.get(`/ocr/result/${documentId}`);
  return res.data;
}

// ── Confirm reviewed extraction ─────────────────────────────
// payload: { fields: [{ key, value, originalValue, confidence }] }
export async function confirmExtraction(documentId, entityId, payload) {
  if (USE_MOCK) {
    await delay(200 + Math.random() * 300);
    return { success: true, documentId, entityId };
  }

  // TODO: replace with real endpoint
  const res = await axiosInstance.post(`/ocr/confirm/${documentId}/${entityId}`, payload);
  return res.data;
}
