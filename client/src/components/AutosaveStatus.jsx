export default function AutosaveStatus({
    readOnly = false,
    isDirty = false,
    isSaving = false,
    canSave = true,
    saveError = null,
    saveSuccessAt = null,
    idleLabel = "Nessuna modifica locale",
    incompleteLabel = "Compila i campi obbligatori per attivare il salvataggio automatico.",
}) {
    if (readOnly) {
        return null;
    }

    let statusText = idleLabel;
    if (isSaving) {
        statusText = "Salvataggio automatico in corso...";
    } else if (isDirty && canSave) {
        statusText = "Modifiche locali non ancora salvate";
    } else if (isDirty && !canSave) {
        statusText = incompleteLabel;
    }

    return (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div>{statusText}</div>
            {saveSuccessAt ? (
                <div className="mt-1 text-emerald-700">
                    Ultimo salvataggio riuscito: {new Date(saveSuccessAt).toLocaleString("it-IT")}
                </div>
            ) : null}
            {saveError ? <div className="mt-1 text-rose-600">{saveError}</div> : null}
        </div>
    );
}
