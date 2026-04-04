import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import AutosaveStatus from "./AutosaveStatus";
import useAutosave from "./useAutosave";
import { useRecoveryContext } from "../provider/provider";

const inputClassName = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500";

function SolarForm({ solar = "empty", isEdit, onButtonClick = null, onSubmitSuccess, readOnly = false, onDeletePlant = null }) {
    const [installedArea, setInstalledArea] = useState(solar.installed_area || "");
    const { buildingID, triggerRefresh } = useRecoveryContext();
    const canCancel = typeof onButtonClick === "function";

    const canAutosave = useMemo(() => {
        const areaValue = Number(installedArea);
        return Number.isFinite(areaValue) && areaValue > 0;
    }, [installedArea]);

    const saveSolar = useCallback(async () => {
        const formData = { installedArea: parseFloat(installedArea) };
        const response = isEdit
            ? await axios.put(`/api/buildings/${buildingID}/update/solar/${solar.id}`, formData, { withCredentials: true })
            : await axios.post(`/api/buildings/${buildingID}/upload/solar`, formData, { withCredentials: true });

        if (response.status === 200) {
            triggerRefresh();
            if (typeof onSubmitSuccess === "function") {
                onSubmitSuccess();
            }
        }
    }, [buildingID, installedArea, isEdit, onSubmitSuccess, solar.id, triggerRefresh]);

    const autosave = useAutosave({
        valueSignature: installedArea,
        enabled: !readOnly,
        canSave: canAutosave,
        onSave: saveSolar,
    });

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        {isEdit ? "Scheda impianto solare termico" : "Nuovo impianto solare termico"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Inserisci la superficie installata. Le modifiche vengono salvate automaticamente.
                    </p>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${readOnly ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {readOnly ? "Scheda salvata" : "Scheda compilabile"}
                </div>
            </div>

            <form onSubmit={(event) => event.preventDefault()}>
                <fieldset disabled={readOnly} className="space-y-5">
                    <label className="space-y-2">
                        <div className="text-sm font-medium text-slate-800">Quantità installata (m²)</div>
                        <input
                            type="number"
                            value={installedArea}
                            onChange={(event) => setInstalledArea(event.target.value)}
                            className={inputClassName}
                            min="0.01"
                            step="0.01"
                        />
                    </label>
                </fieldset>
            </form>

            <AutosaveStatus
                readOnly={readOnly}
                isDirty={autosave.isDirty}
                isSaving={autosave.isSaving}
                canSave={canAutosave}
                saveError={autosave.saveError}
                saveSuccessAt={autosave.saveSuccessAt}
                idleLabel="Le modifiche alla scheda vengono salvate automaticamente."
                incompleteLabel="Inserisci una superficie valida per attivare il salvataggio automatico."
            />

            {!readOnly && canCancel ? (
                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onButtonClick}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Annulla
                    </button>
                </div>
            ) : null}

            {isEdit && typeof onDeletePlant === "function" ? (
                <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onDeletePlant}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                        Elimina impianto
                    </button>
                </div>
            ) : null}
        </section>
    );
}

export default SolarForm;
