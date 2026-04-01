import OcrUploadItem from './OcrUploadItem.jsx';

export default function OcrUploadPanel({
  uploads,
  isUploading,
  uploadError,
  onFileSelection,
  onTransportModeChange,
  onApplyUpload,
  onRefreshUpload,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Assistenza OCR</h2>
        <p className="mt-1 text-sm text-slate-600">
          Carica i documenti di circolazione, controlla l&apos;anteprima OCR e crea una riga veicolo parziale nel
          flusso principale del modulo.
        </p>
      </div>

      <label className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
        <span className="font-medium text-slate-900">Carica uno o più documenti</span>
        <input type="file" multiple onChange={onFileSelection} disabled={isUploading} />
        <span className="text-xs text-slate-500">
          I file vengono inviati a <code className="rounded bg-slate-200 px-1">/api/documents/upload</code> con
          categoria <code className="rounded bg-slate-200 px-1">transport</code>.
        </span>
      </label>

      {isUploading ? <p className="mt-4 text-sm text-slate-600">Caricamento ed elaborazione OCR in corso…</p> : null}
      {uploadError ? <p className="mt-4 text-sm text-rose-600">{uploadError}</p> : null}

      <div className="mt-5 space-y-4">
        {uploads.length ? (
          uploads.map((upload) => (
            <OcrUploadItem
              key={upload.documentId || upload.localId}
              upload={upload}
              onTransportModeChange={(value) => onTransportModeChange(upload.documentId, value)}
              onApply={() => onApplyUpload(upload.documentId)}
              onRefresh={() => onRefreshUpload(upload.documentId)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Nessun documento OCR ancora caricato.
          </div>
        )}
      </div>
    </section>
  );
}
