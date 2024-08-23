import React, { useState, useEffect } from "react";
import axios from "axios";
import ConfirmPopUp from "./confirmPopUp";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";

function PromoCodes() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [visibleDetails, setVisibleDetails] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState("");
    const [promoCodeToDelete, setPromoCodeToDelete] = useState(0);

    const [promoCodeToPublish, setPromoCodeToPublish] = useState(null);
    const [popupConfirmPublish, setPopupConfirmPublish] = useState(false);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchPromoCodes = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await axios.get("http://localhost:8080/api/fetch-promo-codes", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200 && Array.isArray(response.data.promocodes)) {
                    setPromoCodes(response.data.promocodes.map(code => ({
                        ...code,
                        start: formatDate(code.start), // Formatta la data di inizio
                        expiration: formatDate(code.expiration) // Formatta la data di scadenza
                    })));
                    navigate("/User");
                }
                
            } catch (error) {
                console.error(error);
            }
        };
        fetchPromoCodes();
    }, []);

    const formatDate = (isoDateString) => {
        const date = new Date(isoDateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const handleToggleDetails = (id) => {
        setVisibleDetails(prevId => prevId === id ? null : id);
    };

    const deleteCode = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-promo-code/${promoCodeToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setPromoCodes(prevPromoCodes => 
                    prevPromoCodes.filter(code => code.id !== promoCodeToDelete)
                );
                setPopupConfirmDelete(false);  // Chiudi il popup di conferma
                setPromoCodeToDelete(null);
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };
    

    const publishCode = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.post(`http://localhost:8080/api/publish-promo-code/${promoCodeToPublish}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setPopupConfirmPublish(false);  // Chiudi il popup di conferma
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
                setPromoCodeToPublish(null);
            }
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <div className="p-4 flex flex-wrap justify-center items-center bg-gray-100 gap-4">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteCode}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <ConfirmPopUp
                trigger={popupConfirmPublish}
                setTrigger={setPopupConfirmPublish}
                onButtonClick={publishCode}
            >
                {messageConfirm}
            </ConfirmPopUp>
            {promoCodes.length > 0 ? (
                promoCodes.map(code => (
                    <div className="flex flex-col items-center "  key={code.id}>
                        <div
                            className="w-[200px] h-[170px] bg-[#2d7044] text-white rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer"
                            onClick={() => handleToggleDetails(code.id)}
                        >
                            <h1 className="text-3xl font-bold text-center">{code.code}</h1>
                            {visibleDetails === code.id && (
                                <>
                                    <p className="text-center text-sm">Utilizzo: {code.used_by}</p>
                                    <p className="text-center text-sm mt-2">Sconto {code.discount}%</p>
                                    <p className="text-center text-sm">Da {code.start} <br />a {code.expiration}</p>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-red-500 text-white rounded-lg p-2 mt-2" 
                            onClick={() => {
                                setPromoCodeToDelete(code.id);
                                setMessageConfirm(
                                  "Sei sicuro di voler eliminare questo codice?"
                                );
                                setPopupConfirmDelete(true);
                              }}
                            >Elimina</button>
                             <button className="bg-blue-500 text-white rounded-lg p-2 mt-2" 
                            onClick={() => {
                                setPromoCodeToPublish(code.id);
                                setMessageConfirm(
                                  "Sei sicuro di voler rendere accessibile questo codice promozionale?"
                                );
                                setPopupConfirmPublish(true);
                              }}
                            >Pubblica</button>
                        </div>
                        
                    </div>
                ))
            ) : (
                <p>Nessun codice promozionale disponibile.</p>
            )}
        </div>
    );
}

export default PromoCodes;
