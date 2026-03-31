import { useRef } from 'react';
import { FILE_STATUS, STATUS_LABELS, STATUS_COLORS } from '../../ocr/ocrConstants';
import { useOcrPipeline } from '../../ocr/useOcrPipeline';

export default function TransportV2OcrUploadPanel({ certificationId, disabled }) {
  const inputRef = useRef(null);
  const {
    fileEntries,
    documents,
    addFiles,
    removeFile,
    cancelUpload,
    submitFiles,
    retryFile,
  } = useOcrPipeline(certificationId);

  const readyCount = fileEntries.filter((entry) => entry.status === FILE_STATUS.READY).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">OCR upload</h3>
          <p className="mt-1 text-sm text-slate-700">
            Carica uno o piu libretti. L&apos;upload usa il backend OCR esistente; la review e
            l&apos;apply completo restano separati e le righe OCR appariranno nel draft dopo la
            conferma/applicazione del documento.
          </p>
          {!certificationId ? (
            <p className="mt-2 text-sm text-rose-700">
              Imposta un certification ID per usare l&apos;upload OCR.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled || !certificationId}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => inputRef.current?.click()}
          >
            Seleziona file
          </button>
          <button
            type="button"
            disabled={disabled || readyCount === 0 || !certificationId}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={submitFiles}
          >
            Carica
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            addFiles(event.target.files);
            event.target.value = '';
          }
        }}
      />

      {fileEntries.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {fileEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-slate-900">{entry.file.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[entry.status]}`}
                  >
                    {STATUS_LABELS[entry.status]}
                  </span>
                </div>
                {entry.error ? (
                  <p className="mt-1 text-sm text-rose-700">{entry.error}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {entry.status === FILE_STATUS.UPLOADING ? (
                  <button
                    type="button"
                    className="rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
                    onClick={() => cancelUpload(entry.id)}
                  >
                    Annulla
                  </button>
                ) : null}
                {[FILE_STATUS.FAILED, FILE_STATUS.CANCELLED].includes(entry.status) ? (
                  <button
                    type="button"
                    className="rounded-md border border-sky-300 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                    onClick={() => retryFile(entry.id)}
                  >
                    Riprova
                  </button>
                ) : null}
                {![FILE_STATUS.UPLOADING, FILE_STATUS.PROCESSING].includes(entry.status) ? (
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    onClick={() => removeFile(entry.id)}
                  >
                    Rimuovi
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {documents.length > 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          Documenti OCR processati in questa sessione: <span className="font-semibold">{documents.length}</span>
        </p>
      ) : null}
    </section>
  );
}
