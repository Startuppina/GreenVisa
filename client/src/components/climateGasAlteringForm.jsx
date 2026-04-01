import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";


function ClimateGasAlteringForm({ gas = 'empty', isEdit, onButtonClick }) {
    const [type, setType] = useState(gas.gas_type || "");
    const [quantityKg, setQuantityKg] = useState(gas.quantity_kg || "");
    const [isLoading, setIsLoading] = useState(false);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { buildingID, triggerRefresh } = useRecoveryContext();

    const navigate = useNavigate();

    const handleUpdateGas = async () => {
        ;
        const id = buildingID;

        const formData = {
            type,
            quantityKg,
        };

        try {
            const response = await axios.put(`/api/buildings/${id}/update/gas/${gas.id}`, formData, {
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
            handleUpdateGas();
            return;
        }

        ;
        const id = buildingID;

        const formData = {
            type,
            quantityKg,
        };


        try {
            const response = await axios.post(`/api/buildings/${id}/upload/gas`, formData, {
                withCredentials: true
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopup(response.data.msg);
                    setButtonPopup(true);
                    setIsLoading(false);

                    // Reset dei dati del modulo
                    setType("");
                    setQuantityKg("");

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

    const handleTypeChange = (e) => setType(e.target.value);
    const handlequantityKgChange = (e) => setQuantityKg(e.target.value);

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

    /*
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
    )?.options || [];*/

    return (
        <div className="w-full mx-auto flex justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-full mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">
                <h2 className="text-2xl font-bold text-center mb-6">{isEdit ? "Modifica gas clima alterante" : "Aggiungi un gas clima alterante"}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col">

                    <div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Tipologia</span>
                            <select
                                value={type}
                                onChange={handleTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Tipologia</option>
                                {gasNames.map((gasName) => (
                                    <option key={gasName} value={gasName}>
                                        {gasName}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Consumo annuo</span>
                            <input
                                type="text"
                                value={quantityKg}
                                onChange={handlequantityKgChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                        {/* <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Unità di misura</span>
                            <select
                                value={unitType}
                                onChange={handleUnitTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona l'unità di misura del gas selezionato</option>
                                <option value="kg_CO2e">kg CO₂e</option>
                                <option value="ton_CO2e">ton CO₂e</option>
                                <option value="g_CH4">g CH₄</option>
                                <option value="kg_CH4">kg CH₄</option>
                                <option value="g_N2O">g N₂O</option>
                                <option value="kg_N2O">kg N₂O</option>
                                <option value="ppm">ppm</option>
                                <option value="ppb">ppb</option>
                            </select>

                        </label> */}
                    </div>

                    {/* <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Utilizzo</span>
                            <select
                                value={usage}
                                onChange={handleUsageChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona il contesto di utilizzo del gas</option>
                                <option value="Produzione">Produzione</option>
                            </select>
                        </label>
                    </div> */}

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

export default ClimateGasAlteringForm;
