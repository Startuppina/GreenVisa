import React, { useState, useEffect } from "react";
import axios from "axios";
import PlantForm from "./plantForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";

function Plants() {
    const [plants, setPlants] = useState([]); // Inizializzato come array vuoto
    const [numPlants, setNumPlants] = useState(0);
    const [showPlantForm, setShowPlantForm] = useState(false);
    const [showPlantFormModifier, setShowPlantFormModifier] = useState(null);

    const [plantsToDelete, setPlantsToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");


    const { buildingID, refresh, triggerRefresh } = useRecoveryContext();

    useEffect(() => {

        const fetchPlants = async () => {
            const token = localStorage.getItem("token");
            const id = buildingID;
            if (!id) {
                console.log('No building ID available');
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8080/api/buildings/${id}/fetch-plants`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Plants data:', response.data); // Log the response data
                if (response.status === 200) {
                    setPlants(response.data.plants); // Controllo aggiuntivo
                    setNumPlants(response.data.count);


                }
            } catch (error) {
                setMessagePopup('Errore durante il recupero degli impianti');
                setButtonPopup(true);
            }
        };
        fetchPlants();
    }, [buildingID, refresh]); // Added buildingID as a dependency, also plantrigger as a dependency

    const deletePlant = async () => {
        const token = localStorage.getItem('token');
        const { id } = plantsToDelete;
        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-plant/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatedPlants = plants.filter((plant) => plant.id !== id);
                setPlants(updatedPlants);
                setNumPlants(updatedPlants.length);
                setPopupConfirmDelete(false);
                triggerRefresh();
            }
        } catch (error) {
            setMessageConfirm('Errore durante l\'eliminazione dell\'impianto');
            setButtonPopup(true);
        }
    };

    const cancelEdit = () => {
        setShowPlantFormModifier(null);
        setShowPlantForm(false);
    };

    return (
        <div className="text-arial text-xl mt-4 mb-4">
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deletePlant}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup} >
                {messagePopup}
            </MessagePopUp>
            <div className=" bg-[#D9D9D9] rounded-lg mx-14">
                <div className="flex flex-row justify-between">
                    <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Impianti</h1>
                    <div className="flex flex-col items-center justify-center m-2">
                        <button
                            className="p-2 mb-4 w-12 h-12 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                            onClick={() => setShowPlantForm(!showPlantForm)}
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

                {numPlants === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun impianto presente</div>
                        {/*<button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowPlantForm(!showPlantForm)}>Aggiungi un impianto</button>*/}
                    </div>
                ) : (
                    <div className="flex flex-col mx-4 max-h-[70vh] overflow-y-auto mb-4">
                        {plants.map((plant, index) => ( // Controllo per prevenire plants undefined
                            <div
                                className="w-full rounded-lg p-4 bg-white shadow-md mb-4"
                                key={plant.id}
                            >
                                <div className="">
                                    <strong>Descrizione:</strong> {plant.description}
                                </div>
                                <div className="">
                                    <strong>Tipo di impianto:</strong> {plant.plant_type}
                                </div>
                                <div className="">
                                    <strong>Tipo di servizio:</strong> {plant.service_type}
                                </div>
                                <div className="">
                                    <strong>Tipo di generatore:</strong> {plant.generator_type}
                                </div>
                                <div className="">
                                    <strong>Descrizione tipologia:</strong> {plant.generator_description}
                                </div>
                                <div className="">
                                    <strong>Punteggio assegnato alla tipologia di generatore (definito nella descrizione):</strong> {plant.generator_assigned_score}
                                </div>
                                <div className="">
                                    <strong>Elemento consumato dal generatore:</strong> {plant.fuel_type}
                                </div>
                                {/*<div className="">
                                    <strong>Quantità (metano e biogas [SMC], biodiesel e GPL [litri], olio e cippato [ton], pellet [kg]):</strong> {plant.quantity}
                                </div>
                                <div className="">
                                    <strong>Fornitura elettrica per altri servizi nell'edificio:</strong> {plant.electricity_supply}
                                </div>
                                <div className="mt-10">
                                    <strong className="text-red-500">PUNTEGGIO DI ECOSOSTENIBILITA:</strong> {parseFloat(plant.plantscore) + parseFloat(plant.generator_assigned_score)}
                                </div>*/}
                                <div className="flex justify-end gap-2">
                                    <button className='p-2 w-24 z-10 mt-3 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]'
                                        onClick={() => setShowPlantFormModifier(showPlantFormModifier === plant.id ? null : plant.id)}                                    >
                                        {showPlantFormModifier === plant.id ? 'Annulla' : 'Modifica'}
                                    </button>
                                    <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                        onClick={() => {
                                            setPlantsToDelete({
                                                id: plant.id,
                                            });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questo impianto solare?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}>
                                        Elimina
                                    </button>
                                </div>
                                {showPlantFormModifier === plant.id && <PlantForm plant={plant} isEdit={true} onButtonClick={cancelEdit} />}
                            </div>
                        ))}
                    </div>

                )}

            </div>
            {showPlantForm && (<div className="flex justify-center"><PlantForm plant="empty" isEdit={false} onButtonClick={cancelEdit} /></div>)}
        </div >
    );
}

export default Plants;