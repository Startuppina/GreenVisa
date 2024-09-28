import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";
import BuildingFrom from "./buildingFrom";

function Building() {
    const [buildingData, setBuildingData] = useState({});
    const navigate = useNavigate();
    const { id } = useParams();
    const { setBuildingID, refresh } = useRecoveryContext();
    const [averageScore, setAverageScore] = useState(0);
    const [showModifierBuildingForm, setShowModifierBuildingForm] = useState(false);

    // Crea una ref per il form
    const formRef = useRef(null);

    useEffect(() => {
        const fetchBuilding = async () => {
            setBuildingID(id);
            try {
                const response = await axios.get(`http://localhost:8080/api/fetch-building/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.status === 200) {
                    setBuildingData(response.data.building);
                    console.log(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchBuilding();
    }, [refresh]);

    // Effettua lo scroll verso il form quando showModifierBuildingForm diventa true
    useEffect(() => {
        if (showModifierBuildingForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [showModifierBuildingForm]);

    return (
        <div className="text-arial text-xl">
            <h1 className="text-3xl font-bold text-center">Informazioni su <span className="uppercase text-[#2d7044]">{buildingData.name}</span></h1>
            <div className="bg-[#D9D9D9] rounded-lg mt-10 mx-2 md:mx-14 h-[65vh] lg:h-auto overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-center lg:text-left p-4">Dettagli dell'Edificio</h2>
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
                                <span className="font-semibold">Analizzatori:</span>
                                <span id="electricity-analyzer">{buildingData.analyzers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Numero lampade a incandescenza:</span>
                                <span id="lighting">{buildingData.incandescent}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Numero lampade a LED:</span>
                                <span id="led">{buildingData.led}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Numero lampade a gas:</span>
                                <span id="gas-lamp">{buildingData.gas_lamp}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Sistemi di regolazione e controllo automatici dei corpi illuminanti:</span>
                                <span id="lighting">{buildingData.autolightingcontrolsystem}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        className="p-2 w-[150px] z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mb-4"
                        onClick={() => {
                            setShowModifierBuildingForm(!showModifierBuildingForm);
                        }}
                    >
                        Modifica
                    </button>
                </div>

                {showModifierBuildingForm && (
                    <div ref={formRef}> {/* Aggiungi la ref qui */}
                        <BuildingFrom
                            buildingData={buildingData}
                            isEdit={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Building;
