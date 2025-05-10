import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from 'react-loader-spinner';

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

function AllUsers() {
    const [users, setUsers] = useState([]);
    const [usersToVerify, setUsersToVerify] = useState([]);
    const [numUsersToVerify, setNumUsersToVerify] = useState(0);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [emailTitle, setEmailTitle] = useState("");
    const [emailContent, setEmailContent] = useState("");
    const [admin, setAdmin] = useState('');
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // Stato per il termine di ricerca
    const [filteredUsers, setFilteredUsers] = useState([]); // Stato per gli utenti filtrati

    const handleTitleChange = (e) => setEmailTitle(e.target.value);
    const handleContentChange = (e) => setEmailContent(e.target.value);
    const [currentMessageEmail, setCurrentMessageEmail] = useState("");
    const [currentEmailFormUserId, setCurrentEmailFormUserId] = useState(null); // Stato per memorizzare l'ID utente
    const [registeredUsers, setRegisteredUsers] = useState(["AllUsers"]);

    const formRef = useRef(null);
    useEffect(() => {
        if (currentEmailFormUserId && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [currentEmailFormUserId]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-users`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    setUsers(response.data);
                    setFilteredUsers(response.data); // Imposta gli utenti filtrati inizialmente
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero degli utenti");
                setButtonPopup(true);
            }
        };

        const fetchAdminUsername = async () => {

            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/admin-username`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    setAdmin(response.data.username);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero dell'username dell'amministratore");
                setButtonPopup(true);
            }
        }



        fetchAdminUsername();
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchNotVerifiedUsers = async () => {
            ;
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-not-verified-users`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    setUsersToVerify(response.data.rows);
                    setNumUsersToVerify(response.data.count);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero degli utenti non verificati");
                setButtonPopup(true);
            }
        };

        fetchNotVerifiedUsers();
    }, []);

    // Funzione di ricerca debounced
    const handleSearchChange = debounce((searchTerm) => {
        setFilteredUsers(users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, 300);

    const sendResponse = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send-message-response`, { emailTitle, emailContent, receiverEmail: currentMessageEmail }, {
                withCredentials: true
            });
            if (response.status === 200) {
                setTimeout(() => {
                    setEmailTitle("");
                    setIsLoading(false);
                    setEmailContent("");
                    setMessagePopUp("Messaggio inviato correttamente");
                    setButtonPopup(true);
                }, 3000);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleSendVerifyEmail = async (userID) => {

        console.log(userID);
        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send-verify-email`, { userID }, {
                withCredentials: true
            });
            if (response.status === 200) {
                setMessagePopUp("Email di verifica inviata correttamente");
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    const [activeSection, setActiveSection] = useState("registeredUsers");

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? section : section);
    };

    return (
        <>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>

            <div className="flex flex-col h-[70vh] overflow-y-auto w-full  mx-auto font-arial text-xl">
                <div className="flex flex-row justify-center gap-10 pb-10 pt-10">
                    <button className="bg-[#2d7044] border-[#2d7044] border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-[#2d7044] transition-colors duration-300 ease-in-out"
                        onClick={() => {
                            toggleSection("registeredUsers");
                        }}>
                        Registrati
                    </button>
                    <button
                        className="relative bg-[#2d7044] border-[#2d7044] border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-[#2d7044] transition-colors duration-300 ease-in-out"
                        onClick={() => {
                            toggleSection("toVerifyUsers");
                        }}
                    >
                        {numUsersToVerify > 0 && (
                            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-red-500 rounded-full">
                                {numUsersToVerify}
                            </span>
                        )}
                        <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                            Da verificare
                        </span>
                    </button>
                </div>
                {activeSection === "registeredUsers" && (
                    <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl py-6">
                        <h1 className="text-2xl font-bold text-black text-center pb-10">Utenti registrati</h1>

                        {/* Campo di ricerca */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Cerca per nome o email"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleSearchChange(e.target.value); // Chiama la funzione di ricerca
                                }}
                                className="w-full md:w-[400px] p-2 border border-gray-300 rounded-lg mb-10"
                            />
                        </div>

                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-500">Nessun utente trovato</p>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="bg-white p-4 rounded-lg shadow-md border">
                                        <div className="w-full">
                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Nome e Cognome del referente</h2>
                                                    <p className="text-lg">{user.username}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Email</h2>
                                                    <p className="text-lg">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Nome Azienda</h2>
                                                    <p className="text-lg">{user.company_name !== null ? user.company_name : "Non specificato"}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Telefono</h2>
                                                    <p className="text-lg">{user.phone_number !== null ? user.phone_number : "Non specificato"}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Partita IVA</h2>
                                                    <p className="text-lg">{user.p_iva !== null ? user.p_iva : "Non specificata"}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Codice Fiscale</h2>
                                                    <p className="text-lg">{user.tax_code !== null ? user.tax_code : "Non specificato"}</p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h2 className="text-xl font-bold">Sede Legale</h2>
                                                <p className="text-lg">{user.legal_headquarter !== null ? user.legal_headquarter : "Non specificata"}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-4 gap-3">
                                            <button
                                                onClick={() => {
                                                    setCurrentMessageEmail(user.email);
                                                    setCurrentEmailFormUserId(currentEmailFormUserId === user.id ? null : user.id); // Mostra il form solo per l'utente corrente
                                                }}
                                                className="bg-blue-500 border-blue-500 border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-500 transition-colors duration-300 ease-in-out"
                                            >
                                                {currentEmailFormUserId === user.id ? "Chiudi" : "Rispondi con una email"}
                                            </button>

                                        </div>

                                        {currentEmailFormUserId === user.id && (
                                            <div className="w-[98.5%] mx-auto my-10 font-arial text-xl m-4 rounded-2xl border px-10 py-6" ref={formRef}>
                                                <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                                                    {messagePopUp}
                                                </MessagePopUp>
                                                <h2 className="text-2xl font-bold text-center mb-4">Invia un messaggio di risposta</h2>
                                                <div className='flex flex-col md:flex-row gap-4 items-center justify-center'>
                                                    <form onSubmit={sendResponse} className="flex flex-col w-full">
                                                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                                                            <label className="flex flex-col w-full">
                                                                <span className="block mb-2">Titolo</span>
                                                                <input
                                                                    type="text"
                                                                    value={emailTitle}
                                                                    onChange={handleTitleChange}
                                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                                />
                                                            </label>
                                                        </div>
                                                        <label className="flex flex-col w-full z-10">
                                                            <span className="block mb-2">Contenuto:</span>
                                                            <textarea
                                                                name="message"
                                                                id="message"
                                                                className='bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px]'
                                                                value={emailContent}
                                                                onChange={handleContentChange}
                                                            ></textarea>
                                                        </label>
                                                        <div className='flex justify-center'>
                                                            {isLoading ? (
                                                                <div className="flex justify-center items-center mt-5">
                                                                    <MutatingDots
                                                                        height="100"
                                                                        width="100"
                                                                        color="#2d7044"
                                                                        secondaryColor='#2d7044'
                                                                        radius='12.5'
                                                                        ariaLabel="mutating-dots-loading"
                                                                        visible={true}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="submit"
                                                                    className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                                                >
                                                                    Invia
                                                                </button>
                                                            )}
                                                        </div>
                                                    </form>

                                                    {window.innerWidth > 768 && (
                                                        <div className="max-w-3xl mx-auto my-12 bg-white p-8 rounded-lg shadow-lg w-full">
                                                            <div className="text-center mb-6">
                                                                <img src="img/logo.png" alt="Green Visa" className="w-36 mx-auto" />
                                                            </div>
                                                            <div className="text-center">
                                                                <h1 className="text-3xl font-semibold text-green-700 mb-4">{emailTitle}</h1>
                                                                <p className="text-lg text-gray-800 mb-4">Ciao username_utente,</p>
                                                                <p className="text-lg text-gray-800 mb-4">{emailContent}</p>
                                                                <p className="text-lg text-gray-800">Saluti,<br />{admin} da Green Visa</p>
                                                            </div>
                                                            <div className="text-right mt-6 text-gray-500 text-sm">
                                                                <p>Green Visa</p>
                                                                <p>La sostenibilità con un click!</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                        }
                    </div>
                )}
                {activeSection == "toVerifyUsers" && (
                    <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl py-6">
                        <h1 className="text-2xl font-bold text-black text-center pb-10">Utenti da verificare</h1>

                        {/* Campo di ricerca */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Cerca per nome o email"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleSearchChange(e.target.value); // Chiama la funzione di ricerca
                                }}
                                className="w-full md:w-[400px] p-2 border border-gray-300 rounded-lg mb-10"
                            />
                        </div>

                        {usersToVerify.length === 0 ? (
                            <p className="text-center text-gray-500">Nessun utente trovato</p>
                        ) : (
                            <div className="space-y-4">
                                {usersToVerify.map(user => (
                                    <div key={user.id} className="bg-white p-4 rounded-lg shadow-md border">
                                        <div className="w-full">
                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Nome e Cognome del referente</h2>
                                                    <p className="text-lg">{user.username}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Email</h2>
                                                    <p className="text-lg">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Nome Azienda</h2>
                                                    <p className="text-lg">{user.company_name !== null ? user.company_name : "Non specificato"}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Telefono</h2>
                                                    <p className="text-lg">{user.phone_number !== null ? user.phone_number : "Non specificato"}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Partita IVA</h2>
                                                    <p className="text-lg">{user.p_iva !== null ? user.p_iva : "Non specificata"}</p>
                                                </div>
                                                <div className="mb-3 md:mb-0 md:w-2/3">
                                                    <h2 className="text-xl font-bold">Codice Fiscale</h2>
                                                    <p className="text-lg">{user.tax_code !== null ? user.tax_code : "Non specificato"}</p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h2 className="text-xl font-bold">Sede Legale</h2>
                                                <p className="text-lg">{user.legal_headquarter !== null ? user.legal_headquarter : "Non specificata"}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end mt-4 gap-3">
                                            <button
                                                onClick={() => {
                                                    handleSendVerifyEmail(user.id);
                                                }}
                                                className="bg-blue-500 border-blue-500 border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-500 transition-colors duration-300 ease-in-out"
                                            >
                                                Invia email di verifica
                                            </button>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                        }
                    </div>
                )}
            </div>
        </>

    );
}

export default AllUsers;
