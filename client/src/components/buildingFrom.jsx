import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import {
    BUILDING_FORM_OPTIONS,
    REGION_OPTIONS,
    createBuildingPayload,
} from "./buildingFormConfig";

function BuildingFrom({ buildingData = "empty", isEdit, onEditSuccess }) {
    const [buildingID] = useState(buildingData.id || 0);
    const [name, setName] = useState(buildingData.name || "");
    const [address, setAddress] = useState(buildingData.address || "");
    const [usage, setUsage] = useState(buildingData.usage || "");
    const [year] = useState(buildingData.construction_year || "");
    const [area, setArea] = useState(buildingData.area || "");
    const [location, setLocation] = useState(buildingData.region || buildingData.location || "");
    const [renovation, setRenovation] = useState(buildingData.renovation || "");
    const [heating, setHeating] = useState(buildingData.heat_distribution || "");
    const [ventilation] = useState(buildingData.ventilation || "");
    const [energyControl, setEnergyControl] = useState(buildingData.energy_control || "");
    const [maintenance, setMaintenance] = useState(buildingData.maintenance || "");
    const [waterRecovery, setWaterRecovery] = useState(buildingData.water_recovery || "");
    const [electricityCounter, setElectricityCounter] = useState(buildingData.electricity_meter || "");
    const [electricityAnalyzer, setElectricityAnalyzer] = useState(buildingData.analyzers || "");
    const [lighting] = useState(parseInt(buildingData.incandescent, 10) || 0);
    const [led] = useState(parseInt(buildingData.led, 10) || 0);
    const [gasLamp] = useState(parseInt(buildingData.gas_lamp, 10) || 0);
    const [electricForniture, setElectricForniture] = useState(buildingData.electricity_forniture || "");
    const [autoLightingControlSystem] = useState(buildingData.autolightingcontrolsystem || "");
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
    const [isLoading, setIsLoading] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { addBuildingTrigger, setAddBuildingTrigger, triggerRefresh } = useRecoveryContext();
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

    const payload = useMemo(() => createBuildingPayload({
        buildingID,
        name,
        address,
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
        address,
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
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
                    } else {
                        setMessagePopup("Edificio aggiornato con successo");
                        setButtonPopup(true);
                    }
                } else {
                    setAddBuildingTrigger(!addBuildingTrigger);
                    const newBuildingId = response.data.buildingId;
                    if (newBuildingId != null) {
                        navigate(`/building/${newBuildingId}`, { replace: true });
                    } else {
                        navigate("/buildings");
                    }
                }
            }
        } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="mx-auto w-[98.5%] rounded-2xl border border-gray-300 bg-white px-6 py-6 font-arial text-xl shadow-xl md:m-4 md:px-10">
                <h2 className="mb-3 text-center text-2xl font-bold">{isEdit ? "Modifica Edificio" : "Aggiungi un nuovo Edificio"}</h2>
                <p className="mb-6 text-center text-base text-gray-600">
                    Il blocco `Edifici` raccoglie i dettagli anagrafici e gestionali. Ventilazione e illuminazione sono ora configurati nel blocco `Impianti`.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-4 text-xl font-semibold">Dettagli edificio</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col">
                                <span className="mb-2 block">Nome</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Codice Ateco</span>
                                <input
                                    type="text"
                                    value={ateco}
                                    onChange={(event) => setAteco(event.target.value)}
                                    maxLength={8}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Numero dipendenti</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={employees}
                                    onChange={(event) => setEmployees(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Superficie (m²)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={area}
                                    onChange={(event) => setArea(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Anno di costruzione</span>
                                <input
                                    type="number"
                                    min="1000"
                                    max="9999"
                                    value={constructionYearValue}
                                    onChange={(event) => setConstructionYearValue(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Zona climatica</span>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={climateZone}
                                    onChange={(event) => setClimateZone(event.target.value.toUpperCase())}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Destinazione d'uso</span>
                                <input
                                    type="text"
                                    value={usage}
                                    onChange={(event) => setUsage(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Diffusione calore</span>
                                <select
                                    value={heating}
                                    onChange={(event) => setHeating(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.heatDistribution.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Ristrutturazioni fatte</span>
                                <select
                                    value={renovation}
                                    onChange={(event) => setRenovation(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.renovation.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-4 text-xl font-semibold">Indirizzo</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col">
                                <span className="mb-2 block">Stato</span>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(event) => setCountry(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Regione</span>
                                <select
                                    value={location}
                                    onChange={(event) => setLocation(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {REGION_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">CAP</span>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={cap}
                                    onChange={(event) => setCap(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Comune</span>
                                <input
                                    type="text"
                                    value={municipality}
                                    onChange={(event) => setMunicipality(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col md:col-span-2">
                                <span className="mb-2 block">Via / Piazza</span>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(event) => setStreet(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Numero civico</span>
                                <input
                                    type="text"
                                    value={streetNumber}
                                    onChange={(event) => setStreetNumber(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Indirizzo legacy</span>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(event) => setAddress(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-4 text-xl font-semibold">Gestione consumi e fornitura</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col">
                                <span className="mb-2 block">Controllo dei consumi</span>
                                <select
                                    value={energyControl}
                                    onChange={(event) => setEnergyControl(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.energyControl.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Manutenzione periodica impianto</span>
                                <select
                                    value={maintenance}
                                    onChange={(event) => setMaintenance(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.maintenance.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Recupero acqua piovana</span>
                                <select
                                    value={waterRecovery}
                                    onChange={(event) => setWaterRecovery(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.waterRecovery.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Classe di potenza contrattuale</span>
                                <select
                                    value={contractPowerClass}
                                    onChange={(event) => {
                                        setContractPowerClass(event.target.value);
                                        setElectricityCounter(event.target.value);
                                    }}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricityMeter.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Fonte elettrica</span>
                                <select
                                    value={electricForniture}
                                    onChange={(event) => setElectricForniture(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.electricForniture.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Analizzatori di rete per il controllo dei consumi elettrici</span>
                                <select
                                    value={electricityAnalyzer}
                                    onChange={(event) => setElectricityAnalyzer(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    {BUILDING_FORM_OPTIONS.analyzers.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-4 text-xl font-semibold">Descrizioni</h3>

                        <div className="grid gap-4">
                            <label className="flex flex-col">
                                <span className="mb-2 block">Descrizione dell'attività svolta (massimo 300 caratteri)</span>
                                <textarea
                                    value={activityDescription}
                                    onChange={(event) => {
                                        if (event.target.value.length <= 300) {
                                            setActivityDescription(event.target.value);
                                        }
                                    }}
                                    maxLength="300"
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                                <span className="mt-1 text-sm text-gray-500">{`${activityDescription.length}/300 caratteri`}</span>
                            </label>
                            <label className="flex flex-col">
                                <span className="mb-2 block">Descrizione dei processi produttivi (massimo 300 caratteri)</span>
                                <textarea
                                    value={prodProcessDescription}
                                    onChange={(event) => {
                                        if (event.target.value.length <= 300) {
                                            setProdProcessDescription(event.target.value);
                                        }
                                    }}
                                    maxLength="300"
                                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-xl text-gray-900"
                                />
                                <span className="mt-1 text-sm text-gray-500">{`${prodProcessDescription.length}/300 caratteri`}</span>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-base text-gray-600">
                        Ventilazione meccanica, illuminazione e sistemi automatici dei corpi illuminanti sono ora gestiti nel blocco <strong>`Impianti`</strong>. I valori esistenti vengono comunque mantenuti nel payload per non rompere il calcolo.
                    </section>

                    <div className="flex justify-center gap-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center mt-5">
                                <MutatingDots
                                    height="100"
                                    width="100"
                                    color="#2d7044"
                                    secondaryColor="#2d7044"
                                    radius="12.5"
                                    ariaLabel="mutating-dots-loading"
                                    visible
                                />
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="mt-2 rounded-lg border-2 border-transparent bg-[#2d7044] px-6 py-2 text-xl text-white transition-colors duration-300 ease-in-out hover:border-[#2d7044] hover:bg-white hover:text-[#2d7044]"
                            >
                                {isEdit ? "Salva" : "Carica"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BuildingFrom;