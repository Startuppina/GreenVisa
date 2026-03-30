export default function TransportV2EntryModeSelector({ isSaving, onSelectMode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">Transport V2</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Seleziona la modalita di ingresso del questionario. La scelta viene salvata nel
          draft condiviso backend e rimane il riferimento autorevole per questa certificazione.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectMode('form')}
          disabled={isSaving}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-lg font-semibold text-emerald-900">Form</p>
          <p className="mt-2 text-sm text-emerald-800">
            Apre subito la superficie canonica di review e modifica del draft condiviso.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('chatbot')}
          disabled={isSaving}
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-lg font-semibold text-slate-900">Chatbot</p>
          <p className="mt-2 text-sm text-slate-700">
            La scelta viene registrata subito. In questo blocco il chatbot non e ancora
            disponibile, quindi dopo la selezione mostriamo comunque il form shell condiviso.
          </p>
        </button>
      </div>
    </section>
  );
}
