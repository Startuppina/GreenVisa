export default function TransportV2BottomActions({
  isSaving,
  isSubmitting,
  hasUnsavedChanges,
  saveError,
  submitError,
  isSubmitted,
  onSave,
  onSubmit,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          <p>{buildStatusText({ isSaving, isSubmitting, hasUnsavedChanges, saveError, isSubmitted })}</p>
          {submitError ? <p className="mt-1 text-rose-700">{submitError}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving || isSubmitting || isSubmitted}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
          >
            Salva
          </button>
          <button
            type="button"
            disabled={isSaving || isSubmitting || isSubmitted}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            onClick={onSubmit}
          >
            {isSubmitting ? 'Invio...' : 'Invia'}
          </button>
        </div>
      </div>
    </section>
  );
}

function buildStatusText({ isSaving, isSubmitting, hasUnsavedChanges, saveError, isSubmitted }) {
  if (isSubmitted) {
    return 'Questionario inviato. La pagina e in sola lettura.';
  }

  if (isSubmitting) {
    return 'Invio in corso al backend...';
  }

  if (isSaving) {
    return 'Salvataggio automatico in corso...';
  }

  if (saveError) {
    return `Errore salvataggio: ${saveError}`;
  }

  if (hasUnsavedChanges) {
    return 'Modifiche locali non ancora salvate.';
  }

  return 'Bozza sincronizzata con il backend.';
}
