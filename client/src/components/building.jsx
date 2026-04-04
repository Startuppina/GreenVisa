import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import BuildingFrom from "./buildingFrom";
import BuildingResults from "./buildingResults";
import MessagePopUp from "./messagePopUp";

function Building() {
    const [buildingData, setBuildingData] = useState({});
    const { id } = useParams();
    const { setBuildingID, refresh, setBuildingLocked, buildingLocked } = useRecoveryContext();
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccessPopup, setUpdateSuccessPopup] = useState(false);

    const isNewBuilding = id === 'new';

    useEffect(() => {
        if (isNewBuilding) {
            setBuildingID(0);
            setBuildingLocked(false);
            setIsEditing(false);
            return;
        }

        const fetchBuilding = async () => {
            setBuildingID(id);
            try {
                const response = await axios.get(`/api/fetch-building/${id}`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    const fetchedBuilding = response.data.building || {};
                    setBuildingData(fetchedBuilding);
                    const isLocked = Boolean(fetchedBuilding.results_visible);
                    setBuildingLocked(isLocked);
                    if (isLocked) {
                        setIsEditing(false);
                    }
                    console.log(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchBuilding();
    }, [id, isNewBuilding, refresh, setBuildingID, setBuildingLocked]);

    if (isNewBuilding) {
        return (
            <div className="text-arial text-xl">
                <h1 className="text-3xl font-bold text-center">
                    <span className="uppercase text-[#2d7044]">Nuovo edificio</span>
                </h1>
                <p className="text-center text-lg mt-2 text-gray-600">
                    Compila i dati qui sotto. Dopo il salvataggio potrai gestire impianti, consumi e le altre sezioni.
                </p>
                <div className="mt-6">
                    <BuildingFrom buildingData="empty" isEdit={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="text-arial text-xl">
            <MessagePopUp trigger={updateSuccessPopup} setTrigger={setUpdateSuccessPopup}>
                Edificio aggiornato con successo
            </MessagePopUp>
            <h1 className="text-3xl font-bold text-center">Informazioni su <span className="uppercase text-[#2d7044]">{buildingData.name}</span></h1>
            <BuildingResults />
            <div className="bg-[#D9D9D9] rounded-xl mt-10 mx-2 md:mx-14 h-[65vh] lg:h-auto overflow-y-auto">
                <div className="flex items-center justify-between p-4">
                    <h2 className="text-2xl font-bold">Dettagli dell'Edificio</h2>
                    {!buildingLocked && (
                        <button
                            className="p-2 w-[150px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "Annulla" : "Modifica"}
                        </button>
                    )}
                </div>

                {isEditing && !buildingLocked ? (
                    <div className="pb-6">
                        <BuildingFrom
                            buildingData={buildingData}
                            isEdit={true}
                            onEditSuccess={() => {
                                setIsEditing(false);
                                setUpdateSuccessPopup(true);
                            }}
                        />
                    </div>
                ) : (
                    <>
                        {/* Colonna Sinistra */}
                        <div className="flex flex-col lg:flex-row items-stretch justify-center">
                            <div className="w-full lg:w-1/2 p-4">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Nome:</span>
                                        <span id="building-name">{buildingData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">locazione:</span>
                                        <span id="construction-year">{buildingData.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Indirizzo:</span>
                                        <span id="description">{buildingData.address}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Destinazione d'uso:</span>
                                        <span id="description">{buildingData.usage}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Anno di Costruzione:</span>
                                        <span id="construction-year">{buildingData.construction_year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Superficie:</span>
                                        <span id="construction-year">{buildingData.area} m²</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Ristrutturazione:</span>
                                        <span id="renovation">{buildingData.renovation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Distribuzione del Calore:</span>
                                        <span id="heat-distribution">{buildingData.heat_distribution}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Ventilazione Meccanica Controllata:</span>
                                        <span id="ventilation">{buildingData.ventilation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Controllo Energetico:</span>
                                        <span id="energy-control">{buildingData.energy_control}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Colonna Destra */}
                            <div className="w-full lg:w-1/2 p-4">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Manutenzione periodica dell'impianto:</span>
                                        <span id="maintenance">{buildingData.maintenance}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Fornitura elettrica dell'edificio:</span>
                                        <span id="maintenance">{buildingData.electricity_forniture}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Recupero Acqua:</span>
                                        <span id="water-recovery">{buildingData.water_recovery}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Contatore Elettrico:</span>
                                        <span id="electricity-counter">{buildingData.electricity_meter}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Analizzatori di rete per il controllo dei consumi elettrici:</span>
                                        <span id="electricity-analyzer">{buildingData.analyzers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Numero dispositivi a incandescenza:</span>
                                        <span id="lighting">{buildingData.incandescent}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Numero dispositivi a LED:</span>
                                        <span id="led">{buildingData.led}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Numero dispositivi a gas:</span>
                                        <span id="gas-lamp">{buildingData.gas_lamp}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Sistemi di regolazione e controllo automatici dei corpi illuminanti:</span>
                                        <span id="lighting">{buildingData.autolightingcontrolsystem}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Codice ATECO, dipendenti, fatturato: stessa griglia a due colonie delle righe sopra */}
                        <div className="flex flex-col lg:flex-row items-stretch justify-center">
                            <div className="w-full lg:w-1/2 p-4 pt-0 lg:pt-4">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Codice ATECO:</span>
                                        <span id="building-ateco">{buildingData.ateco ?? "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Numero dipendenti:</span>
                                        <span id="building-num-employees">{buildingData.num_employees ?? "-"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 p-4 pt-0 lg:pt-4">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Fatturato annuo:</span>
                                        <span id="building-annual-turnover">{buildingData.annual_turnover ?? "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contenitore per le descrizioni (attività e processi produttivi), sempre sotto i 3 dati */}
                        <div className="flex flex-col w-full lg:w-full p-4 space-y-4">
                            <div className="flex flex-col">
                                <span className="font-semibold">Descrizione attività:</span>
                                <span className="whitespace-pre-wrap break-words">
                                    {buildingData.activity_description || "-"}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="font-semibold">Descrizione processi produttivi:</span>
                                <span className="whitespace-pre-wrap break-words">
                                    {buildingData.prodprocessdesc || "-"}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Building;
