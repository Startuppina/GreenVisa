import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";

function ConsumptionForm({ allConsumptionsData = "empty", data = 'empty', isEdit, onButtonClick }) {
    const { buildingID, triggerRefresh } = useRecoveryContext();
    const [electricityConsumption, setElectricityConsumption] = useState(data.energy_source === "Elettricità" ? data.consumption : "");
    const [otherConsumption, setOtherConsumption] = useState(data.energy_source !== "Elettricità" ? data.consumption : "");
    const [buttonPopUp, setButtonPopUp] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [userEnergies, setUserEnergies] = useState([]);
    const [selectedEnergy, setSelectedEnergy] = useState(isEdit && data.energy_source !== "Elettricità" ? data.energy_source : "");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingElectricity, setIsLoadingElectricity] = useState(false);

    const handleElectricityConsumptionChange = (e) => {
        setElectricityConsumption(e.target.value);
    }

    const handleOtherConsumptionChange = (e) => {
        setOtherConsumption(e.target.value);
    }

    const energyOptions = [
        { label: "Gas Naturale (Metano)", unit: "Sm³" },
        { label: "GPL", unit: "mc" },
        { label: "Gasolio", unit: "mc" },
        { label: "Benzina", unit: "lt" },
        { label: "Idrogeno", unit: "Smc" },
        { label: "Olio combustibile", unit: "t" },
        { label: "Pellet", unit: "t" },
        { label: "Cippato di legna", unit: "t" },
        { label: "Biogas", unit: "Sm³" },
        { label: "Energia termica", unit: "kWh" },
    ];


    useEffect(() => {
        const fetchUserEnergies = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/${buildingID}/fetch-user-energies`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setUserEnergies(response.data.energies);
                    console.log(response.data.energies);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchUserEnergies();

    }, [buildingID]);


    const handleElectricitySubmit = async (e) => {
        e.preventDefault();
        setIsLoadingElectricity(true);
        const consumption = {
            energy_source: "Elettricità",
            consumption: parseFloat(electricityConsumption)
        };

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/${buildingID}/add-consumption`, consumption, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopUp(response.data.msg);
                    setButtonPopUp(true);
                    setElectricityConsumption("");
                    setIsLoadingElectricity(false);

                    triggerRefresh();
                }, 3000);

            } else if (response.status === 400) {
                setMessagePopUp(response.data.msg); // Messaggio di errore specifico (e.g. consumo già aggiunto)
                setButtonPopUp(true);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setMessagePopUp(error.response.data.msg); // Messaggio di errore dal server
            } else {
                setMessagePopUp("Errore durante la connessione al server");
            }
            setButtonPopUp(true);
        }
    };

    const handleUpdateElectricityConsumption = async (e) => {
        e.preventDefault();
        setIsLoadingElectricity(true);
        const token = localStorage.getItem("token");

        const consumption = {
            energy_source: "Elettricità",
            consumption: parseFloat(electricityConsumption)
        };

        try {

            const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/${buildingID}/modify-consumption/${data.id}`, consumption, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopUp(response.data.msg);
                    setButtonPopUp(true);
                    setIsLoadingElectricity(false);

                    setElectricityConsumption("");

                    triggerRefresh(); // Aggiorna i dati
                }, 3000);

            } else if (response.status === 400) {
                setMessagePopUp(response.data.msg); // Messaggio di errore specifico (e.g. consumo più aggiunto)
                setButtonPopUp(true);
                setIsLoadingElectricity(false);
            }

        } catch (error) {
            if (error.response && error.response.data) {
                setMessagePopUp(error.response.data.msg); // Messaggio di errore dal server
            } else {
                setMessagePopUp("Errore durante la connessione al server");
            }
            setButtonPopUp(true);
            setIsLoadingElectricity(false);
        }
    }

    const handleOtherEnergySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const consumption = {
            energy_source: selectedEnergy,
            consumption: parseFloat(otherConsumption),
        };

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/${buildingID}/add-consumption`, consumption, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopUp(response.data.msg);
                    setButtonPopUp(true);
                    setSelectedEnergy("");
                    setOtherConsumption("");
                    setIsLoading(false);

                    triggerRefresh(); // Aggiorna i dati
                }, 3000);

            } else if (response.status === 400) {
                setMessagePopUp(response.data.msg); // Messaggio di errore specifico (e.g. consumo già aggiunto)
                setButtonPopUp(true);
                setIsLoading(false);

            }

        } catch (error) {
            // Cattura gli errori del server e mostra un messaggio di errore
            if (error.response && error.response.data) {
                setMessagePopUp(error.response.data.msg); // Messaggio di errore dal server
            } else {
                setMessagePopUp("Errore durante la connessione al server");
            }
            setButtonPopUp(true);
            setIsLoading(false);

        }
    };


    const handleUpdateOtherEnergyConsumption = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const consumption = {
            energy_source: selectedEnergy,
            consumption: parseFloat(otherConsumption),
        };

        try {

            const token = localStorage.getItem("token");
            const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/${buildingID}/modify-consumption/${data.id}`, consumption, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopUp(response.data.msg);
                    setButtonPopUp(true);
                    setIsLoading(false);

                    setOtherConsumption("");

                    triggerRefresh(); // Aggiorna i dati
                }, 3000);
            } else if (response.status === 400) {
                setMessagePopUp(response.data.msg); // Messaggio di errore specifico (e.g. consumo più aggiunto)
                setButtonPopUp(true);
                setIsLoading(false);

            }


        } catch (error) {
            if (error.response && error.response.data) {
                setMessagePopUp(error.response.data.msg); // Messaggio di errore dal server
            } else {
                setMessagePopUp("Errore durante la connessione al server");
            }
            setButtonPopUp(true);
            setIsLoading(false);

        }
    }


    return (
        <div className="w-[99%] mx-auto flex justify-center">
            <MessagePopUp trigger={buttonPopUp} setTrigger={setButtonPopUp}>
                {messagePopUp}
            </MessagePopUp>
            <div className="w-full mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-4 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">

                {/* Modalità modifica */}
                {isEdit && (
                    <>
                        {data.energy_source === "Elettricità" ? (
                            <>
                                <h1 className="text-xl font-bold mb-4 text-center">Modifica Consumo Elettricità</h1>
                                <form onSubmit={handleUpdateElectricityConsumption}>
                                    <input
                                        type="number"
                                        value={electricityConsumption}
                                        onChange={handleElectricityConsumptionChange}
                                        placeholder="Inserisci il consumo in kWh"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                        required
                                    />
                                    <div className="flex justify-center">
                                        {isLoadingElectricity ? (
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
                                            <div className="w-full flex flex-col md:flex-row justify-center items-center mt-5 gap-3">
                                                <button
                                                    type="submit"
                                                    className="font-arial text-xl w-[60%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                                >
                                                    Salva
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onButtonClick}
                                                    className=" font-arial text-xl w-[60%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-gray-500 text-white rounded-lg border-2 border-transparent hover:border-gray-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-gray-500"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold mb-4 text-center">Modifica Consumo {data.energy_source}</h1>
                                <form onSubmit={handleUpdateOtherEnergyConsumption}>
                                    <input
                                        type="number"
                                        value={otherConsumption}
                                        onChange={handleOtherConsumptionChange}
                                        placeholder={`Inserisci il consumo in ${energyOptions.find(opt => opt.label === data.energy_source)?.unit}`}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg block w-full p-2.5 mb-4"
                                        required
                                    />
                                    <div className="flex justify-center">
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
                                            <div className="w-full flex flex-col md:flex-row justify-center items-center mt-5 gap-3">
                                                <button
                                                    type="submit"
                                                    className="font-arial text-xl w-[60%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                                >
                                                    Salva
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onButtonClick}
                                                    className=" font-arial text-xl w-[60%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-gray-500 text-white rounded-lg border-2 border-transparent hover:border-gray-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-gray-500"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </>
                        )}
                    </>
                )}

                {/* Modalità inserimento */}
                {!isEdit && (
                    <>
                        <h1 className="text-xl font-bold mb-4 text-center">Inserisci Nuovo Consumo</h1>
                        <p className="text-red-500 text-center mb-4">ATTENZIONE: per ogni fonte di energia portai caricare il consumo solo una volta, ma potrai modificare il consumo una volta caricato</p>

                        {/* Form per Elettricità */}
                        <h2 className="text-lg font-bold mb-2">Consumo Elettricità (richiesto)</h2>
                        <form onSubmit={handleElectricitySubmit}>
                            <input
                                type="number"
                                value={electricityConsumption}
                                onChange={(e) => setElectricityConsumption(e.target.value)}
                                placeholder="Inserisci il consumo in kWh"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-4"
                                required
                            />
                            <div className="flex justify-center">

                                {isLoadingElectricity ? (
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
                                    <div className="w-full flex justify-center items-center mt-5 gap-3">
                                        <button
                                            type="submit"
                                            disabled={allConsumptionsData.some(consumption => consumption.energy_source === "Elettricità")}
                                            className={`mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 rounded-lg border-2 transition-colors duration-300 ease-in-out ${allConsumptionsData.some(consumption => consumption.energy_source === "Elettricità")
                                                ? 'bg-gray-300 text-gray-700 cursor-not-allowed border-gray-300'
                                                : 'bg-[#2d7044] text-white border-transparent hover:border-[#2d7044] hover:bg-white hover:text-[#2d7044]'
                                                }`}                                        >
                                            {allConsumptionsData.some(consumption => consumption.energy_source === "Elettricità") ? "Disabilitato" : "Carica"}
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

                            </div>
                        </form>

                        {/* Form per altri consumi */}
                        <h2 className="text-lg font-bold mt-6 mb-2">Altri Consumi Energetici</h2>
                        <form onSubmit={handleOtherEnergySubmit}>
                            <select
                                value={selectedEnergy}
                                onChange={(e) => setSelectedEnergy(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-4"
                                required
                            >
                                <option value="" disabled>Seleziona una fonte energetica</option>
                                {userEnergies.map((option, index) => (
                                    <option key={index} value={option.fuel_type}>
                                        {option.fuel_type}
                                    </option>
                                ))}
                            </select>

                            {selectedEnergy && (
                                <input
                                    type="number"
                                    value={otherConsumption}
                                    onChange={(e) => setOtherConsumption(e.target.value)}
                                    placeholder={`Inserisci il consumo in ${energyOptions.find(opt => opt.label === selectedEnergy)?.unit}`}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg block w-full p-2.5 mb-4"
                                    required
                                />
                            )}

                            <div className="flex justify-center">
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
                                    <div className="w-full flex justify-center items-center mt-5 gap-3">
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
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div >
    );

}

export default ConsumptionForm;