import React, { useState, useRef, useCallback } from 'react';
import { FILE_STATUS, STATUS_LABELS, STATUS_COLORS } from './ocrConstants';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OcrUploadPanel({
  fileEntries,
  onAddFiles,
  onRemoveFile,
  onCancelUpload,
  onSubmit,
  onRetry,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) onAddFiles(e.dataTransfer.files);
    },
    [onAddFiles],
  );

  const handlePick = useCallback(
    (e) => {
      if (e.target.files.length) {
        onAddFiles(e.target.files);
        e.target.value = '';
      }
    },
    [onAddFiles],
  );

  const readyCount = fileEntries.filter((e) => e.status === FILE_STATUS.READY).length;
  const busyCount = fileEntries.filter((e) =>
    [FILE_STATUS.UPLOADING, FILE_STATUS.PROCESSING].includes(e.status),
  ).length;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Caricamento documenti</h2>

      {/* ── Drop zone ──────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200
          ${isDragOver ? 'border-[#2d7044] bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
      >
        <p className="text-4xl mb-2 select-none">📄</p>
        <p className="text-lg font-medium text-gray-700">
          Trascina i file qui oppure clicca per selezionarli
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Formati: <strong>PDF, JPG, PNG</strong> — Max <strong>10 MB</strong> per file
        </p>
        <p className="text-xs text-gray-400 mt-1">
          (I controlli sono lato frontend; il backend effettuerà validazioni aggiuntive)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handlePick}
          className="hidden"
        />
      </div>

      {/* ── File queue ─────────────────────────────────────── */}
      {fileEntries.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Coda file ({fileEntries.length})
          </h3>

          <ul className="space-y-2">
            {fileEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Left: name + meta + status */}
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 truncate max-w-[260px]">
                      {entry.file.name}
                    </span>
                    <span className="text-xs text-gray-400">{formatSize(entry.file.size)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[entry.status]}`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {entry.status === FILE_STATUS.PROCESSING && (
                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                    )}
                  </div>
                  {entry.error && <p className="text-sm text-red-600 mt-1">{entry.error}</p>}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {entry.status === FILE_STATUS.UPLOADING && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelUpload(entry.id);
                      }}
                      className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                    >
                      Annulla
                    </button>
                  )}

                  {[FILE_STATUS.FAILED, FILE_STATUS.CANCELLED].includes(entry.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(entry.id);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Riprova
                    </button>
                  )}

                  {![FILE_STATUS.UPLOADING, FILE_STATUS.PROCESSING].includes(entry.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(entry.id);
                      }}
                      className="text-sm text-red-500 hover:text-red-700 font-bold leading-none"
                      title="Rimuovi"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Submit button ──────────────────────────────────── */}
      {readyCount > 0 && (
        <button
          onClick={onSubmit}
          className="mt-5 w-full p-3 bg-[#2d7044] text-white rounded-lg font-semibold text-lg
            border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300
            ease-in-out hover:bg-white hover:text-[#2d7044]"
        >
          Carica {readyCount} {readyCount === 1 ? 'file' : 'file'}
        </button>
      )}

      {busyCount > 0 && (
        <p className="text-sm text-gray-500 mt-3 text-center animate-pulse">
          Elaborazione di {busyCount} {busyCount === 1 ? 'file' : 'file'} in corso…
        </p>
      )}
    </section>
  );
}
