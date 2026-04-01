export default function SubmitConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 transition-opacity duration-300 ease-out">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fadeIn animate-scaleUp">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-lg">
            &#9888;
          </span>
          <h2 className="text-xl font-semibold text-slate-900">Conferma invio questionario</h2>
        </div>

        <p className="mb-2 text-sm text-slate-700">
          Stai per inviare il questionario in modo <strong>definitivo</strong>.
        </p>
        <p className="mb-6 text-sm text-slate-600">
          Una volta inviato, non sarà più possibile modificare le risposte.
          Il punteggio e le emissioni di CO&#8322; verranno calcolati automaticamente.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            onClick={onConfirm}
          >
            Conferma invio
          </button>
        </div>
      </div>
    </div>
  );
}
