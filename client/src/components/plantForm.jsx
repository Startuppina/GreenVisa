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
    const [isLoading, setIsLoading] = useState(false);
    const [hasGasLeak, setHasGasLeak] = useState(false);
    const [refrigerantGases, setRefrigerantGases] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { buildingID, triggerRefresh } = useRecoveryContext();

    const navigate = useNavigate();

    const handleUpdatePlant = async () => {
        const id = buildingID;
        let formData;

        if (hasGasLeak) {
            const validGases = refrigerantGases.filter(gas => gas.type.trim() !== "" && gas.quantity !== "" && !isNaN(Number(gas.quantity)) && Number(gas.quantity) > 0);
            if (validGases.length === 0) {
                setMessagePopup("Devi inserire almeno un gas refrigerante. Altrimenti rimuovi la spunta");
                setButtonPopup(true);
                setIsLoading(false);
                return;
            }
            formData = {
                description,
                plantType,
                serviceType,
                generatorType,
                generatorDescription: generatorType === "Altro" ? generatorDescription : "",
                fuelType,
                hasGasLeak,
                refrigerantGases: validGases
            };
        } else {
            formData = {
                description,
                plantType,
                serviceType,
                generatorType,
                generatorDescription: generatorType === "Altro" ? generatorDescription : "",
                fuelType,
            };
        }

        try {
            const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/buildings/${id}/update/plant/${plant.id}`, formData, {
                withCredentials: true
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

        ;
        const id = buildingID;
        let formData;

        console.log('hasGasLeak:', hasGasLeak);
        console.log('refrigerantGases:', refrigerantGases);

        if (hasGasLeak) {
            const validGases = refrigerantGases.filter(gas => gas.type.trim() !== "" && gas.quantity !== "" && !isNaN(Number(gas.quantity)) && Number(gas.quantity) > 0);
            if (validGases.length === 0) {
                setMessagePopup("Devi inserire almeno un gas refrigerante. Altrimenti rimuovi la spunta");
                setButtonPopup(true);
                setIsLoading(false);
                return;
            }
            formData = {
                description,
                plantType,
                serviceType,
                generatorType,
                generatorDescription: generatorType === "Altro" ? generatorDescription : "",
                fuelType,
                hasGasLeak,
                refrigerantGases: validGases
            };
        } else {
            formData = {
                description,
                plantType,
                serviceType,
                generatorType,
                generatorDescription: generatorType === "Altro" ? generatorDescription : "",
                fuelType,
            };
        }


        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/buildings/${id}/upload/plant`, formData, {
                withCredentials: true
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
                    setRefrigerantGases([]);

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
                    serviceSpecificOptions: {
                        "Riscaldamento": [
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
                        ],
                        "Raffrescamento": [
                            "Pompa di calore idronica",
                            "Altro"
                        ],
                        "Acqua calda sanitaria": [
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
                        ],
                        "Altra produzione termica": [
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
                    }
                },
                {
                    type: "Autonomo",
                    serviceSpecificOptions: {
                        "Riscaldamento": [
                            "Caldaia tradizionale",
                            "Caldaia condensazione",
                            "Pompa di calore idronica",
                            "Split",
                            "Ibrido (Caldaia e Pompa di Calore)",
                            "Bolitore elettrico",
                            "Altro"
                        ],
                        "Raffrescamento": [
                            "Pompa di calore idronica",
                            "Split",
                            "Altro"
                        ],
                        "Acqua calda sanitaria": [
                            "Caldaia tradizionale",
                            "Caldaia condensazione",
                            "Pompa di calore idronica",
                            "Ibrido (Caldaia e Pompa di Calore)",
                            "Bolitore elettrico",
                            "Altro"
                        ],
                        "Altra produzione termica": [
                            "Caldaia tradizionale",
                            "Caldaia condensazione",
                            "Pompa di calore idronica",
                            "Ibrido (Caldaia e Pompa di Calore)",
                            "Bolitore elettrico",
                            "Altro"
                        ]
                    }
                }
            ],
            fuelTypes: [
                "Gas Naturale (Metano)",
                "GPL",
                "Gasolio",
                "Benzina",
                "Olio combustibile",
                "Pellet",
                "Cippato di legna",
                "Biogas",
                "Elettricità",
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

    const gasNames = [
        "Idrogeno verde - zero emissioni",
        "R1233ZD",
        "R1234YF",
        "R1234ZE",
        "R125A",
        "R134A",
        "R23",
        "R236FA",
        "R245FA",
        "R290",
        "R32",
        "R404A",
        "R407A",
        "R407C",
        "R407F",
        "R407H",
        "R408A",
        "R409A",
        "R410A",
        "R413A",
        "R417A",
        "R422A",
        "R422B",
        "R422D",
        "R427A",
        "R434A",
        "R437A",
        "R438A",
        "R448A",
        "R449A",
        "R450A",
        "R452A",
        "R452B",
        "R454A",
        "R454B",
        "R454C",
        "R455A",
        "R456A",
        "R507",
        "R508B",
        "R513A",
        "R515B",
        "R600a",
        "R744"
    ];

    const handleGasChange = (index, field, value) => {
        const updatedGases = [...refrigerantGases];
        updatedGases[index][field] = value;
        setRefrigerantGases(updatedGases);
    };

    const addGasField = () => {
        setRefrigerantGases([...refrigerantGases, { type: "", quantity: "" }]);
    };

    const removeGasField = (index) => {
        const updated = refrigerantGases.filter((_, i) => i !== index);
        setRefrigerantGases(updated);
    };

    // Nuovo handler per il checkbox gas leak
    const handleHasGasLeakChange = (e) => {
        setHasGasLeak(e.target.checked);
        if (e.target.checked && refrigerantGases.length === 0) {
            setRefrigerantGases([{ type: "", quantity: "" }]);
        }
        if (!e.target.checked) {
            setRefrigerantGases([]);
        }
    };



    return (
        <div className="w-full mx-auto flex justify-center">
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
                                {plantType && serviceType && options[0].generatorTypes
                                    .find(type => type.type === plantType)
                                    ?.serviceSpecificOptions[serviceType]?.map((option, index) => (
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
                    </div>


                    <div className="mb-6">
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={hasGasLeak}
                                onChange={handleHasGasLeakChange}
                                className="w-5 h-5"
                            />
                            <span className="text-lg">
                                Il seguente impianto ha disperso gas refrigeranti negli ultimi 12 mesi?
                            </span>
                        </label>
                    </div>


                    {hasGasLeak && (
                        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-300 shadow-inner">
                            <h3 className="text-xl font-semibold mb-4">Gas refrigeranti dispersi</h3>

                            {refrigerantGases.map((gas, index) => (
                                <div key={index} className="flex flex-col justify-center md:flex-row md:items-end md:gap-4 mb-4">
                                    <label className="flex flex-col w-full md:w-1/2">
                                        <span className="block mb-2">Tipo di gas</span>
                                        <select
                                            value={gas.type}
                                            onChange={(e) => handleGasChange(index, "type", e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                        >
                                            <option value="">Seleziona un gas</option>
                                            {gasNames.map((option, idx) => (
                                                <option key={idx} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="flex flex-col w-full md:w-1/3">
                                        <span className="block mb-2">Quantità (kg)</span>
                                        <input
                                            type="number"
                                            value={gas.quantity}
                                            onChange={(e) => handleGasChange(index, "quantity", e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                        />
                                    </label>


                                    <button
                                        type="button"
                                        onClick={() => removeGasField(index)}
                                        className="text-red-600 hover:text-red-800 mt-2 md:mt-0"
                                        title="Rimuovi"
                                    >
                                        Elimina
                                    </button>

                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addGasField}
                                className="text-[#2d7044] text-lg font-semibold hover:underline mt-2"
                            >
                                + Aggiungi un altro gas
                            </button>
                        </div>
                    )}


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
