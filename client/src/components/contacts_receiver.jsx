import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import ConfirmPopUp from './confirmPopUp';

const MessagesDashboard = () => {
    const [messages, setMessages] = useState([]);
    const [totalMessages, setTotalMessages] = useState(0);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null); // { id: string }

    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get('http://localhost:8080/api/messages', {
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

        fetchMessages();
    }, []);

    const deleteMessage = async () => {
        if (!messageToDelete) return;

        const { id } = messageToDelete;
        const token = localStorage.getItem('token');

        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-message/${id}`, {
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

    return (
        <div className="flex flex-col h-auto w-[98.5%] mx-auto my-10 font-arial text-xl m-4">
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
            <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl px-10 py-6">
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
                                <h2 className="text-xl font-bold">Soggetto</h2>
                                <p className="text-lg">{message.subject}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Messaggio</h2>
                                <p className="text-lg">{message.message}</p>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => handleDelete(message.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessagesDashboard;
