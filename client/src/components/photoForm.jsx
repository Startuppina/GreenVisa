import React, { useState } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useRecoveryContext } from "../provider/provider";

function PhotoForm({ photo = 'empty', isEdit, onButtonClick = 'empty' }) {
    const [power, setPower] = useState(photo.power || "");
    const [isLoading, setIsLoading] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');
    const { buildingID, triggerRefresh } = useRecoveryContext();

    const handleUpdatePhoto = async () => {
        const token = localStorage.getItem("token");
        const id = buildingID;

        const formData = {
            power: parseFloat(power),
        };

        try {
            const response = await axios.put(`http://localhost:8080/api/buildings/${id}/update-photovoltaic/${photo.id}`, formData, {
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
                    setPower(""); // Clear form field

                    triggerRefresh();

                }, 3000);

            } else if (response.status === 400) {
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
            handleUpdatePhoto();
            return;
        }

        const token = localStorage.getItem("token");
        const id = buildingID;

        const formData = {
            power: parseFloat(power),
        };

        try {
            const response = await axios.post(`http://localhost:8080/api/buildings/${id}/upload/photovoltaic`, formData, {
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
                    setPower(""); // Clear form field

                    triggerRefresh();

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

    const handlePowerChange = (e) => setPower(e.target.value);

    return (
        <div className="w-full mx-auto flex justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl bg-[#f6f3f3] mb-4">
                <h2 className="text-2xl font-bold text-center mb-6">{isEdit ? "Modifica fotovoltaico" : "Aggiungi un nuovo fotovoltaico"}</h2>
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
                            <div className=" w-full flex justify-center items-center mt-5 gap-3">
                                <button
                                    type="submit"
                                    className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 rounded-lg border-2 transition-colors duration-300 ease-in-out bg-[#2d7044] text-white border-transparent hover:border-[#2d7044] hover:bg-white hover:text-[#2d7044]"
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
            </div>
        </div>
    );
}

export default PhotoForm;
