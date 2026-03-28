import React from 'react';
import { LOW_CONFIDENCE_THRESHOLD } from './ocrConstants';

function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
  const isLow = value < LOW_CONFIDENCE_THRESHOLD;

  let colors;
  if (isLow) colors = 'bg-red-100 text-red-700';
  else if (value >= 0.9) colors = 'bg-green-100 text-green-700';
  else colors = 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colors}`}>
      {pct}%{isLow && ' ⚠'}
    </span>
  );
}

export default function OcrReviewPanel({
  entity,
  editedFields,
  onFieldEdit,
  isConfirmed,
  onConfirm,
}) {
  const lowCount = entity.fields.filter((f) => f.confidence < LOW_CONFIDENCE_THRESHOLD).length;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{entity.displayName}</h2>
          <p className="text-sm text-gray-500">
            File: <span className="font-medium">{entity.fileName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {lowCount} {lowCount === 1 ? 'campo' : 'campi'} da verificare
            </span>
          )}
          {isConfirmed && (
            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
              ✓ Confermato
            </span>
          )}
        </div>
      </div>

      {/* ── Fields ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {entity.fields.map((field) => {
          const isLow = field.confidence < LOW_CONFIDENCE_THRESHOLD;
          const currentValue = editedFields[field.key] ?? field.value;
          const wasEdited =
            editedFields[field.key] !== undefined && editedFields[field.key] !== field.value;

          return (
            <div
              key={field.key}
              className={`p-3 rounded-lg border transition-colors ${
                isLow ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Label row */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge value={field.confidence} />
                  {wasEdited && (
                    <span className="text-xs text-blue-600 font-medium">Modificato</span>
                  )}
                </div>
              </div>

              {/* Input */}
              <input
                type="text"
                value={currentValue}
                onChange={(e) => onFieldEdit(field.key, e.target.value)}
                disabled={isConfirmed}
                className={`w-full p-2 rounded border text-sm outline-none transition-colors
                  focus:ring-1
                  ${
                    isLow
                      ? 'border-red-300 bg-white focus:ring-red-400 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:ring-[#2d7044] focus:border-[#2d7044]'
                  }
                  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
              />

              {isLow && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">
                  ⚠ Confidenza bassa — verifica attentamente questo campo
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Confirm button ─────────────────────────────────── */}
      {!isConfirmed && (
        <button
          onClick={onConfirm}
          className="mt-6 w-full p-3 bg-[#2d7044] text-white rounded-lg font-semibold text-lg
            border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300
            ease-in-out hover:bg-white hover:text-[#2d7044]"
        >
          Conferma dati veicolo
        </button>
      )}
    </section>
  );
}
