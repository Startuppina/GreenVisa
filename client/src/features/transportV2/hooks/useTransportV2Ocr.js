import { useCallback, useState } from 'react';
import {
  applyTransportV2OcrDocument,
  fetchTransportV2DocumentResult,
  uploadTransportV2Documents,
} from '../api/transportV2Api.js';
import { extractApiErrorMessage } from '../api/transportV2Mappers.js';

function createUploadItem(seed = {}) {
  return {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    documentId: null,
    fileName: '',
    status: 'pending',
    error: null,
    validationIssues: [],
    result: null,
    selectedTransportMode: '',
    isFetchingResult: false,
    isApplying: false,
    appliedVehicleId: null,
    ...seed,
  };
}

export default function useTransportV2Ocr({ certificationId, onApplied }) {
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const updateUpload = useCallback((documentId, updater) => {
    setUploads((previous) =>
      previous.map((upload) => {
        if (upload.documentId !== documentId) {
          return upload;
        }

        return typeof updater === 'function' ? updater(upload) : { ...upload, ...updater };
      }),
    );
  }, []);

  const loadDocumentResult = useCallback(async (documentId) => {
    updateUpload(documentId, { isFetchingResult: true, error: null });

    try {
      const result = await fetchTransportV2DocumentResult(documentId);
      updateUpload(documentId, (upload) => ({
        ...upload,
        isFetchingResult: false,
        result,
        status: result.status || upload.status,
        validationIssues: result.validationIssues || [],
        selectedTransportMode: upload.selectedTransportMode || result.transportV2VehiclePrefill?.transport_mode || '',
      }));
    } catch (error) {
      updateUpload(documentId, {
        isFetchingResult: false,
        error: extractApiErrorMessage(error, 'Unable to load OCR result.'),
      });
    }
  }, [updateUpload]);

  const uploadFiles = useCallback(async (files) => {
    if (!files?.length) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadTransportV2Documents({
        certificationId,
        files,
      });

      const nextUploads = (response.documents || []).map((document) =>
        createUploadItem({
          documentId: document.documentId,
          fileName: document.fileName,
          status: document.status,
          error: document.error || null,
          validationIssues: document.validationIssues || document.errors || [],
        }),
      );

      setUploads((previous) => [...nextUploads, ...previous]);
      setIsUploading(false);

      await Promise.all(
        nextUploads
          .filter((upload) => upload.documentId && upload.status !== 'failed')
          .map((upload) => loadDocumentResult(upload.documentId)),
      );
    } catch (error) {
      setIsUploading(false);
      setUploadError(extractApiErrorMessage(error, 'Unable to upload OCR documents.'));
    }
  }, [certificationId, loadDocumentResult]);

  const setUploadTransportMode = useCallback((documentId, value) => {
    updateUpload(documentId, {
      selectedTransportMode: value,
    });
  }, [updateUpload]);

  const applyUpload = useCallback(async (documentId) => {
    const upload = uploads.find((item) => item.documentId === documentId);
    if (!upload) {
      return { ok: false };
    }

    updateUpload(documentId, {
      isApplying: true,
      error: null,
    });

    try {
      const response = await applyTransportV2OcrDocument(documentId, {
        certificationId,
        ...(upload.selectedTransportMode ? { transportMode: upload.selectedTransportMode } : {}),
      });

      updateUpload(documentId, {
        isApplying: false,
        status: response.status || 'applied',
        appliedVehicleId: response.vehicle?.vehicle_id || null,
      });

      onApplied?.(response);
      return { ok: true, response };
    } catch (error) {
      updateUpload(documentId, {
        isApplying: false,
        error: extractApiErrorMessage(error, 'Unable to apply OCR result.'),
      });
      return { ok: false };
    }
  }, [certificationId, onApplied, updateUpload, uploads]);

  return {
    uploads,
    isUploading,
    uploadError,
    uploadFiles,
    setUploadTransportMode,
    applyUpload,
    refreshUploadResult: loadDocumentResult,
  };
}
