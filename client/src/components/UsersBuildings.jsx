import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UsersBuildings() {
    const [allUserInfo, setAllUserInfo] = useState([]); // Stato per memorizzare tutti gli utenti
    const [userInfo, setUserInfo] = useState([]); // Stato per memorizzare gli utenti filtrati
    const [userToFind, setUserToFind] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const debounceTimeoutRef = useRef(null); // Usare ref per evitare problemi di race condition

    // Funzione per recuperare tutti gli utenti
    const fetchUserInfo = async () => {
        ;
        try {
            const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-user-info-by-buildings`, {
                withCredentials: true,
            });
            if (response.status === 200) {
                setAllUserInfo(response.data); // Imposta tutti gli utenti
                setUserInfo(response.data); // Imposta gli utenti inizialmente visibili
                console.log(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Funzione di gestione della ricerca
    const handleUserToFindChange = (e) => {
        const value = e.target.value;
        setUserToFind(value);

        // Se l'input è vuoto, mostra tutti gli utenti
        if (value.trim() === "") {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            setUserInfo(allUserInfo); // Mostra tutti gli utenti subito
            return;
        }

        // Usa debounce per la ricerca
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            setIsSearching(true);

            // Filtra gli utenti in base al termine di ricerca
            const filteredUsers = allUserInfo.filter(user =>
                user.username.toLowerCase().includes(value.toLowerCase()) ||
                user.email.toLowerCase().includes(value.toLowerCase())
            );

            setUserInfo(filteredUsers); // Aggiorna lo stato con gli utenti filtrati
            setIsSearching(false);
        }, 300);
    };

    // Chiamata iniziale per recuperare tutti gli utenti al caricamento
    useEffect(() => {
        fetchUserInfo();
    }, []);

    // Funzione per navigare verso la pagina dell'utente selezionato
    const userBuildingRedirect = (userId, username) => {
        navigate(`/user-buildings/${userId}/${username}`);
    };

    return (
        <div className="flex flex-col h-[60vh] w-full overflow-y-auto mx-auto font-arial text-xl">
            <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl py-6">
                <h1 className="text-2xl font-bold text-black text-center pb-5">Edifici degli utenti</h1>
                <p className="text-xl text-center mb-4">In questa sezione sono presenti tutti gli utenti che hanno registrato almeno un edificio</p>
                <input
                    type="text"
                    className="w-full md:w-[30%] p-2 border border-gray-300 rounded-lg mb-10"
                    placeholder="Cerca per nome o email"
                    onChange={handleUserToFindChange}
                    value={userToFind}  // Imposta il valore dell'input per il controllo
                />

                {/* Indicatore di ricerca */}
                {isSearching ? (
                    <p className="text-center text-gray-500">Ricerca in corso...</p>
                ) : (
                    userInfo.length === 0 ? (
                        <p className="text-center text-gray-500">Nessun utente trovato</p>
                    ) : (
                        <div className="space-y-4">
                            {userInfo.map((user, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow-md border">
                                    <div className="mb-3">
                                        <h2 className="text-xl font-bold">Nome utente</h2>
                                        <p className="text-lg">{user.username}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h2 className="text-xl font-bold">Email</h2>
                                        <p className="text-lg">{user.email}</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            className="p-2 w-auto z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                            onClick={() => {
                                                userBuildingRedirect(user.id, user.username);
                                            }}
                                        >
                                            Accedi ai suoi edifici
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )

                )}
            </div>
        </div>
    );
}

export default UsersBuildings;
