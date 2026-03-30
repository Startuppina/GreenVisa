import React, { useState, useCallback } from 'react';
import OcrUploadPanel from './OcrUploadPanel';
import OcrVehicleList from './OcrVehicleList';
import OcrReviewPanel from './OcrReviewPanel';
import OcrConfirmModal from './OcrConfirmModal';
import { useOcrPipeline } from './useOcrPipeline';
import { confirmExtraction, applyDocument } from './ocrApi';
import { FILE_STATUS } from './ocrConstants';

export default function OcrDevPage() {
  const {
    fileEntries,
    documents,
    addFiles,
    removeFile,
    cancelUpload,
    submitFiles,
    retryFile,
    markFileConfirmed,
    markFileApplied,
  } = useOcrPipeline();

  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [confirmedEntities, setConfirmedEntities] = useState(new Set());
  const [appliedEntities, setAppliedEntities] = useState(new Set());

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingConfirmEntityId, setPendingConfirmEntityId] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Derived data ──────────────────────────────────────────
  const allEntities = documents.flatMap((doc) =>
    doc.entities.map((ent) => ({
      ...ent,
      documentId: doc.documentId,
      fileName: doc.fileName,
    })),
  );

  const selectedEntity = allEntities.find((e) => e.entityId === selectedEntityId);
  const hasProcessed = fileEntries.some((e) =>
    [FILE_STATUS.NEEDS_REVIEW, FILE_STATUS.CONFIRMED, FILE_STATUS.APPLIED].includes(e.status),
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleFieldEdit = useCallback((entityId, fieldKey, value) => {
    setEditedFields((prev) => ({
      ...prev,
      [entityId]: { ...(prev[entityId] || {}), [fieldKey]: value },
    }));
  }, []);

  const handleConfirmRequest = useCallback((entityId) => {
    setPendingConfirmEntityId(entityId);
    setConfirmError(null);
    setConfirmModalOpen(true);
  }, []);

  const handleConfirmAccept = useCallback(async () => {
    if (!pendingConfirmEntityId) return;

    const entity = allEntities.find((e) => e.entityId === pendingConfirmEntityId);
    if (!entity) return;

    const edits = editedFields[entity.entityId] || {};
    const payload = {
      fields: entity.fields.map((f) => ({
        key: f.key,
        value: edits[f.key] ?? f.value,
        originalValue: f.value,
        confidence: f.confidence,
      })),
    };

    setConfirmLoading(true);
    try {
      await confirmExtraction(entity.documentId, entity.entityId, payload);
      setConfirmedEntities((prev) => new Set([...prev, entity.entityId]));

      const fileEntry = fileEntries.find((e) => e.documentId === entity.documentId);
      if (fileEntry) markFileConfirmed(fileEntry.id);

      setConfirmModalOpen(false);
      setPendingConfirmEntityId(null);
    } catch {
      setConfirmError('Si è verificato un errore durante la conferma. Riprova.');
    } finally {
      setConfirmLoading(false);
    }
  }, [pendingConfirmEntityId, allEntities, editedFields, fileEntries, markFileConfirmed]);

  const handleApply = useCallback(async (entityId) => {
    const entity = allEntities.find((e) => e.entityId === entityId);
    if (!entity) return;

    try {
      await applyDocument(entity.documentId);
      setAppliedEntities((prev) => new Set([...prev, entity.entityId]));

      const fileEntry = fileEntries.find((e) => e.documentId === entity.documentId);
      if (fileEntry) markFileApplied(fileEntry.id);
    } catch (err) {
      console.error('Apply failed:', err);
    }
  }, [allEntities, fileEntries, markFileApplied]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmModalOpen(false);
    setPendingConfirmEntityId(null);
    setConfirmError(null);
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Page header ──────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">OCR Dev Sandbox</h1>
            <span className="bg-yellow-200 text-yellow-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Dev Only
            </span>
          </div>
          <p className="text-gray-500">
            Pagina di sviluppo per testare il pipeline OCR. Carica documenti, verifica
            l'estrazione dati, conferma lo snapshot OCR e prefilla il draft Transport V2.
          </p>
        </header>

        {/* ── Upload panel ─────────────────────────────────── */}
        <OcrUploadPanel
          fileEntries={fileEntries}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onCancelUpload={cancelUpload}
          onSubmit={submitFiles}
          onRetry={retryFile}
        />

        {/* ── Vehicle list ─────────────────────────────────── */}
        {allEntities.length > 0 && (
          <OcrVehicleList
            entities={allEntities}
            selectedEntityId={selectedEntityId}
            onSelectEntity={setSelectedEntityId}
            confirmedEntities={confirmedEntities}
            appliedEntities={appliedEntities}
          />
        )}

        {/* ── Empty result state ───────────────────────────── */}
        {hasProcessed && allEntities.length === 0 && (
          <section className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <p className="text-lg text-gray-500">
              I documenti sono stati elaborati ma non sono stati trovati veicoli.
            </p>
          </section>
        )}

        {/* ── Review panel ─────────────────────────────────── */}
        {selectedEntity ? (
          <OcrReviewPanel
            key={selectedEntity.entityId}
            entity={selectedEntity}
            editedFields={editedFields[selectedEntity.entityId] || {}}
            onFieldEdit={(key, val) => handleFieldEdit(selectedEntity.entityId, key, val)}
            isConfirmed={confirmedEntities.has(selectedEntity.entityId)}
            isApplied={appliedEntities.has(selectedEntity.entityId)}
            onConfirm={() => handleConfirmRequest(selectedEntity.entityId)}
            onApply={() => handleApply(selectedEntity.entityId)}
          />
        ) : (
          allEntities.length > 0 && (
            <section className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
              <p className="text-gray-500 text-lg">
                Seleziona un veicolo dalla lista per visualizzare e modificare i dati estratti.
              </p>
            </section>
          )
        )}

        {/* ── Global summary when everything is applied ────── */}
        {allEntities.length > 0 && appliedEntities.size === allEntities.length && (
          <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-emerald-800 text-lg font-semibold">
              ✓ Tutti i veicoli sono stati confermati e applicati
            </p>
            <p className="text-emerald-700 text-sm mt-1">
              {allEntities.length} {allEntities.length === 1 ? 'veicolo applicato' : 'veicoli applicati'}{' '}
              da {documents.length} {documents.length === 1 ? 'documento' : 'documenti'}
            </p>
          </section>
        )}

        {/* ── Summary when everything is confirmed but not applied */}
        {allEntities.length > 0 &&
          confirmedEntities.size === allEntities.length &&
          appliedEntities.size < allEntities.length && (
          <section className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-green-800 text-lg font-semibold">
              ✓ Tutti i veicoli sono stati confermati
            </p>
            <p className="text-green-700 text-sm mt-1">
              Seleziona ciascun veicolo e premi "Prefilla nel draft Transport V2" per completare il processo.
            </p>
          </section>
        )}
      </div>

      {/* ── Confirm modal (portal-style overlay) ───────────── */}
      <OcrConfirmModal
        open={confirmModalOpen}
        onAccept={handleConfirmAccept}
        onCancel={handleConfirmCancel}
        error={confirmError}
        loading={confirmLoading}
      />
    </div>
  );
}
