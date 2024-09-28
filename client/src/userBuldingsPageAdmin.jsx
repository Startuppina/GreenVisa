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
                const response = await axios.get(`http://localhost:8080/api/fetch-user-buildings/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
            const response = await axios.get(`http://localhost:8080/api/fetch-building-plants-solars-photos/${id}/${buildingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
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

    const energyOptions = [
        { label: "Gas Naturale (Metano)", unit: "Sm³" },
        { label: "GPL (Gas di Petrolio Liquefatti)", unit: "mc" },
        { label: "Gasolio", unit: "mc" },
        { label: "Olio Combustibile", unit: "t" },
        { label: "Pellet", unit: "t" },
        { label: "Cippato di Legna", unit: "t" },
        { label: "Biogas", unit: "Sm³" },
        { label: "Elettricità", unit: "kWh" },
        { label: "Energia Termica", unit: "kWh" },
    ];

    const toggleBuildingInfo = (buildingId) => {
        // Se l'edificio cliccato è già selezionato, nascondi le informazioni, altrimenti mostra le informazioni
        setSelectedBuildingId(prevId => prevId === buildingId ? null : buildingId);
    };

    const generateColor = (index) => {
        const baseHue = 200;
        const hueShift = (index * 30) % 360;
        return `hsl(${baseHue + hueShift}, 70%, 80%)`;
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
                        <div className="bg-[#D9D9D9] rounded-lg mt-10 md:mx-14 h-[65vh] lg:h-auto overflow-y-auto w-full">
                            <h2 className="text-2xl font-bold mb-4 text-center lg:text-left p-4">Dettagli dell'Edificio</h2>
                            {/* Colonna Sinistra */}
                            <div className="flex flex-col lg:flex-row items-stretch justify-center">
                                <div className="w-full lg:w-1/2 p-4">
                                    <div className="max-w-4xl mx-auto space-y-4">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Nome:</span>
                                            <span id="building-name">{selectedBuilding.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">locazione:</span>
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

                                {/* Colonna Destra */}
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
                                            <span className="font-semibold">Analizzatori:</span>
                                            <span id="electricity-analyzer">{selectedBuilding.analyzers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero lampade a incandescenza:</span>
                                            <span id="lighting">{selectedBuilding.incandescent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero lampade a LED:</span>
                                            <span id="led">{selectedBuilding.led}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Numero lampade a gas:</span>
                                            <span id="gas-lamp">{selectedBuilding.gas_lamp}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Sistemi di regolazione e controllo automatici dei corpi illuminanti:</span>
                                            <span id="lighting">{selectedBuilding.autolightingcontrolsystem}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}

                    {selectedBuildingId && buildingConsumptions.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-lg md:mx-14 h-auto max-h-[65vh] overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti fotovoltaici</h1>
                            {buildingConsumptions.map((consumption, index) => ( // Controllo per prevenire plants undefined
                                <div key={consumption.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Fonte energetica:</strong> {consumption.energy_source}
                                    </div>
                                    <div className="">
                                        <strong>Consumo:</strong> {consumption.consumption} {energyOptions.find(option => option.label === consumption.energy_source).unit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedBuildingId && buildingPlants.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-lg md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
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
                        <div className="bg-[#D9D9D9] rounded-lg md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti solari termici</h1>
                            {buildingSolars.map((solar, index) => ( // Controllo per prevenire plants undefined
                                <div key={solar.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Numero:</strong> {index + 1}
                                    </div>
                                    <div className="">
                                        <strong>Quantità installata:</strong> {solar.installed_area}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedBuildingId && buildingPhotos.length > 0 && (
                        <div className="bg-[#D9D9D9] rounded-lg md:mx-14 h-auto max-h-[65vh] lg:h-auto overflow-y-auto w-full p-4">
                            <h1 className="text-2xl font-bold mb-2">Impianti fotovoltaici</h1>
                            {buildingPhotos.map((photo, index) => ( // Controllo per prevenire plants undefined
                                <div key={photo.id}
                                    className="p-4 mb-4 bg-white rounded-lg"
                                >
                                    <div className="">
                                        <strong>Numero:</strong> {index + 1}
                                    </div>
                                    <div className="">
                                        <strong>Potenza:</strong> {photo.power}
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
