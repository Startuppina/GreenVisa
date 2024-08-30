import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";


function PlantForm() {
    const [description, setDescription] = useState("");
    const [plantType, setPlantType] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [generatorType, setGeneratorType] = useState("");
    const [generatorDescription, setGeneratorDescription] = useState("");
    const [fuelType, setFuelType] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [electricitySupply, setElectricitySupply] = useState("");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

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
            electricitySupply
        };

        try {
            const response = await axios.post(`http://localhost:8080/api/buildings/${id}/upload/plant`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);

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

    return (
        <div className="w-full mt-4">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">
                <h2 className="text-2xl font-bold text-center mb-6">Inserisci un nuovo impianto</h2>
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
                                {generatorTypes.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        {generatorType === "Altro" && (
                            <label className="flex flex-col w-full md:w-1/2">
                                <span className="block mb-2">Descrizione del generatore</span>
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

                    <button
                        type="submit"
                        className="mt-7 mx-auto font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex justify-center">
                                <MutatingDots
                                    height="100"
                                    width="100"
                                    color="#ffffff"
                                    secondaryColor="#ffffff"
                                    radius="12.5"
                                    ariaLabel="mutating-dots-loading"
                                    wrapperStyle={{}}
                                    wrapperClass=""
                                    visible={true}
                                />
                            </div>
                        ) : (
                            "Carica"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PlantForm;
