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
        <h2 className="text-xl font-semibold text-slate-900">OCR assist</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload registration documents, inspect a lightweight OCR preview, and then create a partial
          vehicle row inside the main form workflow.
        </p>
      </div>

      <label className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
        <span className="font-medium text-slate-900">Upload one or more documents</span>
        <input type="file" multiple onChange={onFileSelection} disabled={isUploading} />
        <span className="text-xs text-slate-500">
          Files are sent to `/api/documents/upload` with category `transport`.
        </span>
      </label>

      {isUploading ? <p className="mt-4 text-sm text-slate-600">Uploading and processing OCR...</p> : null}
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
            No OCR uploads yet.
          </div>
        )}
      </div>
    </section>
  );
}
