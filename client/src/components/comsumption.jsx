import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import MessagePopUp from "./messagePopUp";
import ConsumptionForm from "./consumptionForm";
import ConfirmPopUp from "./confirmPopUp";

function Consumption() {
    const [consumptionData, setConsumptionData] = useState([]);
    const [showConsumptionForm, setShowConsumptionForm] = useState(false); // [showConsumptionForm]
    const [buttonPopUp, setButtonPopUp] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const { buildingID, refresh } = useRecoveryContext();

    const [consumptionToDelete, setConsumptionToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');
    const [showConsumptionFormModifier, setShowConsumptionFormModifier] = useState(false);

    useEffect(() => {

        const fetchConsumptionData = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`http://localhost:8080/api/${buildingID}/fetch-consumption-data`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setConsumptionData(response.data.consumptions);
                    console.log(response.data.consumptions);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchConsumptionData();

    }, [refresh]);

    const deleteConsumption = async () => {
        const token = localStorage.getItem('token');
        const { id } = consumptionToDelete;

        console.log("Consumption ID to delete:", id);

        try {
            const response = await axios.delete(`http://localhost:8080/api/${buildingID}/delete-consumption/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                const updatedConsumptions = consumptionData.filter((consumption) => consumption.id !== id);
                setConsumptionData(updatedConsumptions);
                setMessagePopUp(response.data.msg);
                setPopupConfirmDelete(false);
                setButtonPopUp(true);
            } else {
                console.log('Error:', response.data.msg);
                setMessageConfirm(response.data.msg);
                setPopupConfirmDelete(false);
                setButtonPopUp(true);
            }
        } catch (error) {
            setMessagePopUp('Errore durante l\'eliminazione del consumo');
            setButtonPopUp(true);
        }
    };

    const cancelEdit = () => {
        setShowConsumptionFormModifier(null);
        setShowConsumptionForm(false);
    };


    return (
        <div className="text-arial text-xl mt-4 mb-4">
            <MessagePopUp trigger={buttonPopUp} setTrigger={setButtonPopUp}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteConsumption}
            >
                {messageConfirm}
            </ConfirmPopUp>

            <div className="bg-[#D9D9D9] rounded-lg mx-2 lg:mx-14 p-4">
                <div className="flex flex-row justify-between">
                    <h1 className="text-2xl font-bold mb-4 text-center">Consumi annui caricati</h1>
                    <div className="flex flex-col items-center justify-center m-2">
                        <button
                            className="p-2 mb-4 w-12 h-12 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                            onClick={() => setShowConsumptionForm(!showConsumptionForm)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>


                {/* Consumi Caricati */}
                {consumptionData.length === 0 ? (
                    <div className="text-center">Nessun consumo caricato</div>
                ) : (
                    <div className="flex flex-col h-auto overflow-y-auto mb-4">
                        {consumptionData.map((data, index) => (
                            <div className="w-full rounded-lg p-4 bg-white shadow-md mb-4" key={index}>
                                <div>
                                    <strong>Fonte:</strong> {data.energy_source}
                                </div>
                                <div>
                                    <strong>Consumo:</strong> {data.consumption}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button className='p-2 w-24 z-10 mt-3 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]'
                                        onClick={() => setShowConsumptionFormModifier(showConsumptionFormModifier === data.id ? null : data.id)}                                    >
                                        {showConsumptionFormModifier === data.id ? 'Annulla' : 'Modifica'}
                                    </button>
                                    <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                        onClick={() => {
                                            setConsumptionToDelete({
                                                id: data.id,
                                            });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questo consumo annuale?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}>
                                        Elimina
                                    </button>
                                </div>
                                {showConsumptionFormModifier === data.id && <ConsumptionForm data={data} isEdit={true} onButtonClick={cancelEdit} />}
                            </div>
                        ))}
                    </div>
                )}

            </div>
            {showConsumptionForm && (
                <ConsumptionForm allConsumptionsData={consumptionData} data="empty" isEdit={false} onButtonClick={cancelEdit} />
            )
            }
        </div >
    );
}

export default Consumption;
