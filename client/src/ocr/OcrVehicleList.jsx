import React, { useState, useMemo } from 'react';
import { LOW_CONFIDENCE_THRESHOLD } from './ocrConstants';

const FILTERS = [
  { value: 'all', label: 'Tutti' },
  { value: 'needs_review', label: 'Da verificare' },
  { value: 'confirmed', label: 'Confermati' },
  { value: 'applied', label: 'Applicati' },
];

function countLowConfidence(entity) {
  return entity.fields.filter((f) => f.confidence < LOW_CONFIDENCE_THRESHOLD).length;
}

export default function OcrVehicleList({
  entities,
  selectedEntityId,
  onSelectEntity,
  confirmedEntities,
  appliedEntities,
}) {
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    let totalWarnings = 0;
    let confirmed = 0;
    let applied = 0;
    entities.forEach((e) => {
      totalWarnings += countLowConfidence(e);
      if (appliedEntities?.has(e.entityId)) applied++;
      else if (confirmedEntities.has(e.entityId)) confirmed++;
    });
    return { totalWarnings, confirmed, applied };
  }, [entities, confirmedEntities, appliedEntities]);

  const visible = useMemo(() => {
    if (filter === 'applied') return entities.filter((e) => appliedEntities?.has(e.entityId));
    if (filter === 'confirmed') return entities.filter((e) => confirmedEntities.has(e.entityId) && !appliedEntities?.has(e.entityId));
    if (filter === 'needs_review') return entities.filter((e) => !confirmedEntities.has(e.entityId) && !appliedEntities?.has(e.entityId));
    return entities;
  }, [entities, confirmedEntities, appliedEntities, filter]);

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Veicoli estratti
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({entities.length} {entities.length === 1 ? 'veicolo' : 'veicoli'}, {stats.confirmed}{' '}
            {stats.confirmed === 1 ? 'confermato' : 'confermati'}, {stats.applied}{' '}
            {stats.applied === 1 ? 'applicato' : 'applicati'})
          </span>
        </h2>
        {stats.totalWarnings > 0 && (
          <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">
            ⚠ {stats.totalWarnings} {stats.totalWarnings === 1 ? 'campo' : 'campi'} da verificare
          </span>
        )}
      </div>

      {/* ── Filter chips ───────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#2d7044] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Empty filtered state ───────────────────────────── */}
      {visible.length === 0 && (
        <p className="text-gray-500 text-center py-6">
          Nessun veicolo corrisponde al filtro selezionato.
        </p>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      {visible.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Veicolo
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  File sorgente
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Avvisi
                </th>
                <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Stato
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((entity) => {
                const warnings = countLowConfidence(entity);
                const isApplied = appliedEntities?.has(entity.entityId);
                const isConfirmed = confirmedEntities.has(entity.entityId);
                const isSelected = selectedEntityId === entity.entityId;

                let statusBadge;
                if (isApplied) {
                  statusBadge = (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      Applicato
                    </span>
                  );
                } else if (isConfirmed) {
                  statusBadge = (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Confermato
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Da verificare
                    </span>
                  );
                }

                return (
                  <tr
                    key={entity.entityId}
                    onClick={() => onSelectEntity(entity.entityId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {entity.displayName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">
                      {entity.fileName}
                    </td>
                    <td className="px-4 py-3">
                      {warnings > 0 ? (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {warnings} ⚠
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm font-medium">✓ OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#2d7044] font-medium">
                        {isSelected ? 'Selezionato ›' : 'Rivedi ›'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
