import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";

function Building() {
    const [buildingData, setBuildingData] = useState({});
    const navigate = useNavigate();
    const { id } = useParams();
    const { setBuildingID, refresh } = useRecoveryContext();
    const [averageScore, setAverageScore] = useState(0);

    useEffect(() => {
        const fetchBuilding = async () => {
            setBuildingID(id);
            try {
                const response = await axios.get(`http://localhost:8080/api/fetch-building/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }

                );
                if (response.status === 200) {
                    setBuildingData(response.data.building);
                    console.log(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        };



        const fetchBuildingScores = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/fetch-building-scores/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }

                );
                if (response.status === 200) {
                    setAverageScore(response.data);
                    console.log(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchBuilding();
        fetchBuildingScores();
    }, [refresh]);

    const calculateTotalScoreInCents = (score, numPlants, numSolars, numPhotovoltaics) => {
        let totalMaxScore = 0;
        if (numPlants === 0 && numSolars === 0 && numPhotovoltaics === 0) {
            totalMaxScore = 213;
        } else if (numSolars === 0 && numPhotovoltaics === 0) {
            totalMaxScore = 244;
        } else if (numPhotovoltaics === 0) {
            totalMaxScore = 263;
        } else {
            totalMaxScore = 282;
        }

        console.log("total max score:", totalMaxScore);

        const scoreInCents = Math.round(score / totalMaxScore * 100);
        return Math.round(scoreInCents);
    };

    return (
        <div className="text-arial text-xl">
            <h1 className="text-3xl font-bold text-center">Informazioni su <span className="uppercase text-[#2d7044]">{buildingData.name}</span></h1>
            <div className="bg-[#D9D9D9] rounded-lg mt-10 mx-2 md:mx-14">
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
                                <span className="font-semibold">Descrizione:</span>
                                <span id="description">{buildingData.description}</span>
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
                                <span className="font-semibold">Ventilazione:</span>
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
                                <span className="font-semibold">Manutenzione:</span>
                                <span id="maintenance">{buildingData.maintenance}</span>
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
                                <span className="font-semibold">Illuminazione:</span>
                                <span id="lighting">{buildingData.incandescent}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">LED:</span>
                                <span id="led">{buildingData.led}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Lampade a Gas:</span>
                                <span id="gas-lamp">{buildingData.gas_lamp}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-10 px-4">
                    <strong className="text-red-500">PUNTEGGIO DI ECOSOSTENIBILITA DELL'EDIFICIO:</strong> {buildingData.buildingscore}
                </div>
                <div className="px-4 pb-4">
                    <strong className="text-red-500">PUNTEGGIO DI ECOSOSTENIBILITA COMPLESSIVO DELL'EDIFICIO (in centesimi):</strong><strong> {calculateTotalScoreInCents(averageScore.averageScore, averageScore.numPlants, averageScore.numSolars, averageScore.numPhotovoltaics)} / 100</strong>
                </div>

            </div>
        </div>
    );
}

export default Building;
