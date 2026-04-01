import { buildOcrUploadPreviewLines } from '../utils/ocrResultPreview.js';
import { TRANSPORT_MODE_OPTIONS } from '../utils/validation.js';

const OCR_STATUS_LABELS = {
  pending: 'In attesa',
  uploaded: 'Caricato',
  processing: 'Elaborazione in corso',
  needs_review: 'Da revisionare',
  confirmed: 'Confermato',
  applied: 'Applicato',
  failed: 'Non riuscito',
};

function formatOcrStatus(status) {
  if (status == null || status === '') {
    return '';
  }
  return OCR_STATUS_LABELS[status] ?? status;
}

function getPreviewLines(upload) {
  return buildOcrUploadPreviewLines(upload.result).filter(
    ([, value]) => value != null && value !== '',
  );
}

export default function OcrUploadItem({ upload, onTransportModeChange, onApply, onRefresh }) {
  const previewLines = getPreviewLines(upload);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900">{upload.fileName || `Documento ${upload.documentId}`}</div>
          <div className="mt-1 text-sm text-slate-500">
            Documento n. {upload.documentId} • stato: {formatOcrStatus(upload.status)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onRefresh}
            disabled={upload.isFetchingResult}
          >
            {upload.isFetchingResult ? 'Aggiornamento…' : 'Aggiorna OCR'}
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={onApply}
            disabled={upload.isApplying || !upload.documentId}
          >
            {upload.isApplying ? 'Applicazione…' : 'Crea veicolo'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px,1fr]">
        <label className="space-y-2">
          <div className="text-sm font-medium text-slate-800">Modalità di trasporto suggerita</div>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
        </label>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Anteprima OCR</div>
          {previewLines.length ? (
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {previewLines.map(([label, value]) => (
                <div key={label} className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{label}:</span> {String(value)}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">
              Anteprima OCR non ancora disponibile. Aggiorna il risultato se l&apos;elaborazione è ancora in corso.
            </div>
          )}
        </div>
      </div>

      {upload.validationIssues?.length ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-medium">Note di revisione OCR</div>
          <ul className="mt-2 list-disc pl-5">
            {upload.validationIssues.map((issue, index) => (
              <li key={`${upload.documentId}-issue-${index}`}>
                {issue.message || issue.code || JSON.stringify(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {upload.error ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{upload.error}</div>
      ) : null}
    </div>
  );
}
