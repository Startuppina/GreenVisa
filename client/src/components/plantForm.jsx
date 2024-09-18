import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";


function PlantForm({ plant = 'empty', isEdit, onButtonClick }) {
    const [description, setDescription] = useState(plant.description || "");
    const [plantType, setPlantType] = useState(plant.plant_type || "");
    const [serviceType, setServiceType] = useState(plant.service_type || "");
    const [generatorType, setGeneratorType] = useState(plant.generator_type || "");
    const [generatorDescription, setGeneratorDescription] = useState(plant.generator_description || "");
    const [fuelType, setFuelType] = useState(plant.fuel_type || "");
    //const [quantity, setQuantity] = useState(plant.quantity || "");
    //const [electricitySupply, setElectricitySupply] = useState(plant.electricity_supply || "");
    const [isLoading, setIsLoading] = useState(false);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { buildingID, triggerRefresh } = useRecoveryContext();

    const navigate = useNavigate();

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
            //quantity,
            //electricitySupply,
        };

        //const plantScore = calculateSustainabilityScore(formData);

        /*const updatedFormData = {
            ...formData,
            plantScore
        };*/

        try {
            const response = await axios.put(`http://localhost:8080/api/buildings/${id}/update/plant/${plant.id}`, formData, {
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
            //quantity,
            //electricitySupply,
        };

        //const plantScore = calculateSustainabilityScore(formData);

        /*const updatedFormData = {
            ...formData,
            plantScore
        };*/


        try {
            const response = await axios.post(`http://localhost:8080/api/buildings/${id}/upload/plant`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setTimeout(() => {
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
                    //setQuantity(1);
                    //setElectricitySupply("");

                    triggerRefresh(); // Trigger refresh in Plants component

                }, 3000);

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
    };*/


    const options = [
        {
            plantTypes: [
                "Centralizzato",
                "Autonomo"
            ],
            serviceTypes: [
                "Riscaldamento",
                "Raffrescamento",
                "Acqua calda sanitaria",
                "Altra produzione termica"
            ],
            generatorTypes: [
                {
                    type: "Centralizzato",
                    options: [
                        "Caldaia tradizionale",
                        "Caldaia condensazione",
                        "Pompa di calore idronica",
                        "Ibrido (Caldaia e Pompa di Calore)",
                        "Cogeneratore o Trigenerazione con Motore endotermico",
                        "Cogeneratore o Trigenerazione con Microturbina",
                        "Cogeneratore o Trigenerazione con Fuel Cell",
                        "Teleriscaldamento",
                        "Bolitore elettrico",
                        "Altro"
                    ]
                },
                {
                    type: "Autonomo",
                    options: [
                        "Caldaia tradizionale",
                        "Caldaia condensazione",
                        "Pompa di calore idronica",
                        "split",
                        "Ibrido (Caldaia e Pompa di Calore)",
                        "Bolitore elettrico",
                        "Altro"
                    ]
                }
            ],
            fuelTypes: [
                "Gas Naturale (Metano)",
                "GPL",
                "Gasolio",
                "Olio combustibile",
                "Pellet",
                "Cippato di legna",
                "Biogas",
                "Biodiesel",
                "Elettrico",
                "Energia termica"
            ],
            electricitySupplies: [
                "Elettrico - mix generico",
                "Elettrico - 100% rinnovabili"
            ]
        }
    ];

    const generatorOptions = options[0].generatorTypes.find(
        (gen) => gen.type === plantType
    )?.options || [];

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
                            <span className="block mb-2">L'edificio è dotato di servizio di</span>
                            <select
                                value={serviceType}
                                onChange={handleServiceTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di servizio</option>
                                {options[0].serviceTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Tipo di impianto</span>
                            <select
                                value={plantType}
                                onChange={handlePlantTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Tipo di impianto</option>
                                {options[0].plantTypes.map((cat, index) => (
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
                                {generatorOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
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
                                {options[0].fuelTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        {/*
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Quantità (metano e biogas [SMC], biodiesel e GPL [litri], olio e cippato [ton], pellet [kg])</span>
                            <input
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                min="1"
                            />
                        </label>*/}
                    </div>

                    {/*<div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Fornitura di elettricità</span>
                            <select
                                value={electricitySupply}
                                onChange={handleElectricitySupplyChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di fornitura elettrica</option>
                                {options[0].electricitySupplies.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>*/}
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
