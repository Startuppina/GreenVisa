import React, { useState, useEffect } from "react";
import axios from "axios";
import SolarForm from "./solarForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";

function Solars() {
    const [solars, setSolars] = useState([]);
    const [numSolars, setNumSolars] = React.useState(0);
    const [showSolarForm, setShowSolarForm] = React.useState(false);

    const [solarToDelete, setSolarToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const { buildingID, refresh } = useRecoveryContext();

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
                console.log('Error fetching plants:', error);
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
            }
        } catch (error) {
            console.log(error);
        }
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
            <div className=" bg-[#D9D9D9] rounded-lg mx-2 md:mx-14">
                <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Impianti Solari termici</h1>

                {numSolars === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun impianto solare presente</div>
                        <button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowSolarForm(!showSolarForm)}>Aggiungi un impianto solare</button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col mx-4 h-auto overflow-y-auto mb-4">
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
                                    <div className="flex justify-end">
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

                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <button className="p-2 mb-4 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowSolarForm(!showSolarForm)}>Aggiungi un impianto solare</button>
                        </div>
                    </>
                )}
            </div>
            {showSolarForm && <div className="pb-1"><SolarForm /></div>}

        </div>
    );

}

export default Solars