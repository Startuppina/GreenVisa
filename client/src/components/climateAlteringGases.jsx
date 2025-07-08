import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ClimateGasAlteringForm from "./climateGasAlteringForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";

function ClimateAlteringGases() {

    const [gases, setGases] = useState([]); // Inizializzato come array vuoto
    const [numGases, setNumGases] = useState(0);
    const [showGasFrom, setShowGasFrom] = useState(false);
    const [showGasFormModifier, setShowGasFormModifier] = useState(null);

    const [gasToDelete, setGasToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { buildingID, refresh, triggerRefresh } = useRecoveryContext();

    // Crea una ref per il form
    const formRef = useRef(null);

    useEffect(() => {
        if (showGasFrom && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [showGasFrom]);


    useEffect(() => {

        const fetchGases = async () => {
            ;
            const id = buildingID;
            if (!id) {
                console.log('No building ID available');
                return;
            }
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/buildings/${id}/fetch-gases`, {
                    withCredentials: true
                });
                console.log('Gases data:', response.data); // Log the response data
                if (response.status === 200) {
                    setGases(response.data.gases); // Controllo aggiuntivo
                    setNumGases(response.data.count);


                }
            } catch (error) {
                setMessagePopup('Errore durante il recupero dei gas clima alteranti');
                setButtonPopup(true);
            }
        };
        fetchGases();
    }, [buildingID, refresh]); // Added buildingID as a dependency, also plantrigger as a dependency

    const deleteGas = async () => {

        const { id } = gasToDelete;
        try {
            const response = await axios.delete(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/delete-gas/${id}`, {
                withCredentials: true
            });

            if (response.status === 200) {
                const updatedGases = gases.filter((gas) => gas.id !== id);
                setGases(updatedGases);
                setNumGases(updatedGases.length);
                setPopupConfirmDelete(false);
                setMessagePopup('Gas clima alterante eliminato con successo');
                setButtonPopup(true);

                triggerRefresh();
            }
        } catch (error) {
            setMessagePopup('Errore durante l\'eliminazione dell gas clima alterante');
            setButtonPopup(true);
        }
    };

    const cancelEdit = () => {
        setShowGasFormModifier(null);
        setShowGasFrom(false);
    };

    return (
        <div className="text-arial text-xl mt-4 mb-4">
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteGas}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup} >
                {messagePopup}
            </MessagePopUp>
            <div className=" bg-[#D9D9D9] rounded-lg mx-2 lg:mx-14">
                <div className="flex flex-row justify-between">
                    <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Gas clima alteranti utilizzati per la produzione</h1>
                    <div className="flex flex-col items-center justify-center m-2">
                        <button
                            className="p-2 mb-4 w-12 h-12 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                            onClick={() => setShowGasFrom(!showGasFrom)}
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

                {numGases === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun gas clima alterante presente</div>
                        {/*<button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowPlantForm(!showPlantForm)}>Aggiungi un impianto</button>*/}
                    </div>
                ) : (
                    <div className="flex flex-col mx-4 max-h-[70vh] overflow-y-auto mb-4">
                        {gases.map((gas, index) => ( // Controllo per prevenire plants undefined
                            <div
                                className="w-full rounded-lg p-4 bg-white shadow-md mb-4"
                                key={gas.id}
                            >
                                <div className="">
                                    <strong>Tipologia:</strong> {gas.gas_type}
                                </div>
                                <div className="">
                                    {gas.plant_id ? (
                                        <span><strong>Quantità dispersa negli ultimi 12 mesi:</strong> {gas.quantity_kg}</span>
                                    ) : (
                                        <span><strong>Quantità consumata:</strong> {gas.quantity_kg}</span>
                                    )}
                                </div>

                                {gas.plant_id && (
                                    <div className="">
                                        <strong>Impianto:</strong> {gas.plant_name}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button className='p-2 w-24 z-10 mt-3 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]'
                                        onClick={() => setShowGasFormModifier(showGasFormModifier === gas.id ? null : gas.id)}                                    >
                                        {showGasFormModifier === gas.id ? 'Annulla' : 'Modifica'}
                                    </button>
                                    <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                        onClick={() => {
                                            setGasToDelete({
                                                id: gas.id,
                                            });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questo gas?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}>
                                        Elimina
                                    </button>
                                </div>
                                {showGasFormModifier === gas.id && <ClimateGasAlteringForm gas={gas} isEdit={true} onButtonClick={cancelEdit} />}
                            </div>
                        ))}
                    </div>

                )}

            </div>
            <div ref={formRef}>
                {showGasFrom && (<div className="flex justify-center"><ClimateGasAlteringForm gas="empty" isEdit={false} onButtonClick={cancelEdit} /></div>)}
            </div>
        </div >
    );
}

export default ClimateAlteringGases;