import React, { useState, useEffect } from "react";
import axios from "axios";
import ConfirmPopUp from "./confirmPopUp";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";
import { useRecoveryContext } from "../provider/provider";

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

    const { CodeTrigger, setCodeTrigger } = useRecoveryContext();

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
    }, [CodeTrigger]);

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
                setCodeTrigger(!CodeTrigger);
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
                setCodeTrigger(!CodeTrigger);
                navigate("/User");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const colors = ["#2d7044", "#1e90ff", "#ff6347", "#ffd700", "#32cd32", "#a52a2a", "#ff00ff", "#7b68ee"]; // Array di colori

    return (
        <div className="w-full md:w-[98.5%] h-[430px] overflow-y-auto mx-auto font-arial text-xl m-4 rounded-2xl border shadow-xl px-5 py-6">
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
                promoCodes.map((code, index) => (
                    <div className="w-full md:w-auto flex flex-col items-center" key={code.id}>
                        {window.innerWidth >= 768 && (
                            <>
                                <div
                                    className="w-[95vw] md:w-[30vh] h-[200px] text-white rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
                                    style={{ backgroundColor: colors[index % colors.length] }} // Applica un colore diverso
                                    onClick={() => handleToggleDetails(code.id)}
                                >
                                    <h1 className="text-4xl font-extrabold text-center tracking-wider">{code.code}</h1>
                                    {visibleDetails === code.id && (
                                        <>
                                            <p className="text-center text-sm mt-2">Utilizzato da: <strong>{code.used_by}</strong></p>
                                            <p className="text-center text-lg font-bold mt-2">Sconto: {code.discount}%</p>
                                            <p className="text-center text-xs mt-1">Valido dal {code.start} <br />al {code.expiration}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button className="z-10 bg-red-500 text-white border-2 border-red-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-red-500 hover:bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Evita l'attivazione di handleToggleDetail
                                            setPromoCodeToDelete(code.id);
                                            setMessageConfirm("Sei sicuro di voler eliminare questo codice?");
                                            setPopupConfirmDelete(true);
                                        }}
                                    >
                                        Elimina
                                    </button>
                                    <button className="z-10 bg-blue-500 text-white border-2 border-blue-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-blue-500 hover:bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPromoCodeToPublish(code.id);
                                            setMessageConfirm("Sei sicuro di voler rendere accessibile questo codice promozionale?");
                                            setPopupConfirmPublish(true);
                                        }}
                                    >
                                        Pubblica
                                    </button>
                                </div>
                            </>
                        )}
                        {window.innerWidth < 768 && (
                            <div
                                className="w-full  text-white rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
                                style={{ backgroundColor: colors[index % colors.length] }} // Applica un colore diverso
                                onClick={() => handleToggleDetails(code.id)}
                            >
                                <h1 className="text-4xl font-extrabold text-center tracking-wider">{code.code}</h1>
                                {visibleDetails === code.id && (
                                    <>
                                        <p className="text-center text-sm mt-2">Utilizzato da: <strong>{code.used_by}</strong></p>
                                        <p className="text-center text-lg font-bold mt-2">Sconto: {code.discount}%</p>
                                        <p className="text-center text-xs mt-1">Valido dal {code.start} <br />al {code.expiration}</p>
                                    </>
                                )}
                                <div className="flex gap-3">
                                    <button className="bg-red-500 text-white border-2 border-red-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-red-500 hover:bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPromoCodeToDelete(code.id);
                                            setMessageConfirm("Sei sicuro di voler eliminare questo codice?");
                                            setPopupConfirmDelete(true);
                                        }}
                                    >
                                        Elimina
                                    </button>
                                    <button className="bg-blue-500 text-white border-2 border-blue-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-blue-500 hover:bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPromoCodeToPublish(code.id);
                                            setMessageConfirm("Sei sicuro di voler rendere accessibile questo codice promozionale?");
                                            setPopupConfirmPublish(true);
                                        }}
                                    >
                                        Pubblica
                                    </button>
                                </div>
                            </div>
                        )}


                    </div>
                ))
            ) : (
                <p>Nessun codice promozionale disponibile.</p>
            )}
        </div>
    );
}

export default PromoCodes;
