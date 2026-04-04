import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import AutosaveStatus from "./AutosaveStatus";
import useAutosave from "./useAutosave";
import { useRecoveryContext } from "../provider/provider";

export const GAS_NAMES = [
    "Idrogeno verde - zero emissioni",
    "R1233ZD",
    "R1234YF",
    "R1234ZE",
    "R125A",
    "R134A",
    "R23",
    "R236FA",
    "R245FA",
    "R290",
    "R32",
    "R404A",
    "R407A",
    "R407C",
    "R407F",
    "R407H",
    "R408A",
    "R409A",
    "R410A",
    "R413A",
    "R417A",
    "R422A",
    "R422B",
    "R422D",
    "R427A",
    "R434A",
    "R437A",
    "R438A",
    "R448A",
    "R449A",
    "R450A",
    "R452A",
    "R452B",
    "R454A",
    "R454B",
    "R454C",
    "R455A",
    "R456A",
    "R507",
    "R508B",
    "R513A",
    "R515B",
    "R600a",
    "R744",
];

const inputClassName = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500";

function Field({ label, children, hint = null }) {
    return (
        <label className="space-y-2">
            <div className="text-sm font-medium text-slate-800">{label}</div>
            {children}
            {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
        </label>
    );
}

function ClimateGasAlteringForm({
    gas = "empty",
    isEdit,
    onButtonClick,
    onSubmitSuccess,
    readOnly = false,
    title = null,
    initialGasType = "",
    onDeleteGas = null,
}) {
    const resolvedInitialType =
        typeof gas === "object" && gas?.gas_type ? gas.gas_type : initialGasType || "";
    const [type, setType] = useState(resolvedInitialType);
    const [quantityKg, setQuantityKg] = useState(gas.quantity_kg || "");

    const { buildingID, triggerRefresh } = useRecoveryContext();
    const canCancel = typeof onButtonClick === "function";

    const canAutosave = useMemo(() => {
        const quantityValue = Number(quantityKg);
        return Boolean(type && quantityKg !== "" && Number.isFinite(quantityValue) && quantityValue > 0);
    }, [quantityKg, type]);

    const saveGas = useCallback(async () => {
        const formData = {
            type,
            quantityKg,
        };
        const response = isEdit
            ? await axios.put(`/api/buildings/${buildingID}/update/gas/${gas.id}`, formData, {
                withCredentials: true,
            })
            : await axios.post(`/api/buildings/${buildingID}/upload/gas`, formData, {
                withCredentials: true,
            });

        if (response.status === 200) {
            triggerRefresh();
            if (typeof onSubmitSuccess === "function") {
                onSubmitSuccess();
            }
        }
    }, [buildingID, gas.id, isEdit, onSubmitSuccess, quantityKg, triggerRefresh, type]);

    const autosave = useAutosave({
        valueSignature: JSON.stringify({ type, quantityKg }),
        enabled: !readOnly,
        canSave: canAutosave,
        onSave: saveGas,
    });

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        {title || (isEdit ? "Scheda gas clima alterante" : "Nuovo gas clima alterante")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Compila la tipologia e la quantit{`à`} in kg. Le modifiche vengono salvate automaticamente.
                    </p>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${readOnly ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {readOnly ? "Scheda salvata" : "Scheda compilabile"}
                </div>
            </div>

            <form onSubmit={(event) => event.preventDefault()}>
                <fieldset disabled={readOnly} className="space-y-5">
                    <Field label="Tipologia">
                        <select
                            value={type}
                            onChange={(event) => setType(event.target.value)}
                            className={inputClassName}
                        >
                            <option value="" disabled>Seleziona tipologia</option>
                            {GAS_NAMES.map((gasName) => (
                                <option key={gasName} value={gasName}>
                                    {gasName}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Quantità (kg)">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={quantityKg}
                            onChange={(event) => setQuantityKg(event.target.value)}
                            className={inputClassName}
                        />
                    </Field>

                    {gas.plant_id ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            Impianto associato: <strong>{gas.plant_name || "-"}</strong>
                        </div>
                    ) : null}
                </fieldset>
            </form>

            <AutosaveStatus
                readOnly={readOnly}
                isDirty={autosave.isDirty}
                isSaving={autosave.isSaving}
                canSave={canAutosave}
                saveError={autosave.saveError}
                saveSuccessAt={autosave.saveSuccessAt}
                idleLabel="Le modifiche alla scheda gas vengono salvate automaticamente."
                incompleteLabel="Seleziona un gas e inserisci una quantità valida per attivare il salvataggio automatico."
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

            {isEdit && typeof onDeleteGas === "function" ? (
                <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onDeleteGas}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                        Elimina scheda gas
                    </button>
                </div>
            ) : null}
        </section>
    );
}

export default ClimateGasAlteringForm;
