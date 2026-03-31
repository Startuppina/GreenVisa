import { buildOcrUploadPreviewLines } from '../utils/ocrResultPreview.js';
import { TRANSPORT_MODE_OPTIONS } from '../utils/validation.js';

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
          <div className="font-medium text-slate-900">{upload.fileName || `Document ${upload.documentId}`}</div>
          <div className="mt-1 text-sm text-slate-500">
            Document #{upload.documentId} • status: {upload.status}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onRefresh}
            disabled={upload.isFetchingResult}
          >
            {upload.isFetchingResult ? 'Refreshing...' : 'Refresh OCR'}
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={onApply}
            disabled={upload.isApplying || !upload.documentId}
          >
            {upload.isApplying ? 'Applying...' : 'Create vehicle'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px,1fr]">
        <label className="space-y-2">
          <div className="text-sm font-medium text-slate-800">Suggested transport mode</div>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={upload.selectedTransportMode}
            onChange={(event) => onTransportModeChange(event.target.value)}
          >
            <option value="">Leave unset</option>
            {TRANSPORT_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">OCR preview</div>
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
              OCR preview not available yet. Refresh the OCR result if processing is still running.
            </div>
          )}
        </div>
      </div>

      {upload.validationIssues?.length ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-medium">OCR review notes</div>
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

      {upload.appliedVehicleId ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          OCR row applied as vehicle `{upload.appliedVehicleId}`. Complete the remaining fields in the
          editor panel.
        </div>
      ) : null}
    </div>
  );
}
