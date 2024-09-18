import React, { useState, useEffect } from "react";
import axios from "axios";
import PhotoForm from "./photoForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";
import MessagePopUp from "./messagePopUp";

function Photovoltaics() {
    const [photovoltaics, setPhotovoltaics] = useState([]);
    const [numPhoto, setNumPhoto] = React.useState(0);
    const [showPhotoForm, setShowPhotoForm] = React.useState(false);
    const [showPhotoFormModifier, setShowPhotoFormModifier] = React.useState(null);


    const [photoToDelete, setPhotoToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const { buildingID, refresh, triggerRefresh } = useRecoveryContext();

    useEffect(() => {
        const fetchPhotos = async () => {
            const token = localStorage.getItem("token");
            const id = buildingID;
            if (!id) {
                console.log('No building ID available');
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8080/api/buildings/${id}/fetch-photovoltaics`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Photos data:', response.data); // Log the response data
                if (response.status === 200) {
                    setPhotovoltaics(response.data.photos);
                    setNumPhoto(response.data.count);
                }
            } catch (error) {
                setMessagePopup('Errore durante il recupero degli impianti fotovoltaici');
                setButtonPopup(true);
            }
        };
        fetchPhotos();
    }, [buildingID, refresh]); // Ensure buildingID is included as a dependency


    const deletePhotovoltaic = async () => {
        const token = localStorage.getItem('token');
        const { id } = photoToDelete;
        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-photovoltaic/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatedPhoto = photovoltaics.filter(photo => photo.id !== id);
                setPhotovoltaics(updatedPhoto);
                setNumPhoto(updatedPhoto.length);
                setPopupConfirmDelete(false);
                setMessagePopup('Impianto fotovoltaico eliminato con successo');
                setButtonPopup(true);

                triggerRefresh();
            }
        } catch (error) {
            setMessagePopup('Errore durante l\'eliminazione dell\'impianto fotovoltaico');
            setButtonPopup(true);
        }
    };

    const cancelEdit = () => {
        setShowPhotoFormModifier(null);
    };

    return (
        <div className="text-arial text-xl mt-4 mb-4">
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deletePhotovoltaic}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className=" bg-[#D9D9D9] rounded-lg mx-2 md:mx-14">
                <div className="flex flex-row justify-between">
                    <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Impianti fotovoltaici</h1>
                    <div className="flex flex-col items-center justify-center m-2">
                        <button
                            className="p-2 mb-4 w-12 h-12 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                            onClick={() => setShowPhotoForm(!showPhotoForm)}
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

                {numPhoto === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun impianto fotovoltaico presente</div>
                        {/*<button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowPhotoForm(!showPhotoForm)}>Aggiungi un impianto fotovoltaico</button>*/}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col mx-4 max-h-[70vh] overflow-y-auto mb-4">
                            {photovoltaics.map((photo, index) => (
                                <div
                                    className="w-full rounded-lg p-4 bg-white shadow-md mb-4"
                                    key={index}
                                >
                                    <div className="">
                                        <strong>Potenza installata:</strong> {photo.power} KW
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className='p-2 w-24 z-10 mt-3 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]'
                                            onClick={() => setShowPhotoFormModifier(showPhotoFormModifier === photo.id ? null : photo.id)}                                    >
                                            {showPhotoFormModifier === photo.id ? 'Annulla' : 'Modifica'}
                                        </button>
                                        <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                            onClick={() => {
                                                setPhotoToDelete({
                                                    id: photo.id,
                                                });
                                                setMessageConfirm(
                                                    "Sei sicuro di voler eliminare questo impianto solare?"
                                                );
                                                setPopupConfirmDelete(true);
                                            }}>
                                            Elimina
                                        </button>
                                    </div>
                                    {showPhotoFormModifier === photo.id && <PhotoForm photo={photo} isEdit={true} onButtonClick={cancelEdit} />}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {showPhotoForm && <div className="flex justify-center"><PhotoForm allPhotosData={photovoltaics} photo="empty" isEdit={false} /></div>}

        </div>
    );

}

export default Photovoltaics