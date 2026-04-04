export default function BuildingSubmitConfirmDialog({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 transition-opacity duration-300 ease-out">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-lg">
                        &#9888;
                    </span>
                    <h2 className="text-xl font-semibold text-slate-900">Conferma calcolo emissioni</h2>
                </div>

                <p className="mb-2 text-sm text-slate-700">
                    Stai per calcolare e confermare in modo <strong>definitivo</strong> i risultati di questo edificio.
                </p>
                <p className="mb-6 text-sm text-slate-600">
                    Dopo la conferma non sarà più possibile modificare i dati dell&apos;edificio, impianti, consumi, gas,
                    solari e fotovoltaici.
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
