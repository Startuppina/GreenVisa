import React, { useState, useEffect } from "react";
import axios from "axios";
import PhotoForm from "./photoForm";
import { useRecoveryContext } from "../provider/provider";
import ConfirmPopUp from "./confirmPopUp";

function Photovoltaics() {
    const [photovoltaics, setPhotovoltaics] = useState([]);
    const [numPhoto, setNumPhoto] = React.useState(0);
    const [showPhotoForm, setShowPhotoForm] = React.useState(false);


    const [photoToDelete, setPhotoToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const { buildingID, refresh } = useRecoveryContext();

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
                console.log('Error fetching photos:', error);
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
                onButtonClick={deletePhotovoltaic}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <div className=" bg-[#D9D9D9] rounded-lg mx-2 md:mx-14">
                <h1 className="text-2xl font-bold mb-2 text-center lg:text-left p-4">Impianti fotovoltaici</h1>

                {numPhoto === 0 ? (
                    <div className="flex flex-col items-center justify-center pb-4">
                        <div className="text-center pb-4">Nessun impianto fotovoltaico presente</div>
                        <button className="p-2 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowPhotoForm(!showPhotoForm)}>Aggiungi un impianto fotovoltaico</button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col mx-4 h-auto overflow-y-auto mb-4">
                            {photovoltaics.map((photo) => (
                                <div
                                    className="w-full rounded-lg p-4 bg-white shadow-md mb-4"
                                    key={photo.id}
                                >
                                    <div className="">
                                        <strong>Potenza installata:</strong> {photo.power} KW
                                    </div>
                                    <div className="flex justify-end">
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

                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <button className="p-2 mb-4 w-auto bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] mx-auto" onClick={() => setShowPhotoForm(!showPhotoForm)}>Aggiungi un impianto fotovoltaico</button>
                        </div>
                    </>
                )}
                {showPhotoForm && <div className="pb-1"><PhotoForm /></div>}
            </div>
        </div>
    );

}

export default Photovoltaics