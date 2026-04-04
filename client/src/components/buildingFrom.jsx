import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AutosaveStatus from "./AutosaveStatus";
import MessagePopUp from "./messagePopUp";
import useAutosave from "./useAutosave";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import {
    BUILDING_FIELD_SCROLL_ORDER,
    BUILDING_FORM_OPTIONS,
    REGION_OPTIONS,
    createBuildingPayload,
    getBuildingPayloadFieldErrors,
    isBuildingPayloadComplete,
} from "./buildingFormConfig";

function Field({ label, children, hint = null, error = null, fieldId = null }) {
    return (
        <label
            className="block space-y-2"
            id={fieldId ? `building-field-${fieldId}` : undefined}
        >
            <div className="text-sm font-medium text-slate-800">{label}</div>
            {children}
            {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
            {error ? <div className="text-sm text-rose-600">{error}</div> : null}
        </label>
    );
}

const baseInputClass =
    "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500";

const inputClassName = `${baseInputClass} border-slate-300`;

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
    const [validationErrors, setValidationErrors] = useState({});

    const year = buildingData.construction_year || "";
    const ventilation = buildingData.ventilation || "";
    const lighting = parseInt(buildingData.incandescent, 10) || 0;
    const led = parseInt(buildingData.led, 10) || 0;
    const gasLamp = parseInt(buildingData.gas_lamp, 10) || 0;
    const autoLightingControlSystem = buildingData.autolightingcontrolsystem || "";

    const { setAddBuildingTrigger, setBuildingComplete, buildingFormValidateNonce } = useRecoveryContext();
    const navigate = useNavigate();

    const clearValidationKey = useCallback((key) => {
        setValidationErrors((prev) => {
            if (!prev[key]) {
                return prev;
            }
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const controlClass = useCallback(
        (fieldKey) =>
            `${baseInputClass} ${validationErrors[fieldKey] ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"}`,
        [validationErrors],
    );

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

    useEffect(() => {
        if (buildingFormValidateNonce === 0) {
            return;
        }
        const errors = getBuildingPayloadFieldErrors(payload);
        setValidationErrors(errors);
        const firstKey = BUILDING_FIELD_SCROLL_ORDER.find((key) => errors[key]);
        if (firstKey) {
            requestAnimationFrame(() => {
                document.getElementById(`building-field-${firstKey}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });
        }
        // Solo quando l'utente preme "Calcola"; il payload è quello del render corrente al tick del nonce.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: non ricalcolare ad ogni keystroke
    }, [buildingFormValidateNonce]);

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
            if (isEdit) {
                if (typeof onEditSuccess === "function") {
                    onEditSuccess(payload);
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
    }, [hasPersistedBuilding, isEdit, navigate, onEditSuccess, payload, setAddBuildingTrigger]);

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
                            <Field label="Nome" fieldId="name" error={validationErrors.name}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => {
                                        clearValidationKey("name");
                                        setName(event.target.value);
                                    }}
                                    className={controlClass("name")}
                                />
                            </Field>
                            <Field label="Codice Ateco">
                                <input type="text" value={ateco} onChange={(event) => setAteco(event.target.value)} maxLength={8} className={inputClassName} />
                            </Field>
                            <Field label="Numero dipendenti">
                                <input type="number" min="0" value={employees} onChange={(event) => setEmployees(event.target.value)} className={inputClassName} />
                            </Field>
                            <Field label="Superficie (m²)" fieldId="area" error={validationErrors.area}>
                                <input
                                    type="number"
                                    min="0"
                                    value={area}
                                    onChange={(event) => {
                                        clearValidationKey("area");
                                        setArea(event.target.value);
                                    }}
                                    className={controlClass("area")}
                                />
                            </Field>
                            <Field label="Anno di costruzione" fieldId="constructionYearValue" error={validationErrors.constructionYearValue}>
                                <input
                                    type="number"
                                    min="1000"
                                    max="9999"
                                    value={constructionYearValue}
                                    onChange={(event) => {
                                        clearValidationKey("constructionYearValue");
                                        setConstructionYearValue(event.target.value);
                                    }}
                                    className={controlClass("constructionYearValue")}
                                />
                            </Field>
                            <Field label="Zona climatica">
                                <input type="text" maxLength={5} value={climateZone} onChange={(event) => setClimateZone(event.target.value.toUpperCase())} className={inputClassName} />
                            </Field>
                            <Field label="Destinazione d'uso" fieldId="usage" error={validationErrors.usage}>
                                <input
                                    type="text"
                                    value={usage}
                                    onChange={(event) => {
                                        clearValidationKey("usage");
                                        setUsage(event.target.value);
                                    }}
                                    className={controlClass("usage")}
                                />
                            </Field>
                            <Field label="Diffusione calore" fieldId="heating" error={validationErrors.heating}>
                                <select
                                    value={heating}
                                    onChange={(event) => {
                                        clearValidationKey("heating");
                                        setHeating(event.target.value);
                                    }}
                                    className={controlClass("heating")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.heatDistribution.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Ristrutturazioni fatte" fieldId="renovation" error={validationErrors.renovation}>
                                <select
                                    value={renovation}
                                    onChange={(event) => {
                                        clearValidationKey("renovation");
                                        setRenovation(event.target.value);
                                    }}
                                    className={controlClass("renovation")}
                                >
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
                            <Field label="Regione" fieldId="location" error={validationErrors.location}>
                                <select
                                    value={location}
                                    onChange={(event) => {
                                        clearValidationKey("location");
                                        setLocation(event.target.value);
                                    }}
                                    className={controlClass("location")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {REGION_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="CAP" fieldId="cap" error={validationErrors.cap}>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={cap}
                                    onChange={(event) => {
                                        clearValidationKey("cap");
                                        setCap(event.target.value);
                                    }}
                                    className={controlClass("cap")}
                                />
                            </Field>
                            <Field label="Comune" fieldId="municipality" error={validationErrors.municipality}>
                                <input
                                    type="text"
                                    value={municipality}
                                    onChange={(event) => {
                                        clearValidationKey("municipality");
                                        setMunicipality(event.target.value);
                                    }}
                                    className={controlClass("municipality")}
                                />
                            </Field>
                            <Field label="Via / Piazza" fieldId="street" error={validationErrors.street}>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(event) => {
                                        clearValidationKey("street");
                                        setStreet(event.target.value);
                                    }}
                                    className={controlClass("street")}
                                />
                            </Field>
                            <Field label="Numero civico">
                                <input type="text" value={streetNumber} onChange={(event) => setStreetNumber(event.target.value)} className={inputClassName} />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Gestione consumi e fornitura</h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Controllo dei consumi" fieldId="energyControl" error={validationErrors.energyControl}>
                                <select
                                    value={energyControl}
                                    onChange={(event) => {
                                        clearValidationKey("energyControl");
                                        setEnergyControl(event.target.value);
                                    }}
                                    className={controlClass("energyControl")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.energyControl.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Manutenzione periodica impianto" fieldId="maintenance" error={validationErrors.maintenance}>
                                <select
                                    value={maintenance}
                                    onChange={(event) => {
                                        clearValidationKey("maintenance");
                                        setMaintenance(event.target.value);
                                    }}
                                    className={controlClass("maintenance")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.maintenance.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Recupero acqua piovana" fieldId="waterRecovery" error={validationErrors.waterRecovery}>
                                <select
                                    value={waterRecovery}
                                    onChange={(event) => {
                                        clearValidationKey("waterRecovery");
                                        setWaterRecovery(event.target.value);
                                    }}
                                    className={controlClass("waterRecovery")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.waterRecovery.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Classe di potenza contrattuale" fieldId="contractPowerClass" error={validationErrors.contractPowerClass}>
                                <select
                                    value={contractPowerClass}
                                    onChange={(event) => {
                                        clearValidationKey("contractPowerClass");
                                        setContractPowerClass(event.target.value);
                                        setElectricityCounter(event.target.value);
                                    }}
                                    className={controlClass("contractPowerClass")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricityMeter.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Fonte elettrica" fieldId="electricForniture" error={validationErrors.electricForniture}>
                                <select
                                    value={electricForniture}
                                    onChange={(event) => {
                                        clearValidationKey("electricForniture");
                                        setElectricForniture(event.target.value);
                                    }}
                                    className={controlClass("electricForniture")}
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricForniture.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Analizzatori di rete per il controllo dei consumi elettrici" fieldId="electricityAnalyzer" error={validationErrors.electricityAnalyzer}>
                                <select
                                    value={electricityAnalyzer}
                                    onChange={(event) => {
                                        clearValidationKey("electricityAnalyzer");
                                        setElectricityAnalyzer(event.target.value);
                                    }}
                                    className={controlClass("electricityAnalyzer")}
                                >
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
