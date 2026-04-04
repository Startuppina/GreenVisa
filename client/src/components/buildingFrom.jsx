import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AutosaveStatus from "./AutosaveStatus";
import MessagePopUp from "./messagePopUp";
import useAutosave from "./useAutosave";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import {
    BUILDING_FORM_OPTIONS,
    REGION_OPTIONS,
    createBuildingPayload,
    isBuildingPayloadComplete,
} from "./buildingFormConfig";

function Field({ label, children, hint = null }) {
    return (
        <label className="space-y-2">
            <div className="text-sm font-medium text-slate-800">{label}</div>
            {children}
            {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
        </label>
    );
}

const inputClassName = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500";

function BuildingFrom({ buildingData = "empty", isEdit, onEditSuccess, readOnly = false }) {
    const buildingID = buildingData.id || 0;
    const [name, setName] = useState(buildingData.name || "");
    const [usage, setUsage] = useState(buildingData.usage || "");
    const [area, setArea] = useState(buildingData.area || "");
    const [location, setLocation] = useState(buildingData.region || buildingData.location || "");
    const [renovation, setRenovation] = useState(buildingData.renovation || "");
    const [heating, setHeating] = useState(buildingData.heat_distribution || "");
    const [energyControl, setEnergyControl] = useState(buildingData.energy_control || "");
    const [maintenance, setMaintenance] = useState(buildingData.maintenance || "");
    const [waterRecovery, setWaterRecovery] = useState(buildingData.water_recovery || "");
    const [electricityCounter, setElectricityCounter] = useState(buildingData.electricity_meter || "");
    const [electricityAnalyzer, setElectricityAnalyzer] = useState(buildingData.analyzers || "");
    const [electricForniture, setElectricForniture] = useState(buildingData.electricity_forniture || "");
    const [ateco, setAteco] = useState(buildingData.ateco || "");
    const [activityDescription, setActivityDescription] = useState(buildingData.activity_description || "");
    const [annualTurnover, setAnnualTurnover] = useState(buildingData.annual_turnover || 0);
    const [employees, setEmployees] = useState(buildingData.num_employees || 0);
    const [prodProcessDescription, setProdProcessDescription] = useState(buildingData.prodprocessdesc || "");
    const [country, setCountry] = useState(buildingData.country || "Italia");
    const [cap, setCap] = useState(buildingData.cap || "");
    const [municipality, setMunicipality] = useState(buildingData.municipality || "");
    const [street, setStreet] = useState(buildingData.street || "");
    const [streetNumber, setStreetNumber] = useState(buildingData.street_number || "");
    const [climateZone, setClimateZone] = useState(buildingData.climate_zone || "");
    const [constructionYearValue, setConstructionYearValue] = useState(buildingData.construction_year_value || "");
    const [contractPowerClass, setContractPowerClass] = useState(
        buildingData.contract_power_class || buildingData.electricity_meter || "",
    );
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const year = buildingData.construction_year || "";
    const ventilation = buildingData.ventilation || "";
    const lighting = parseInt(buildingData.incandescent, 10) || 0;
    const led = parseInt(buildingData.led, 10) || 0;
    const gasLamp = parseInt(buildingData.gas_lamp, 10) || 0;
    const autoLightingControlSystem = buildingData.autolightingcontrolsystem || "";

    const { setAddBuildingTrigger, triggerRefresh, setBuildingComplete } = useRecoveryContext();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await axios.get("/api/user-info", {
                    withCredentials: true,
                });

                if (response.status === 200 && !buildingData.annual_turnover) {
                    setAnnualTurnover(response.data.turnover);
                }
            } catch (error) {
                setMessagePopup(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        fetchInfo();
    }, [buildingData.annual_turnover]);

    useEffect(() => {
        if (!buildingData || buildingData === "empty" || !buildingData.id) {
            return;
        }

        setName(buildingData.name || "");
        setUsage(buildingData.usage || "");
        setArea(buildingData.area || "");
        setLocation(buildingData.region || buildingData.location || "");
        setRenovation(buildingData.renovation || "");
        setHeating(buildingData.heat_distribution || "");
        setEnergyControl(buildingData.energy_control || "");
        setMaintenance(buildingData.maintenance || "");
        setWaterRecovery(buildingData.water_recovery || "");
        setElectricityCounter(buildingData.electricity_meter || "");
        setElectricityAnalyzer(buildingData.analyzers || "");
        setElectricForniture(buildingData.electricity_forniture || "");
        setAteco(buildingData.ateco || "");
        setActivityDescription(buildingData.activity_description || "");
        setAnnualTurnover(buildingData.annual_turnover || 0);
        setEmployees(buildingData.num_employees || 0);
        setProdProcessDescription(buildingData.prodprocessdesc || "");
        setCountry(buildingData.country || "Italia");
        setCap(buildingData.cap || "");
        setMunicipality(buildingData.municipality || "");
        setStreet(buildingData.street || "");
        setStreetNumber(buildingData.street_number || "");
        setClimateZone(buildingData.climate_zone || "");
        setConstructionYearValue(buildingData.construction_year_value || "");
        setContractPowerClass(buildingData.contract_power_class || buildingData.electricity_meter || "");
    }, [buildingData.id]);

    const payload = useMemo(() => createBuildingPayload({
        buildingID,
        name,
        usage,
        location,
        year,
        area,
        renovation,
        heating,
        ventilation,
        energyControl,
        maintenance,
        waterRecovery,
        electricityCounter,
        electricityAnalyzer,
        autoLightingControlSystem,
        electricForniture,
        lighting,
        led,
        gasLamp,
        ateco,
        activityDescription,
        annualTurnover,
        employees,
        prodProcessDescription,
        country,
        cap,
        municipality,
        street,
        streetNumber,
        climateZone,
        constructionYearValue,
        contractPowerClass,
    }), [
        activityDescription,
        annualTurnover,
        area,
        ateco,
        autoLightingControlSystem,
        buildingID,
        cap,
        climateZone,
        constructionYearValue,
        contractPowerClass,
        country,
        electricForniture,
        electricityAnalyzer,
        electricityCounter,
        employees,
        energyControl,
        gasLamp,
        heating,
        led,
        lighting,
        location,
        maintenance,
        municipality,
        name,
        prodProcessDescription,
        renovation,
        street,
        streetNumber,
        usage,
        ventilation,
        waterRecovery,
        year,
    ]);

    const isPayloadComplete = useMemo(() => isBuildingPayloadComplete(payload), [payload]);
    const hasPersistedBuilding = Number(buildingID) > 0;
    const canAutosave = isEdit ? hasPersistedBuilding : isPayloadComplete;

    useEffect(() => {
        setBuildingComplete(isPayloadComplete);
    }, [isPayloadComplete, setBuildingComplete]);

    const saveBuilding = useCallback(async () => {
        if (isEdit && !hasPersistedBuilding) {
            return;
        }

        const response = isEdit
            ? await axios.put("/api/edit-building", payload, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            })
            : await axios.post("/api/upload-building", payload, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });

        if (response.status === 200) {
            triggerRefresh();

            if (isEdit) {
                if (typeof onEditSuccess === "function") {
                    onEditSuccess();
                }
                return;
            }

            setAddBuildingTrigger((previous) => !previous);
            const newBuildingId = response.data.buildingId;
            if (newBuildingId != null) {
                navigate(`/building/${newBuildingId}`, { replace: true });
            } else {
                navigate("/buildings");
            }
        }
    }, [hasPersistedBuilding, isEdit, navigate, onEditSuccess, payload, setAddBuildingTrigger, triggerRefresh]);

    const autosave = useAutosave({
        valueSignature: JSON.stringify(payload),
        enabled: !readOnly,
        canSave: canAutosave,
        onSave: saveBuilding,
    });

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        {isEdit ? "Dettagli dell'edificio" : "Nuovo edificio"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Il blocco raccoglie i dettagli anagrafici e gestionali. Ventilazione e illuminazione sono configurati nelle schede impianto.
                    </p>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${readOnly ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {readOnly ? "Scheda salvata" : "Scheda compilabile"}
                </div>
            </div>

            <form onSubmit={(event) => event.preventDefault()}>
                <fieldset disabled={readOnly} className="space-y-6">
                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Dettagli edificio</h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Nome">
                                <input type="text" value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Codice Ateco">
                                <input type="text" value={ateco} onChange={(event) => setAteco(event.target.value)} maxLength={8} className={inputClassName} />
                            </Field>
                            <Field label="Numero dipendenti">
                                <input type="number" min="0" value={employees} onChange={(event) => setEmployees(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Superficie (m²)">
                                <input type="number" min="0" value={area} onChange={(event) => setArea(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Anno di costruzione">
                                <input type="number" min="1000" max="9999" value={constructionYearValue} onChange={(event) => setConstructionYearValue(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Zona climatica">
                                <input type="text" maxLength={5} value={climateZone} onChange={(event) => setClimateZone(event.target.value.toUpperCase())} className={inputClassName} />
                            </Field>
                            <Field label="Destinazione d'uso">
                                <input type="text" value={usage} onChange={(event) => setUsage(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Diffusione calore">
                                <select value={heating} onChange={(event) => setHeating(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.heatDistribution.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Ristrutturazioni fatte">
                                <select value={renovation} onChange={(event) => setRenovation(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.renovation.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Indirizzo</h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Stato">
                                <input type="text" value={country} onChange={(event) => setCountry(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Regione">
                                <select value={location} onChange={(event) => setLocation(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {REGION_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="CAP">
                                <input type="text" maxLength={5} value={cap} onChange={(event) => setCap(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Comune">
                                <input type="text" value={municipality} onChange={(event) => setMunicipality(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Via / Piazza">
                                <input type="text" value={street} onChange={(event) => setStreet(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Numero civico">
                                <input type="text" value={streetNumber} onChange={(event) => setStreetNumber(event.target.value)} className={inputClassName} />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Gestione consumi e fornitura</h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Controllo dei consumi">
                                <select value={energyControl} onChange={(event) => setEnergyControl(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.energyControl.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Manutenzione periodica impianto">
                                <select value={maintenance} onChange={(event) => setMaintenance(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.maintenance.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Recupero acqua piovana">
                                <select value={waterRecovery} onChange={(event) => setWaterRecovery(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.waterRecovery.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Classe di potenza contrattuale">
                                <select
                                    value={contractPowerClass}
                                    onChange={(event) => {
                                        setContractPowerClass(event.target.value);
                                        setElectricityCounter(event.target.value);
                                    }}
                                    className={inputClassName}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricityMeter.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Fonte elettrica">
                                <select value={electricForniture} onChange={(event) => setElectricForniture(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricForniture.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Analizzatori di rete per il controllo dei consumi elettrici">
                                <select value={electricityAnalyzer} onChange={(event) => setElectricityAnalyzer(event.target.value)} className={inputClassName}>
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.analyzers.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Descrizioni</h3>
                        <div className="grid gap-4">
                            <Field label="Descrizione dell'attività svolta (massimo 300 caratteri)" hint={`${activityDescription.length}/300 caratteri`}>
                                <textarea
                                    value={activityDescription}
                                    onChange={(event) => {
                                        if (event.target.value.length <= 300) {
                                            setActivityDescription(event.target.value);
                                        }
                                    }}
                                    maxLength="300"
                                    className={`${inputClassName} min-h-24`}
                                />
                            </Field>
                            <Field label="Descrizione dei processi produttivi (massimo 300 caratteri)" hint={`${prodProcessDescription.length}/300 caratteri`}>
                                <textarea
                                    value={prodProcessDescription}
                                    onChange={(event) => {
                                        if (event.target.value.length <= 300) {
                                            setProdProcessDescription(event.target.value);
                                        }
                                    }}
                                    maxLength="300"
                                    className={`${inputClassName} min-h-24`}
                                />
                            </Field>
                        </div>
                    </section>

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                        Ventilazione meccanica, illuminazione e sistemi automatici dei corpi illuminanti sono gestiti nelle schede <strong>Impianti</strong>. I valori esistenti restano nel payload solo per preservare il calcolo.
                    </div>
                </fieldset>
            </form>

            <AutosaveStatus
                readOnly={readOnly}
                isDirty={autosave.isDirty}
                isSaving={autosave.isSaving}
                canSave={canAutosave}
                saveError={autosave.saveError}
                saveSuccessAt={autosave.saveSuccessAt}
                idleLabel="Le modifiche ai dettagli edificio vengono salvate automaticamente."
                incompleteLabel={isEdit
                    ? "Bozza salvata: completa i campi obbligatori per rendere l'edificio pronto al calcolo."
                    : "Completa i campi obbligatori del blocco per attivare il salvataggio automatico."}
            />
        </section>
    );
}

export default BuildingFrom;
