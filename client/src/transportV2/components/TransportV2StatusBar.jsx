import { formatEntryMode } from '../transportV2Model';

function getSaveStatusLabel({ isSaving, saveError, hasUnsavedChanges }) {
  if (isSaving) {
    return 'Salvataggio in corso...';
  }

  if (saveError) {
    return 'Salvataggio non riuscito';
  }

  if (hasUnsavedChanges) {
    return 'Modifiche non salvate';
  }

  return 'Tutte le modifiche sono salvate';
}

function getQuestionnaireStatusLabel(status) {
  return status === 'submitted' ? 'Inviato' : 'Draft';
}

export default function TransportV2StatusBar({
  meta,
  isSaving,
  saveError,
  hasUnsavedChanges,
  onRetrySave,
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Stato</p>
            <p className="font-semibold text-slate-900">
              {getQuestionnaireStatusLabel(meta?.status)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Entry mode</p>
            <p className="font-semibold text-slate-900">{formatEntryMode(meta?.entry_mode)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Ultimo aggiornamento</p>
            <p className="font-semibold text-slate-900">{meta?.updated_at || 'Non disponibile'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Iniziato il</p>
            <p className="font-semibold text-slate-900">{meta?.started_at || 'Non disponibile'}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <p className="text-sm font-semibold text-slate-900">
            {getSaveStatusLabel({ isSaving, saveError, hasUnsavedChanges })}
          </p>
          {saveError ? (
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="text-sm text-rose-700">{saveError}</p>
              <button
                type="button"
                onClick={onRetrySave}
                className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Riprova salvataggio
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
