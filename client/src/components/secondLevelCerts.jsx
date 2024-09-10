import React, { useEffect, useState } from 'react';
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import axios from 'axios';

export default function SecondLevelCerts({ sendDataToParent }) {

    const [request, setRequests] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");
    const [messageConfirm, setMessageConfirm] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);


    useEffect(() => {
        const fetchRequests = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get("http://localhost:8080/api/fetch-second-level-requests", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    setRequests(response.data.requests);
                    setApprovedRequests(response.data.approved);
                }
            } catch (error) {
                setMessagePopup("Errore durante il recupero dei dati.");
                setButtonPopup(true);
            }
        };
        fetchRequests();
    }, []); // Rimuovi request dalle dipendenze

    const approveRequest = async (request_id, user_requestor_id) => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.post("http://localhost:8080/api/approve-second-level-request", {
                request_id,
                user_requestor_id
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                // Aggiorna le richieste e le approvazioni
                const approvedRequest = request.find((req) => req.request_id === request_id);

                // Rimuovi la richiesta dalle richieste in sospeso
                setRequests(request.filter((req) => req.request_id !== request_id));

                // Aggiungi la richiesta approvata alla lista delle approvate
                setApprovedRequests([...approvedRequests, approvedRequest]);

                setMessagePopup("Richiesta approvata con successo.");
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopup("Errore durante l'approvazione della richiesta.");
            setButtonPopup(true);
        }
    };

    const deleteRequest = async () => {
        setPopupConfirmDelete(false);
        const token = localStorage.getItem("token");
        console.log("token :", token);

        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-second-level-request`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    request_id: requestToDelete.request_id,
                    user_requestor_id: requestToDelete.user_id
                }
            });

            if (response.status === 200) {
                // Aggiorna le richieste e le approvazioni
                setRequests(request.filter((req) => req.request_id !== requestToDelete.request_id));
                setApprovedRequests(approvedRequests.filter((req) => req.request_id !== requestToDelete.request_id));

                setMessagePopup("Richiesta eliminata con successo.");
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopup("Errore durante l'eliminazione della richiesta.");
            setButtonPopup(true);
        }
    };

    useEffect(() => {
        const sendData = () => {
            sendDataToParent(request.length); // Chiamata alla funzione passata dal padre
        };
        sendData();
    })

    return (
        <>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteRequest}
            >
                {messageConfirm}
            </ConfirmPopUp>

            <div className="w-full mt-10 flex items-center justify-center bg-gray-100 gap-4">

                {/* Sezione Richieste da approvare */}
                <div className="w-full  h-[70vh] overflow-y-auto mx-auto p-6 border border-gray-300 rounded-lg shadow-md bg-white">
                    <h1 className="text-3xl font-bold text-center mb-6">Richieste certificazione di secondi livello</h1>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold mb-4">Richieste</h2>

                        {request.length === 0 ? (
                            <p>Nessun dato trovato.</p>
                        ) : (
                            request.map((data, index) => (
                                <div key={index} className="border rounded-lg p-6 shadow-lg bg-gray-50 relative">
                                    <h3 className="text-xl font-semibold mb-2">Richiedente: {data.username}</h3>
                                    <p>Utente: {data.username}</p>
                                    <p>Ragione sociale: {data.company_name}</p>
                                    <p>Telefono: {data.phone_number !== null ? data.phone_number : "Non specificato"}</p>
                                    <p className="mb-2">Tipo di certificazione: {data.category}</p>
                                    <p className="mb-2">Data: {new Date(data.created_at).toLocaleDateString('it-IT')}</p>

                                    <div className='flex flex-row gap-2 justify-end'>
                                        <button
                                            onClick={() => approveRequest(data.request_id, data.user_id)}
                                            className="bg-blue-500 border-2 border-blue-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-500 transition-colors duration-300"
                                        >
                                            Approva
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMessageConfirm("Sei sicuro di voler eliminare questa richiesta? Questa operazione non è reversibile.");
                                                setRequestToDelete({ request_id: data.request_id, user_id: data.user_id });
                                                setPopupConfirmDelete(true);
                                            }}
                                            className="bg-red-500 border-2 border-red-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-red-500 transition-colors duration-300"
                                        >
                                            Elimina
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sezione Richieste approvate */}
                <div className="w-full h-[70vh] overflow-y-auto mx-auto p-6 border border-gray-300 rounded-lg shadow-md bg-white">
                    <h1 className="text-3xl font-bold text-center mb-6">Richieste approvate</h1>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold mb-4">Richieste</h2>

                        {approvedRequests.length === 0 ? (
                            <p>Nessun dato trovato.</p>
                        ) : (
                            approvedRequests.map((data, index) => (
                                <div key={index} className="border rounded-lg p-6 shadow-lg bg-gray-50 relative">
                                    <h3 className="text-xl font-semibold mb-2">Richiedente: {data.username}</h3>
                                    <p>Utente: {data.username}</p>
                                    <p>Ragione sociale: {data.company_name}</p>
                                    <p>Telefono: {data.phone_number !== null ? data.phone_number : "Non specificato"}</p>
                                    <p className="mb-2">Tipo di certificazione: {data.category}</p>
                                    <p className="mb-2">Data: {new Date(data.created_at).toLocaleDateString('it-IT')}</p>
                                    <div className='flex justify-end'>
                                        <button
                                            onClick={() => {
                                                setMessageConfirm("Sei sicuro di voler eliminare questa richiesta? Questa operazione non è reversibile.");
                                                setRequestToDelete({ request_id: data.request_id, user_id: data.user_id });
                                                setPopupConfirmDelete(true);
                                            }}
                                            className="bg-red-500 border-2 border-red-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-red-500 transition-colors duration-300"
                                        >
                                            Elimina
                                        </button>
                                    </div>
                                </div>

                            ))
                        )}
                    </div>
                </div>
            </div >
        </>
    );
}
