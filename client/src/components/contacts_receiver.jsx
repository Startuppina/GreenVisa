import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import ConfirmPopUp from './confirmPopUp';
import { MutatingDots } from 'react-loader-spinner';
import { useRecoveryContext } from '../provider/provider';

const MessagesDashboard = () => {
    const [messages, setMessages] = useState([]);
    const [totalMessages, setTotalMessages] = useState(0);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [emailForm, setEmailForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [emailTitle, setEmailTitle] = useState("");
    const [emailContent, setEmailContent] = useState("");
    const [currentMessageEmail, setCurrentMessageEmail] = useState("");
    const [currentIDEmail, setCurrentIDEmail] = useState("");
    const [admin, setAdmin] = useState('');

    const handleTitleChange = (e) => setEmailTitle(e.target.value);
    const handleContentChange = (e) => setEmailContent(e.target.value);

    const formRef = useRef(null);
    useEffect(() => {

        if (currentIDEmail && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [emailForm, currentIDEmail]);

    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/messages`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setMessages(response.data.messages);
                    setTotalMessages(response.data.count);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero dei messaggi");
                setButtonPopup(true);
            }
        };

        const fetchAdminUsername = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/admin-username`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setAdmin(response.data.username);
                }

            } catch (error) {
                setMessagePopUp("Errore durante il recupero dell'username dell'amministratore");
                setButtonPopup(true);
            }
        }

        fetchMessages();
        fetchAdminUsername();
    }, []);

    const deleteMessage = async () => {
        if (!messageToDelete) return;

        const { id } = messageToDelete;
        const token = localStorage.getItem('token');

        try {
            const response = await axios.delete(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/delete-message/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setMessages(prevMessages => prevMessages.filter(message => message.id !== id));
                setTotalMessages(prevTotalMessages => prevTotalMessages - 1);
                setPopupConfirmDelete(false);
            }
        } catch (error) {
            setMessagePopUp("Errore durante la cancellazione del messaggio");
            setButtonPopup(true);
        }
    };

    const handleDelete = (id) => {
        setMessageToDelete({ id });
        setMessagePopUp("Sei sicuro di voler eliminare questo messaggio?");
        setPopupConfirmDelete(true);
    };

    const handleSendEmail = async (email) => {
        const token = localStorage.getItem('token');

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send-email-message`, { email }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setMessagePopUp("Email di presa in carico inviata correttamente");
                setButtonPopup(true);
            }

        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const sendResponse = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/send-message-response`, { emailTitle, emailContent, receiverEmail: currentMessageEmail }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setEmailForm(false);
                setEmailTitle("");
                setEmailContent("");
                setMessagePopUp("Messaggio inviato correttamente");
                setButtonPopup(true);
            }

        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex flex-col h-auto w-full mx-auto font-arial text-xl">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteMessage}
            >
                {messagePopUp}
            </ConfirmPopUp>
            <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl py-6">
                <h1 className="text-2xl font-bold text-black text-center pb-10">Messaggi degli Utenti</h1>

                <div className="mb-6">
                    <p className="text-xl font-semibold">Messaggi totali: {totalMessages}</p>
                </div>

                <div className="space-y-4">
                    {messages.map(message => (
                        <div key={message.id} className="bg-white p-4 rounded-lg shadow-md border">
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Nome e Cognome</h2>
                                <p className="text-lg">{message.name_surname}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Email</h2>
                                <p className="text-lg">{message.email}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Ragione sociale</h2>
                                <p className="text-lg">{message.company_name !== "" ? message.company_name : "Non specificato"}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Telefono</h2>
                                <p className="text-lg">{message.phone_number !== "" ? message.phone_number : "Non specificato"}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Soggetto</h2>
                                <p className="text-lg">{message.subject}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Messaggio</h2>
                                <p className="text-lg">{message.message}</p>
                            </div>
                            <div className="flex flex-wrap justify-end mt-4 gap-3">
                                <button
                                    onClick={() => handleDelete(message.id)}
                                    className="bg-red-500 border-red-500 border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-red-500 transition-colors duration-300 ease-in-out"
                                >
                                    Elimina
                                </button>
                                <button
                                    onClick={() => {
                                        handleSendEmail(message.email)
                                        setCurrentIDEmail(message.id);
                                    }}
                                    className={` ${emailForm === true && message.id === currentIDEmail ? "bg-gray-500 border-gray-500 text-white" : "bg-blue-500 border-blue-500 text-white hover:bg-white hover:text-blue-500 transition-colors duration-300 ease-in-out"} w-[41%] md:w-auto border-2  px-4 py-2 rounded-lg truncate`}
                                    disabled={emailForm === true && message.id === currentIDEmail ? true : false}
                                >
                                    Conferma ricezione
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentMessageEmail(message.email);
                                        setCurrentIDEmail(0);
                                        setCurrentIDEmail(message.id);
                                        setEmailForm(!emailForm);
                                    }}
                                    className="bg-green-500 border-green-500 border-2 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-green-500 transition-colors duration-300 ease-in-out"
                                >
                                    {emailForm === true && message.id === currentIDEmail ? "Annulla" : "Rispondi"}
                                </button>
                            </div>

                            {emailForm && message.id === currentIDEmail && (
                                <div className="w-[98.5%] mx-auto my-10 font-arial text-xl m-4 rounded-2xl border  px-10 py-6" ref={formRef}>
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
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessagesDashboard;
