import { buildOcrUploadPreviewLines } from "../utils/ocrResultPreview.js";
import { TRANSPORT_MODE_OPTIONS } from "../utils/validation.js";

function getPreviewLines(upload) {
  return buildOcrUploadPreviewLines(upload.result).filter(
    ([, value]) => value != null && value !== "",
  );
}

export default function OcrUploadItem({
  upload,
  onTransportModeChange,
  onApply,
  onRefresh,
}) {
  const previewLines = getPreviewLines(upload);

  return (
    <article className="grid gap-6 border-t border-slate-200 pt-8 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              {upload.fileName || `Documento ${upload.documentId}`}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Documento #{upload.documentId} · stato: {upload.status}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={onRefresh}
              disabled={upload.isFetchingResult}
            >
              {upload.isFetchingResult ? "Aggiornamento…" : "Aggiorna OCR"}
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="button"
              onClick={onApply}
              disabled={upload.isApplying || !upload.documentId}
            >
              {upload.isApplying ? "Applicazione…" : "Crea veicolo da OCR"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4">
        <label className="block text-sm font-medium text-slate-800" htmlFor={`ocr-mode-${upload.documentId ?? upload.localId}`}>
          Modalità di trasporto suggerita
        </label>
        <select
          id={`ocr-mode-${upload.documentId ?? upload.localId}`}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          value={upload.selectedTransportMode}
          onChange={(event) => onTransportModeChange(event.target.value)}
        >
          <option value="">Non impostare</option>
          {TRANSPORT_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-[8rem] rounded-xl bg-slate-50 px-4 py-4 lg:col-span-8">
        <div className="text-sm font-medium text-slate-900">Anteprima campi letti</div>
        {previewLines.length ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {previewLines.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-slate-800">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Anteprima non ancora disponibile. Se l’elaborazione è in corso, usa «Aggiorna OCR» tra qualche
            secondo.
          </p>
        )}
      </div>

      {upload.validationIssues?.length ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:col-span-12">
          <div className="font-medium">Note di revisione OCR</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {upload.validationIssues.map((issue, index) => (
              <li key={`${upload.documentId}-issue-${index}`}>
                {issue.message || issue.code || JSON.stringify(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {upload.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 lg:col-span-12">
          {upload.error}
        </div>
      ) : null}

      {upload.appliedVehicleId ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 lg:col-span-12">
          Riga OCR applicata come veicolo <code className="rounded bg-emerald-100/80 px-1 py-0.5 text-xs">{upload.appliedVehicleId}</code>
          . Completa i campi mancanti nel pannello «Dettaglio veicolo».
        </div>
      ) : null}
    </article>
  );
}
