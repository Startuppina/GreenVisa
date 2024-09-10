import React, { useState, useEffect } from "react";
import axios from "axios";
import SolarForm from "./solarForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";

function Solars() {
    const [solars, setSolars] = useState([]);
    const [numSolars, setNumSolars] = React.useState(0);
    const [showSolarForm, setShowSolarForm] = React.useState(false);

    const [showSolarFormModifier, setShowSolarFormModifier] = React.useState(false);

    const [solarToDelete, setSolarToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { buildingID, refresh, triggerRefresh } = useRecoveryContext();

    useEffect(() => {
        const fetchSolars = async () => {
            const token = localStorage.getItem("token");
            const id = buildingID;
            if (!id) {
                console.log('No building ID available');
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8080/api/buildings/${id}/fetch-solars`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Plants data:', response.data); // Log the response data
                if (response.status === 200) {
                    setSolars(response.data.solars);
                    setNumSolars(response.data.count);
                }
            } catch (error) {
                setMessagePopup('Errore durante il recupero degli impianti solari');
                setButtonPopup(true);
            }
        };
        fetchSolars();
    }, [buildingID, refresh]); // Ensure buildingID is included as a dependency


    const deleteSolar = async () => {
        const token = localStorage.getItem('token');
        const { id } = solarToDelete;
        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-solar/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatesSolars = solars.filter(solar => solar.id !== id);
                setSolars(updatesSolars);
                setNumSolars(updatesSolars.length);
                setPopupConfirmDelete(false);

                triggerRefresh();
            }
        } catch (error) {
            setMessagePopup('Errore durante la cancellazione dell\'impianto solare');
            setButtonPopup(true);
        }
    };

    const cancelEdit = () => {
        console.log('Cancellazione annullata');
        setShowSolarFormModifier(false);
    };

    return (
        <div className="text-arial text-xl mt-4 mb-4">
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteSolar}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup} >
                {messagePopup}
            </MessagePopUp>
            <div className=" bg-[#D9D9D9] rounded-lg mx-2 md:mx-14">
                <div className="flex flex-row justify-between">
                    <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Impianti Solari termici</h1>
                    <div className="flex flex-col items-center justify-center m-2">
                        <button
                            className="p-2 mb-4 w-12 h-12 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                            onClick={() => setShowSolarForm(!showSolarForm)}
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

                {numSolars === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun impianto solare presente</div>
                        <button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowSolarForm(!showSolarForm)}>Aggiungi un impianto solare</button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col mx-4 max-h-[70vh] overflow-y-auto mb-4">
                            {solars.map((solar) => (
                                <div
                                    className="w-full rounded-lg p-4 bg-white shadow-md mb-4"
                                    key={solar.id}
                                >
                                    <div className="">
                                        <strong>Quantita installata:</strong> {solar.installed_area} m²
                                    </div>
                                    <div className="mt-10">
                                        <strong className="text-red-500">PUNTEGGIO DI ECOSOSTENIBILITA:</strong> {solar.solarscore}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className='p-2 w-24 z-10 mt-3 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]'
                                            onClick={() => setShowSolarFormModifier(showSolarFormModifier === solar.id ? null : solar.id)}                                    >
                                            {showSolarFormModifier === solar.id ? 'Annulla' : 'Modifica'}
                                        </button>
                                        <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                            onClick={() => {
                                                setSolarToDelete({
                                                    id: solar.id,
                                                });
                                                setMessageConfirm(
                                                    "Sei sicuro di voler eliminare questo impianto solare?"
                                                );
                                                setPopupConfirmDelete(true);
                                            }}>
                                            Elimina
                                        </button>
                                    </div>

                                    {showSolarFormModifier === solar.id && <SolarForm solar={solar} isEdit={true} onButtonClick={cancelEdit} />}

                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {showSolarForm && <div className="pb-1"><SolarForm solar="empty" isEdit={false} /></div>}

        </div>
    );

}

export default Solars