import React, { useState } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useRecoveryContext } from "../provider/provider";

function PhotoForm() {
    const [power, setPower] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { buildingID, triggerRefresh } = useRecoveryContext();

    // Funzione per calcolare il punteggio di ecosostenibilità
    const calculatePowerScore = (power) => {
        if (power <= 0) {
            return 0;
        } else if (power <= 10) {
            return 19; // Punteggio fisso per potenza fino a 5 kW
        } else if (power >= 11 && power <= 20) {
            return 16; // Punteggio fisso per potenza da 6 a 10 kW
        } else if (power >= 21 && power <= 30) {
            return 13; // Punteggio fisso per potenza da 11 a 20 kW
        } else {
            return 10; // Punteggio fisso per potenza superiore a 20 kW
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem("token");
        const id = buildingID;

        const formData = {
            power: parseFloat(power),
            photoScore: calculatePowerScore(power)  // Calcolo e aggiunta del punteggio di ecosostenibilità
        };

        try {
            const response = await axios.post(`http://localhost:8080/api/buildings/${id}/upload/photovoltaic`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
                setPower(""); // Clear form field

                triggerRefresh();

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

    const handlePowerChange = (e) => setPower(e.target.value);

    return (
        <div className="w-full mx-2">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">
                <h2 className="text-2xl font-bold text-center mb-6">Inserisci un nuovo impianto fotovoltaico</h2>
                <form onSubmit={handleSubmit} className="flex flex-col">

                    <div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Potenza installata (KW)</span>
                            <input
                                type="number"
                                value={power}
                                onChange={handlePowerChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                min="0.01"
                                step="0.01"
                            />
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

export default PhotoForm;
