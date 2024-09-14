import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";


function PlantForm({ plant = 'empty', isEdit, onButtonClick = 'empty' }) {
    const [description, setDescription] = useState(plant.description || "");
    const [plantType, setPlantType] = useState(plant.plant_type || "");
    const [serviceType, setServiceType] = useState(plant.service_type || "");
    const [generatorType, setGeneratorType] = useState(plant.generator_type || "");
    const [generatorDescription, setGeneratorDescription] = useState(plant.generator_description || "");
    const [fuelType, setFuelType] = useState(plant.fuel_type || "");
    const [quantity, setQuantity] = useState(plant.quantity || "");
    const [electricitySupply, setElectricitySupply] = useState(plant.electricity_supply || "");
    const [isLoading, setIsLoading] = useState(false);

    const [plantTypes, setPlantTypes] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [generatorTypes, setGeneratorTypes] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);
    const [electricitySupplies, setElectricitySupplies] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { buildingID, triggerRefresh } = useRecoveryContext();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSelectOptions = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/plant-options', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.status === 200) {
                    setPlantTypes(response.data.plant_type);
                    setServiceTypes(response.data.service_type);
                    setGeneratorTypes(response.data.generator_type);
                    setFuelTypes(response.data.fuel_type);
                    setElectricitySupplies(response.data.electricity_supply);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchSelectOptions();
    }, []);

    const handleUpdatePlant = async () => {
        const token = localStorage.getItem("token");
        const id = buildingID;

        const formData = {
            description,
            plantType,
            serviceType,
            generatorType,
            generatorDescription: generatorType === "Altro" ? generatorDescription : "",
            fuelType,
            quantity,
            electricitySupply,
        };

        const plantScore = calculateSustainabilityScore(formData);

        const updatedFormData = {
            ...formData,
            plantScore
        };

        try {
            const response = await axios.put(`http://localhost:8080/api/buildings/${id}/update/plant/${plant.id}`, updatedFormData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);

                // Reset dei dati del modulo

                triggerRefresh();
            } else {
                console.log('Error:', response.data.msg);
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
            }

        } catch (error) {
            console.log(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (isEdit) {
            handleUpdatePlant();
            return;
        }

        const token = localStorage.getItem("token");
        const id = buildingID;

        const formData = {
            description,
            plantType,
            serviceType,
            generatorType,
            generatorDescription: generatorType === "Altro" ? generatorDescription : "",
            fuelType,
            quantity,
            electricitySupply,
        };

        const plantScore = calculateSustainabilityScore(formData);

        const updatedFormData = {
            ...formData,
            plantScore
        };


        try {
            const response = await axios.post(`http://localhost:8080/api/buildings/${id}/upload/plant`, updatedFormData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);

                // Reset dei dati del modulo
                setDescription("");
                setPlantType("");
                setServiceType("");
                setGeneratorType("");
                setGeneratorDescription("");
                setFuelType("");
                setQuantity(1);
                setElectricitySupply("");

                triggerRefresh(); // Trigger refresh in Plants component

            } else if (response.status === 400) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleDescriptionChange = (e) => setDescription(e.target.value);
    const handlePlantTypeChange = (e) => setPlantType(e.target.value);
    const handleServiceTypeChange = (e) => setServiceType(e.target.value);
    const handleGeneratorTypeChange = (e) => setGeneratorType(e.target.value);
    const handleGeneratorDescriptionChange = (e) => setGeneratorDescription(e.target.value);
    const handleFuelTypeChange = (e) => setFuelType(e.target.value);
    const handleQuantityChange = (e) => setQuantity(e.target.value);
    const handleElectricitySupplyChange = (e) => setElectricitySupply(e.target.value);

    const sustainabilityScores = {
        plantTypes: {
            'Centralizzato': 2,
            'Autonomo': 4
        },
        serviceTypes: {
            'Riscaldamento': 2,
            'Raffrescamento': 3,
            'Acqua calda sanitaria': 2,
            'Altra produzione termica': 1
        },
        generatorTypes: {
            'Caldaia tradizionale': 1,
            'Caldaia condensazione': 2,
            'Pompa di calore idronica': 4,
            'Ibrido (Caldaia e Pompa di Calore)': 3,
            'Teleriscaldamento': 2,
            'Cogeneratore o Trigenerazione con Motore endotermico': 1,
            'Cogeneratore o Trigenerazione con Microturbina': 2,
            'Cogeneratore o Trigenerazione con Fuel Cell': 4,
            'Altro': 1
        },
        fuelTypes: {
            'Gas Naturale (Metano)': 2,
            'GPL': 2,
            'Gasolio': 1,
            'Olio combustibile': 1,
            'Pellet': 3,
            'Cippato di legna': 3,
            'Biogas': 4,
            'Biodiesel': 3,
            'Elettrico - mix generico': 3,
            'Elettrico - 100% rinnovabili': 4
        },
        electricitySupplies: {
            'Elettrico - mix generico': 3,
            'Elettrico - 100% rinnovabili': 4
        }
    };


    /*const sustainabilityScores = {
        plantTypes: {
            'Centralizzato': 2,
            'Autonomo': 4
        },
        serviceTypes: {
            'Riscaldamento': 2,
            'Raffrescamento': 3,
            'Acqua calda sanitaria': 2,
            'Altra produzione termica': 1
        },
        generatorTypes: {
            'Centralizzato': {
                'Caldaia tradizionale': 1,
                'Caldaia condensazione': 2,
                'Pompa di calore idronica': 4,
                'Ibrido (Caldaia e Pompa di Calore)': 3,
                'Cogeneratore o Trigenerazione con Motore endotermico': 1,
                'Cogeneratore o Trigenerazione con Microturbina': 2,
                'Cogeneratore o Trigenerazione con Fuel Cell': 4,
                'Teleriscaldamento': 2,
                'Bolitore elettrico': 1,
                'Altro': 1
            },
            'Autonomo': {
                'Caldaia tradizionale': 1,
                'Caldaia condensazione': 2,
                'Pompa di calore idronica': 4,
                'split': 1,
                'Ibrido (Caldaia e Pompa di Calore)': 3,
                'Bolitore elettrico': 1,
                'Altro': 1
            },
        },
        fuelTypes: {
            'Gas Naturale (Metano)': 2,
            'GPL': 2,
            'Gasolio': 1,
            'Olio combustibile': 1,
            'Pellet': 3,
            'Cippato di legna': 3,
            'Biogas': 4,
            'Biodiesel': 3,
            'Elettrico - mix generico': 3,
            'Elettrico - 100% rinnovabili': 4,
            'Energia termica': 1
        },
        electricitySupplies: {
            'Elettrico - mix generico': 3,
            'Elettrico - 100% rinnovabili': 4
        }
    };*/

    /*
    const generatorOptions = plantType ?
        Object.entries(sustainabilityScores.generatorTypes[plantType]).map(([key, value]) => (
            <option key={key} value={key}>{key}</option>
        )) : [];*/



    const calculateSustainabilityScore = (plant) => {
        const baseScore = 10;

        const plantTypeScore = sustainabilityScores.plantTypes[plant.plantType] || 1;
        const serviceTypeScore = sustainabilityScores.serviceTypes[plant.serviceType] || 1;
        const generatorTypeScore = sustainabilityScores.generatorTypes[plant.generatorType] || 1;
        const fuelTypeScore = sustainabilityScores.fuelTypes[plant.fuelType] || 1;
        const electricitySupplyScore = sustainabilityScores.electricitySupplies[plant.electricitySupply] || 1;

        const fuelQuantityFactor = getFuelQuantityFactor(plant.quantity);

        // Calcola il punteggio totale sommando i punteggi dei singoli parametri
        let totalScore = baseScore;
        totalScore += plantTypeScore;
        totalScore += serviceTypeScore;
        totalScore += generatorTypeScore;
        totalScore += fuelQuantityFactor * fuelTypeScore;
        totalScore += electricitySupplyScore;

        return totalScore;
    };

    /*IDEA PER CALCOLARE IL PUNTEGGIO DATA UNA COMBINAZIONE DI VALORI INSEIRIT DALL'UTENTE

    const combinationScores = {
    'Autonomo|Ibrido (Caldaia e Pompa di Calore)|Gas Naturale (Metano)': 8,
    'Autonomo|Pompa di calore idronica|GPL': 7,
    'Centralizzato|Caldaia condensazione|Pellet': 9,
    'Centralizzato|Pompa di calore idronica|Elettrico - 100% rinnovabili': 10,
    // Aggiungi tutte le altre combinazioni qui
    // 'plantType|generatorType|fuelType': score
};

const calculateSustainabilityScore = (plant) => {
    // Crea la chiave per la combinazione specifica
    const combinationKey = `${plant.plantType}|${plant.generatorType}|${plant.fuelType}`;

    // Cerca il punteggio basato sulla combinazione, se esiste, altrimenti restituisci un punteggio di default
    const totalScore = combinationScores[combinationKey] || 1; // 1 come punteggio di default se la combinazione non è trovata

    return totalScore;
};

*/

    const getFuelQuantityFactor = (quantity) => {
        if (quantity <= 100) {
            return 1.3; // Quantità molto basse, punteggio aumentato del 30%
        } else if (quantity > 100 && quantity <= 500) {
            return 1.1; // Quantità basse, punteggio aumentato del 10%
        } else if (quantity > 500 && quantity <= 1000) {
            return 1; // Quantità moderate, nessuna variazione
        } else if (quantity > 1000 && quantity <= 3000) {
            return 0.8; // Quantità alte, riduce il punteggio del 20%
        } else {
            return 0.6; // Quantità molto elevate, riduce il punteggio del 40%
        }
    };


    return (
        <div className="w-full mx-2 flex justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-full mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">
                <h2 className="text-2xl font-bold text-center mb-6">{isEdit ? "Modifica Impianto" : "Aggiungi un impianto"}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col">

                    <div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Descrizione</span>
                            <input
                                type="text"
                                value={description}
                                onChange={handleDescriptionChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Tipo di impianto</span>
                            <select
                                value={plantType}
                                onChange={handlePlantTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di impianto</option>
                                {plantTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Tipo di servizio</span>
                            <select
                                value={serviceType}
                                onChange={handleServiceTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di servizio</option>
                                {serviceTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Tipo di generatore</span>
                            <select
                                value={generatorType}
                                onChange={handleGeneratorTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di generatore</option>
                                {/*generatorOptions*/}
                                {generatorTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        {generatorType === "Altro" && (
                            <label className="flex flex-col w-full md:w-1/2">
                                <span className="block mb-2">Descrizione del generatore (punteggio assegnato a seguito di revisione)</span>
                                <input
                                    type="text"
                                    value={generatorDescription}
                                    onChange={handleGeneratorDescriptionChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Tipo di carburante</span>
                            <select
                                value={fuelType}
                                onChange={handleFuelTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di carburante</option>
                                {fuelTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Quantità (metano e biogas [SMC], biodiesel e GPL [litri], olio e cippato [ton], pellet [kg])</span>
                            <input
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                min="1"
                            />
                        </label>
                    </div>

                    <div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Fornitura di elettricità</span>
                            <select
                                value={electricitySupply}
                                onChange={handleElectricitySupplyChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di fornitura elettrica</option>
                                {electricitySupplies.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center mt-5">
                            <MutatingDots
                                height="100"
                                width="100"
                                color="#2d7044"
                                secondaryColor='#2d7044'
                                radius='12.5'
                                ariaLabel="mutating-dots-loading"
                                visible={true}
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center items-center mt-5 gap-3">
                            <button
                                type="submit"
                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                            >
                                Carica
                            </button>
                            <button
                                type="button"
                                onClick={onButtonClick}
                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-gray-500 text-white rounded-lg border-2 border-transparent hover:border-gray-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-gray-500"
                            >
                                Annulla
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default PlantForm;
