import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/scrollToTop";

function UserBuldingsPageAdmin() {
    const [userBuildings, setUserBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [buildingConsumptions, setBuildingConsumptions] = useState([]);
    const [buildingPlants, setBuildingPlants] = useState([]);
    const [buildingSolars, setBuildingSolars] = useState([]);
    const [buildingPhotos, setBuildingPhotos] = useState([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState(null); // ID dell'edificio selezionato
    const { id, username } = useParams();

    useEffect(() => {
        const fetchUserBuildings = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-user-buildings/${id}`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    setUserBuildings(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchUserBuildings();
    }, [selectedBuilding]);

    const handleFetchBuildingPlantsSolarsPhoto = async (buildingId) => {

        console.log("buildingId", buildingId);
        console.log("id", id);
        setBuildingPlants([]);
        setBuildingConsumptions([]);
        setBuildingSolars([]);
        setBuildingPhotos([]);

        console.log("building solars", buildingSolars);

        try {
            const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-building-plants-solars-photos/${id}/${buildingId}`, {
                withCredentials: true
            });
            if (response.status === 200) {
                setBuildingPlants(response.data.plants);
                setBuildingConsumptions(response.data.consumptions);
                setBuildingSolars(response.data.solars);
                setBuildingPhotos(response.data.photovoltaics);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getEnergyUnit = (energySource) => {
        const energyOptions = [
            { label: "Gas Naturale (Metano)", unit: "Sm³" },
            { label: "GPL", unit: "mc" },
            { label: "Gasolio", unit: "mc" },
            { label: "Olio combustibile", unit: "t" },
            { label: "Pellet", unit: "t" },
            { label: "Cippato di legna", unit: "t" },
            { label: "Biogas", unit: "Sm³" },
            { label: "Elettricità", unit: "kWh" },
            { label: "Energia termica", unit: "kWh" },
        ];

        // Trova l'unità di misura corretta in base alla fonte energetica
        const energyOption = energyOptions.find(option => option.label === energySource);
        return energyOption ? energyOption.unit : ''; // Restituisce l'unità o una stringa vuota se non trovata
    };


    const toggleBuildingInfo = (buildingId) => {
        // Se l'edificio cliccato è già selezionato, nascondi le informazioni, altrimenti mostra le informazioni
        setSelectedBuildingId(prevId => prevId === buildingId ? null : buildingId);
    };

    const generateColor = (index) => {
        const baseHue = 200;
        const hueShift = (index * 30) % 360;
        return `hsl(${baseHue + hueShift}, 70%, 80%)`;
    };

    const scoreIndicator = (score) => {
        const maxScore = 10;
        const normalizedScore = Math.max(0, Math.min(score, maxScore));
        return (normalizedScore / maxScore) * 100;
    };

    const getDetailedVoteColor = (finalVote) => {
        if (finalVote >= 9) return "#1b5e20";
        else if (finalVote >= 8) return "#4caf50";
        else if (finalVote >= 7) return "#8bc34a";
        else if (finalVote >= 6) return "#cddc39";
        else if (finalVote >= 5) return "#ffeb3b";
        else if (finalVote >= 4) return "#ffc107";
        else if (finalVote >= 3) return "#ff9800";
        else if (finalVote >= 2) return "#ff5722";
        else if (finalVote >= 1) return "#f44336";
        else return "#b71c1c";
    };

    const getOverallEvaluation = (finalVote) => {
        if (finalVote >= 9) return "Eccellente";
        else if (finalVote >= 8) return "Buono";
        else if (finalVote >= 7) return "Discreto";
        else if (finalVote >= 6) return "Sufficiente";
        else return "Non Sufficiente";
    };

    return (
        <>
            <ScrollToTop />
            <Navbar />
            <div className="text-arial text-xl p-4 min-h-screen">
                <h1 className="text-3xl font-bold text-center mb-4">
                    Edifici registrati dall'utente <span className="text-[#2d7044]">{username}</span>
                </h1>

                <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4 w-full">
                    {userBuildings.map((building, index) => (
                        <div key={building.id} className=" w-full md:w-[300px]"> {/* Responsive widths */}
                            <div
                                onClick={() => {
                                    toggleBuildingInfo(building.id);
                                    setSelectedBuilding(building);
                                    handleFetchBuildingPlantsSolarsPhoto(building.id);
                                }}
                                className="p-2 rounded-lg flex flex-col items-center justify-center hover:transform transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
                                style={{ backgroundColor: generateColor(index) }}
                            >
                                <h2 className="text-2xl font-bold mb-2">{building.name}</h2>
                                <p className="text-lg mb-2">ID: {building.id}</p>
                            </div>
                        </div>
                    ))}

                    {/* Mostra informazioni dettagliate solo se questo edificio è selezionato */}
                    {selectedBuildingId && selectedBuilding && (
                        <div className="bg-[#D9D9D9] rounded-xl mt-10 md:mx-14 h-[65vh] lg:h-auto overflow-y-auto w-full">
                            <h2 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Dettagli dell'Edificio</h2>

                            {/* Sezione dei risultati (solo se esiste il voto) */}
                            {selectedBuilding.emissionmark && (
                                <div>
                                    <div className="flex flex-col justify-center bg-gray-100 mx-2 md:mx-14 rounded-xl shadow-lg p-6 text-arial text-xl mb-2">
                                        <h1 className="text-4xl text-center font-bold text-gray-800 mb-4">Risultato</h1>
                                        <div className="flex flex-col items-start gap-6 mt-6">
                                            <div className="flex flex-col items-center mx-auto justify-between w-full md:w-[500px]">
                                                <div className="font-bold text-lg md:text-xl text-gray-700">Voto</div>
                                                <div className="w-full h-[30px] bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner">
                                                    <div
                                                        className="h-full rounded-lg transition-all duration-300 ease-in-out"
                                                        style={{
                                                            width: `${scoreIndicator(selectedBuilding.emissionmark)}%`,
                                                            backgroundColor: `${getDetailedVoteColor(selectedBuilding.emissionmark)}`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-right w-full text-lg md:text-xl text-gray-600 mt-2">
                                                    <strong>{selectedBuilding.emissionmark > 10 ? '10+' : selectedBuilding.emissionmark}</strong>/10
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center mx-auto justify-center w-full md:w-[500px] gap-2">
                                                <div className="text-lg md:text-xl text-blue-600 font-extrabold">
                                                    {getOverallEvaluation(selectedBuilding.emissionmark)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center mx-auto justify-between w-full md:w-[500px] gap-2 mt-4">
                                                <div className="font-bold text-lg md:text-xl text-gray-700">Emissioni CO2</div>
                                                <div className="text-lg md:text-xl text-gray-600 flex gap-2">
                                                    <strong>{selectedBuilding.emissionco2}</strong> <div>tonsCO<sub>2</sub>e</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center mx-auto justify-between w-full md:w-[500px] gap-2">
                                                <div className="font-bold text-lg md:text-xl text-gray-700">Emissioni CO2 per superficie</div>
                                                <div className="text-lg md:text-xl text-gray-600 flex gap-2">
                                                    <strong>{selectedBuilding.areaemissionco2}</strong> <div>tonsCO<sub>2</sub>/m²</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Colonna Sinistra - Sempre visibile */}
                            <div className="flex flex-col lg:flex-row items-stretch justify-center">
                                <div className="w-full lg:w-1/2 p-4">
                                    <div className="max-w-4xl mx-auto space-y-4">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Nome:</span>
                                            <span id="building-name">{selectedBuilding.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Locazione:</span>
                                            <span id="construction-year">{selectedBuilding.location}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Indirizzo:</span>
                                            <span id="description">{selectedBuilding.address}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Destinazione d'uso:</span>
                                            <span id="description">{selectedBuilding.usage}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Anno di Costruzione:</span>
                                            <span id="construction-year">{selectedBuilding.construction_year}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Superficie:</span>
                                            <span id="construction-year">{selectedBuilding.area} m²</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Ristrutturazione:</span>
                                            <span id="renovation">{selectedBuilding.renovation}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Distribuzione del Calore:</span>
                                            <span id="heat-distribution">{selectedBuilding.heat_distribution}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Ventilazione Meccanica Controllata:</span>
                                            <span id="ventilation">{selectedBuilding.ventilation}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Controllo Energetico:</span>
                                            <span id="energy-control">{selectedBuilding.energy_control}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Colonna Destra - Sempre visibile */}
                                <div className="w-full lg:w-1/2 p-4">
                                    <div className="max-w-4xl mx-auto space-y-4">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Manutenzione periodica dell'impianto:</span>
                                            <span id="maintenance">{selectedBuilding.maintenance}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Fornitura elettrica dell'edificio:</span>
                                            <span id="maintenance">{selectedBuilding.electricity_forniture}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Recupero Acqua:</span>
                                            <span id="water-recovery">{selectedBuilding.water_recovery}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Contatore Elettrico:</span>
                                            <span id="electricity-counter">{selectedBuilding.electricity_meter}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Analizzatori di rete per il controllo dei consumi elettrici:</span>
                                            <span id="electricity-analyzer">{selectedBuilding.analyzers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero dispositivi a incandescenza:</span>
                                            <span id="lighting">{selectedBuilding.incandescent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero dispositivi a LED:</span>
                                            <span id="led">{selectedBuilding.led}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero dispositivi a gas:</span>
                                            <span id="gas-lamp">{selectedBuilding.gas_lamp}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Sistemi di regolazione e controllo automatici dei corpi illuminanti:</span>
                                            <span id="lighting">{selectedBuilding.autolightingcontrolsystem}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            {true && (
                                <div className="flex flex-col items-stretch justify-center">
                                    {/* Dati principali (Codice ATECO, Numero dipendenti, Fatturato annuo) in linea orizzontale su schermi grandi */}
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="w-full lg:w-1/3 p-4">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold">Codice ATECO:</span>
                                                <span id="lighting">{selectedBuilding.ateco}</span>
                                            </div>
                                        </div>
                                        <div className="w-full lg:w-1/3 p-4">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold">Numero dipendenti:</span>
                                                <span id="lighting">{selectedBuilding.num_employees}</span>
                                            </div>
                                        </div>
                                        <div className="w-full lg:w-1/3 p-4">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold">Fatturato annuo:</span>
                                                <span id="lighting">{selectedBuilding.annual_turnover.toLocaleString('it-IT')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contenitore per le descrizioni (attività e processi produttivi), sempre sotto i 3 dati */}
                                    <div className="flex flex-col w-full lg:w-full p-4">
                                        {/* Descrizione attività */}
                                        <div className="flex flex-col mb-4">
                                            <span className="font-semibold mb-2">Descrizione attività:</span>
                                            <textarea
                                                id="lighting"
                                                value={selectedBuilding.activity_description || ''}
                                                readOnly
                                                className="w-full h-24 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 mb-2"
                                                maxLength={300}
                                                placeholder="Descrizione attività (max 300 caratteri)"
                                            />
                                            <div className="text-right text-sm text-gray-500">{selectedBuilding.activity_description ? `${selectedBuilding.activity_description.length}/300` : "0/300"}</div>
                                        </div>

                                        {/* Descrizione processi produttivi */}
                                        <div className="flex flex-col mb-4">
                                            <span className="font-semibold mb-2">Descrizione processi produttivi:</span>
                                            <textarea
                                                id="lighting"
                                                value={selectedBuilding.prodprocessdesc || ''}
                                                readOnly
                                                className="w-full h-24 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 mb-2"
                                                maxLength={300}
                                                placeholder="Descrizione processi produttivi (max 300 caratteri)"
                                            />
                                            <div className="text-right text-sm text-gray-500">{selectedBuilding.prodprocessdesc ? `${selectedBuilding.prodprocessdesc.length}/300` : "0/300"}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    )}


                    {selectedBuildingId && buildingConsumptions.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-xl md:mx-14 h-auto max-h-[65vh] overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Consumi annuali</h1>
                            {buildingConsumptions.map((consumption, index) => ( // Controllo per prevenire plants undefined
                                <div key={consumption.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Fonte energetica:</strong> {consumption.energy_source}
                                    </div>
                                    <div className="">
                                        <strong>Consumo:</strong> {consumption.consumption} {getEnergyUnit(consumption.energy_source)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedBuildingId && buildingPlants.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-xl md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti</h1>
                            {buildingPlants.map(plant => ( // Controllo per prevenire plants undefined
                                <div key={plant.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Descrizione:</strong> {plant.description}
                                    </div>
                                    <div className="">
                                        <strong>Tipo di impianto:</strong> {plant.plant_type}
                                    </div>
                                    <div className="">
                                        <strong>Tipo di servizio:</strong> {plant.service_type}
                                    </div>
                                    <div className="">
                                        <strong>Tipo di generatore:</strong> {plant.generator_type}
                                    </div>
                                    <div className="">
                                        <strong>Descrizione tipologia:</strong> {plant.generator_description}
                                    </div>
                                    <div className="">
                                        <strong>Punteggio assegnato alla tipologia di generatore (definito nella descrizione):</strong> {plant.generator_assigned_score}
                                    </div>
                                    <div className="">
                                        <strong>Elemento consumato dal generatore:</strong> {plant.fuel_type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedBuildingId && buildingSolars.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-xl md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti solari termici</h1>
                            {buildingSolars.map((solar, index) => ( // Controllo per prevenire plants undefined
                                <div key={solar.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Numero:</strong> {index + 1}
                                    </div>
                                    <div className="">
                                        <strong>Quantità installata:</strong> {solar.installed_area} m²
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedBuildingId && buildingPhotos.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-xl md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti fotovoltaici</h1>
                            {buildingPhotos.map((photo, index) => ( // Controllo per prevenire plants undefined
                                <div key={photo.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Numero:</strong> {index + 1}
                                    </div>
                                    <div className="">
                                        <strong>Potenza:</strong> {photo.power} kW
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>


            </div >

            <Footer />
        </>
    );
}

export default UserBuldingsPageAdmin;
