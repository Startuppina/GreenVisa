import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadDocument, getDocumentStatus, getExtractionResult } from './ocrApi';
import {
  FILE_STATUS,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './ocrConstants';

const POLL_INTERVAL_MS = 1000;

let fileIdSeq = 0;

function validateFile(file) {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Formato non supportato (${ext}). Usa PDF, JPG o PNG.`;
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo MIME non riconosciuto (${file.type}). Verifica che il file sia valido.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File troppo grande (${sizeMB} MB). Il limite è 10 MB.`;
  }
  return null;
}

function isDuplicate(file, entries) {
  return entries.some(
    (e) =>
      e.file.name === file.name &&
      e.file.size === file.size &&
      e.file.lastModified === file.lastModified,
  );
}

function buildEntry(file, existingEntries) {
  const id = `file_${++fileIdSeq}`;

  if (isDuplicate(file, existingEntries)) {
    return { id, file, status: FILE_STATUS.INVALID, error: 'File già presente nella coda.', documentId: null, abortController: null };
  }

  const validationError = validateFile(file);
  if (validationError) {
    return { id, file, status: FILE_STATUS.INVALID, error: validationError, documentId: null, abortController: null };
  }

  return { id, file, status: FILE_STATUS.READY, error: null, documentId: null, abortController: null };
}

const TERMINAL_STATUSES = new Set(['needs_review', 'confirmed', 'applied']);

export function useOcrPipeline(certificationId = null) {
  const [fileEntries, setFileEntries] = useState([]);
  const [documents, setDocuments] = useState([]);

  const pollingTimers = useRef(new Map());
  const activeUploads = useRef(new Set());

  const updateEntry = useCallback((id, patch) => {
    setFileEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // ── Polling chain (recursive setTimeout, no overlap) ──────
  const pollForResult = useCallback(
    (fileId, documentId) => {
      const tick = async () => {
        try {
          const res = await getDocumentStatus(documentId);

          if (TERMINAL_STATUSES.has(res.status)) {
            pollingTimers.current.delete(fileId);
            const extraction = await getExtractionResult(documentId);
            setDocuments((prev) => [...prev, extraction]);
            updateEntry(fileId, { status: FILE_STATUS.NEEDS_REVIEW });
            return;
          }

          if (res.status === 'failed') {
            pollingTimers.current.delete(fileId);
            updateEntry(fileId, { status: FILE_STATUS.FAILED, error: res.error || 'Elaborazione fallita.' });
            return;
          }

          const timer = setTimeout(tick, POLL_INTERVAL_MS);
          pollingTimers.current.set(fileId, timer);
        } catch {
          pollingTimers.current.delete(fileId);
          updateEntry(fileId, { status: FILE_STATUS.FAILED, error: 'Errore di connessione durante il polling.' });
        }
      };

      const timer = setTimeout(tick, POLL_INTERVAL_MS);
      pollingTimers.current.set(fileId, timer);
    },
    [updateEntry],
  );

  // ── Upload + begin polling for a single entry ─────────────
  const processFile = useCallback(
    async (entry) => {
      if (activeUploads.current.has(entry.id)) return;
      activeUploads.current.add(entry.id);

      const abortController = new AbortController();
      updateEntry(entry.id, { status: FILE_STATUS.UPLOADING, error: null, abortController });

      try {
        const { documentId } = await uploadDocument(entry.file, {
          signal: abortController.signal,
          certificationId,
        });
        updateEntry(entry.id, { status: FILE_STATUS.PROCESSING, documentId, abortController: null });
        pollForResult(entry.id, documentId);
      } catch (err) {
        if (err.name === 'AbortError') {
          updateEntry(entry.id, { status: FILE_STATUS.CANCELLED, abortController: null });
        } else {
          updateEntry(entry.id, { status: FILE_STATUS.FAILED, error: err.message || 'Caricamento fallito.', abortController: null });
        }
      } finally {
        activeUploads.current.delete(entry.id);
      }
    },
    [certificationId, updateEntry, pollForResult],
  );

  // ── Public actions ────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    setFileEntries((prev) => {
      const incoming = Array.from(fileList).map((f) => buildEntry(f, prev));
      return [...prev, ...incoming];
    });
  }, []);

  const removeFile = useCallback(
    (fileId) => {
      setFileEntries((prev) => {
        const entry = prev.find((e) => e.id === fileId);
        entry?.abortController?.abort();
        return prev.filter((e) => e.id !== fileId);
      });
      const timer = pollingTimers.current.get(fileId);
      if (timer) {
        clearTimeout(timer);
        pollingTimers.current.delete(fileId);
      }
    },
    [],
  );

  const cancelUpload = useCallback((fileId) => {
    setFileEntries((prev) => {
      const entry = prev.find((e) => e.id === fileId);
      entry?.abortController?.abort();
      return prev.map((e) =>
        e.id === fileId ? { ...e, status: FILE_STATUS.CANCELLED, abortController: null } : e,
      );
    });
  }, []);

  const submitFiles = useCallback(() => {
    setFileEntries((prev) => {
      const ready = prev.filter((e) => e.status === FILE_STATUS.READY);
      ready.forEach((entry) => processFile(entry));
      return prev;
    });
  }, [processFile]);

  const retryFile = useCallback(
    (fileId) => {
      setFileEntries((prev) => {
        const entry = prev.find((e) => e.id === fileId);
        if (entry && [FILE_STATUS.FAILED, FILE_STATUS.CANCELLED].includes(entry.status)) {
          processFile(entry);
        }
        return prev;
      });
    },
    [processFile],
  );

  const markFileConfirmed = useCallback((fileId) => {
    updateEntry(fileId, { status: FILE_STATUS.CONFIRMED });
  }, [updateEntry]);

  const markFileApplied = useCallback((fileId) => {
    updateEntry(fileId, { status: FILE_STATUS.APPLIED });
  }, [updateEntry]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      pollingTimers.current.forEach((t) => clearTimeout(t));
      pollingTimers.current.clear();
    };
  }, []);

  return {
    fileEntries,
    documents,
    addFiles,
    removeFile,
    cancelUpload,
    submitFiles,
    retryFile,
    markFileConfirmed,
    markFileApplied,
  };
}
