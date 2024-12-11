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

    const [openPopup, setOpenPopup] = useState(false);
    const [usersNotAssignedCodes, setUsersNotAssignedCodes] = useState([]); // utenti la quale non è stato assegnato il codice promozionale
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [searchTerm, setSearchTerm] = useState(""); // Stato per il termine di ricerca
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]); // Stato per gli utenti filtrati

    const handleCheckboxChange = (username) => {
        setSelectedUsers((prevSelected) => {
            if (prevSelected.includes(username)) {
                // Se è già selezionato, rimuovilo
                return prevSelected.filter((user) => user !== username);
            } else {
                // Altrimenti aggiungilo
                return [...prevSelected, username];
            }
        });
    };


    const { CodeTrigger, setCodeTrigger } = useRecoveryContext();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchPromoCodes = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-promo-codes`, {
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

        const fetchUsers = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 200) {
                    setUsers(response.data);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero degli utenti");
                setButtonPopup(true);
            }
        };

        fetchUsers();
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
            const response = await axios.delete(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/delete-promo-code/${promoCodeToDelete}`, {
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
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/publish-promo-code/${promoCodeToPublish}`, {}, {
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
            setPopupConfirmPublish(false);
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    const assignCodeToUsers = async () => {

        console.log("selectedUsers:", selectedUsers);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/assign-promo-code-to-users/${promoCodeToPublish}`, { selectedUsers }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
                setPromoCodeToPublish(null);
                setCodeTrigger(!CodeTrigger);
                navigate("/User");
            }
        } catch (error) {
            setPopupConfirmPublish(false);
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    const fetchUsersNotAssignedCodes = async (codeId) => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-users-not-assigned-codes/${codeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                setUsersNotAssignedCodes(response.data.users);
                setFilteredUsers(response.data.users);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    // Funzione debounce
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const handleSearchChange = debounce((searchTerm) => {
        setFilteredUsers(usersNotAssignedCodes.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, 300);


    const colors = ["#2d7044", "#1e90ff", "#ff6347", "#ffd700", "#32cd32", "#a52a2a", "#ff00ff", "#7b68ee"]; // Array di colori

    return (
        <div className="w-full h-[430px] flex flex-wrap items-center justify-center gap-4 overflow-y-auto mx-auto font-arial text-xl rounded-2xl border shadow-xl px-5 py-6">

            {openPopup && (
                <div className="absolute inset-0 flex items-center justify-center z-50" >
                    <div className="bg-white shadow-lg rounded-lg p-6 w-[800px] h-auto">
                        <h2 className="text-xl font-semibold mb-4 text-center">Seleziona gli utenti che possono utilizzare il codice</h2>
                        <div className="flex justify-center">
                            <input
                                type="text"
                                placeholder="Cerca per nome utente o azienda"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleSearchChange(e.target.value); // Chiama la funzione di ricerca
                                }}
                                className="w-full md:w-[400px] p-2 border border-gray-300 rounded-lg mb-5 text-center"
                            />
                        </div>
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-500 space-y-3 h-[250px] mb-10">Nessun utente trovato</p>
                        ) : (
                            <div className="flex justify-center">
                                <ul className="space-y-3 h-[250px] w-[400px] overflow-y-auto mb-10">
                                    {filteredUsers.map((user, index) => (
                                        <li key={index} className="flex items-center justify-start space-x-3">
                                            <input
                                                type="checkbox"
                                                id={`user-${index}`}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={selectedUsers.includes(user.username)} // Controlla se è selezionato
                                                onChange={() => handleCheckboxChange(user.username)} // Aggiorna lo stato
                                            />
                                            <label
                                                htmlFor={`user-${index}`}
                                                className="text-gray-700 cursor-pointer"
                                            >
                                                {user.username} - {user.company_name}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex justify-center gap-4 z-50">
                            <button className="bg-gray-500 text-white border-2 border-gray-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-gray-500 hover:bg-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUsers([]);
                                    setOpenPopup(false);
                                }}
                            >
                                Chiudi
                            </button>
                            <button className="bg-green-500 text-white border-2 border-green-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-green-500 hover:bg-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    assignCodeToUsers();
                                    setOpenPopup(false);
                                }}
                            >
                                Pubblica
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    className="w-[200px] md:w-[300px] h-[200px] text-white rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
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
                                    <button className="bg-green-500 text-white border-2 border-green-500 rounded-lg p-2 mt-2 transform transition-colors duration-300 ease-in-out hover:text-green-500 hover:bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPromoCodeToPublish(code.id);
                                            fetchUsersNotAssignedCodes(code.id);
                                            setOpenPopup(!openPopup);
                                        }}
                                    >
                                        Assegna
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
