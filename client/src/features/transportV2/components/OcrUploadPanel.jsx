import OcrUploadItem from "./OcrUploadItem.jsx";

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
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
      <header className="mb-8 max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Assistenza OCR
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Carica la carta di circolazione o altri documenti: il sistema estrae i dati e puoi creare una riga
          veicolo da completare a mano. Verifica sempre i valori prima dell’invio.
        </p>
      </header>

      <label className="flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-5 py-6 text-sm text-slate-700 transition hover:border-emerald-400/60 hover:bg-emerald-50/30">
        <span className="font-medium text-slate-900">
          Trascina qui i file o clicca per selezionarli
        </span>
        <input
          type="file"
          multiple
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
          onChange={onFileSelection}
          disabled={isUploading}
        />
        <span className="text-xs text-slate-500">
          I file vengono inviati all’endpoint di caricamento documenti (categoria trasporti).
        </span>
      </label>

      {isUploading ? (
        <p className="mt-4 text-sm text-slate-600">Caricamento e lettura OCR in corso…</p>
      ) : null}
      {uploadError ? (
        <p className="mt-4 text-sm text-rose-600">{uploadError}</p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-1">
        {uploads.length ? (
          uploads.map((upload) => (
            <OcrUploadItem
              key={upload.documentId || upload.localId}
              upload={upload}
              onTransportModeChange={(value) =>
                onTransportModeChange(upload.documentId, value)
              }
              onApply={() => onApplyUpload(upload.documentId)}
              onRefresh={() => onRefreshUpload(upload.documentId)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-600">
            Nessun documento caricato. Aggiungi almeno un file per vedere l’anteprima OCR.
          </div>
        )}
      </div>
    </section>
  );
}
