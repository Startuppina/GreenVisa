import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";
import ClimateGasAlteringForm, { GAS_NAMES } from "./climateGasAlteringForm";
import { useRecoveryContext } from "../provider/provider";

function ClimateAlteringGases({
    title = "Gas clima alteranti utilizzati per la produzione",
    description = "Ogni scheda usa l'autosave come il questionario trasporti e resta modificabile finché l'edificio non viene finalizzato.",
    emptyMessage = "Nessuna scheda gas presente. Usa il selettore in alto per aggiungerne una.",
    scope = "all",
    readOnly = false,
}) {
    const [gases, setGases] = useState([]);
    const [draftType, setDraftType] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState("");
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { buildingID, refresh, buildingLocked, triggerRefresh } = useRecoveryContext();

    useEffect(() => {
        const fetchGases = async () => {
            const id = buildingID;
            if (!id) {
                setGases([]);
                return;
            }

            try {
                const response = await axios.get(`/api/buildings/${id}/fetch-gases`, {
                    withCredentials: true,
                });
                if (response.status === 200) {
                    setGases(response.data.gases || []);
                }
            } catch (error) {
                setMessagePopup("Errore durante il recupero dei gas clima alteranti");
                setButtonPopup(true);
            }
        };

        fetchGases();
    }, [buildingID, refresh]);

    const visibleGases = useMemo(() => {
        if (scope === "building") {
            return gases.filter((gas) => !gas.plant_id);
        }
        if (scope === "plant") {
            return gases.filter((gas) => Boolean(gas.plant_id));
        }
        return gases;
    }, [gases, scope]);

    const effectiveReadOnly = readOnly || buildingLocked;

    const resetDraft = () => {
        setDraftType("");
        setSelectedType("");
    };

    const askDelete = (gas) => {
        const label = gas.gas_type || "questa scheda gas";
        setItemToDelete(gas);
        setDeleteMessage(`Sei sicuro di voler eliminare la scheda per ${label}?`);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete || effectiveReadOnly) {
            return;
        }

        try {
            await axios.delete(`/api/delete-gas/${itemToDelete.id}`, { withCredentials: true });
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            triggerRefresh();
        } catch (error) {
            setMessagePopup("Errore durante l'eliminazione della scheda gas");
            setButtonPopup(true);
        }
    };

    if (!buildingID) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
                Completa i dettagli dell'edificio e attendi il primo salvataggio automatico per aggiungere le schede gas.
            </div>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ConfirmPopUp
                trigger={showDeleteConfirm}
                setTrigger={setShowDeleteConfirm}
                onButtonClick={handleDelete}
            >
                {deleteMessage}
            </ConfirmPopUp>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>

            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm text-slate-600">{description}</p>
                    ) : null}
                </div>

                {!effectiveReadOnly ? (
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-medium text-slate-800">Aggiungi una nuova scheda</div>
                        <div className="mt-3 flex gap-2">
                            <select
                                value={draftType}
                                onChange={(event) => setDraftType(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                            >
                                <option value="">Seleziona tipologia gas</option>
                                {GAS_NAMES.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!draftType) {
                                        setMessagePopup("Seleziona prima la tipologia di gas da aggiungere");
                                        setButtonPopup(true);
                                        return;
                                    }
                                    setSelectedType(draftType);
                                }}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Schede in sola lettura
                    </div>
                )}
            </div>

            {selectedType && !effectiveReadOnly ? (
                <div className="mb-6">
                    <ClimateGasAlteringForm
                        key={selectedType}
                        gas="empty"
                        isEdit={false}
                        initialGasType={selectedType}
                        onButtonClick={resetDraft}
                        onSubmitSuccess={resetDraft}
                        readOnly={false}
                    />
                </div>
            ) : null}

            {visibleGases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
                    {emptyMessage}
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleGases.map((gas) => (
                        <ClimateGasAlteringForm
                            key={gas.id}
                            gas={gas}
                            isEdit
                            readOnly={effectiveReadOnly}
                            title={
                                gas.plant_id
                                    ? `Gas clima alterante - ${gas.plant_name || "impianto"}`
                                    : "Gas clima alterante"
                            }
                            {...(!effectiveReadOnly ? { onDeleteGas: () => askDelete(gas) } : {})}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default ClimateAlteringGases;
