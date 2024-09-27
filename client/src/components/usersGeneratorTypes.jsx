import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessagePopUp from './messagePopUp';

export default function UsersGeneratorTypes({ sendDataToParent }) {
    const [score, setScore] = useState({}); // Stato per i punteggi specifici per richiesta
    const [editingId, setEditingId] = useState(null);
    const [usersGeneratorData, setUsersGeneratorData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const handleScoreChange = (e) => setScore(e.target.value);

    const handleSubmit = async (e, requestor_id, plant_id, generatorType) => {
        e.preventDefault();

        console.log('Dati da inviare:', { score, requestor_id, plant_id, generatorType });

        try {
            // Richiesta HTTP al backend per inviare il punteggio e i dati aggiuntivi
            const response = await axios.post(`http://localhost:8080/api/users-assign-score`, {
                score,
                requestor_id,
                plant_id,
                generatorType
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('Risposta del server:', response.data);
            if (response.status === 200) {
                setMessagePopup('Punteggio inviato con successo');
                setButtonPopup(true);
                setUsersGeneratorData(usersGeneratorData.filter(data => data.plant_id !== plant_id));
            } else {
                setMessagePopup('Errore nell\'invio del punteggio');
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopup('Errore durante l\'invio del punteggio');
            setButtonPopup(true);
        }
    };

    useEffect(() => {
        const fetchUsersGeneratorData = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/users-generator-types', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                console.log('Risposta del server:', response.data);

                if (response.status === 200 && Array.isArray(response.data)) {
                    setUsersGeneratorData(response.data);
                }
            } catch (error) {
                setMessagePopup('Errore durante il recupero dei dati');
                setButtonPopup(true);
            }
        };

        fetchUsersGeneratorData();
    }, []);

    useEffect(() => {
        const sendData = () => {
            sendDataToParent(usersGeneratorData.length); // Chiamata alla funzione passata dal padre
        };
        sendData();
    })

    return (
        <div className="w-full flex items-center justify-center">
            <MessagePopUp buttonPopup={buttonPopup} setButtonPopup={setButtonPopup} >
                {messagePopup}
            </MessagePopUp>

            <div className="w-full mx-auto p-6 border border-gray-300 rounded-2xl shadow-md">
                <h1 className="text-3xl font-bold text-center mb-6">Richieste di Validazione del Tipo di Generatore</h1>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Richieste</h2>
                    {Array.isArray(usersGeneratorData) && usersGeneratorData.length === 0 ? (
                        <p>Nessun dato trovato.</p>
                    ) : (
                        Array.isArray(usersGeneratorData) && usersGeneratorData.map((data, index) => (
                            <div key={index} className="border rounded-lg p-6 shadow-lg bg-gray-50 relative">
                                <h3 className="text-xl font-semibold mb-2">Richiedente: {data.username}</h3>
                                <p>Utente: {data.username}</p>
                                <p>Ragione sociale: {data.company_name}</p>
                                <p>Telefono: {data.phone_number !== null ? data.phone_number : "Non specificato"}</p>
                                <p className="mb-2">Tipo di Generatore: {data.generator_type}</p>

                                <div className='flex justify-end'>
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className="bg-blue-500 border-2 border-blue-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-500 transition-colors duration-300"
                                    >
                                        {showForm ? 'Annulla' : 'Assegna Punteggio'}
                                    </button>
                                </div>

                                {showForm && (
                                    <div className="mt-6">
                                        <h2 className="text-xl font-bold text-center mb-4">Assegna un Punteggio</h2>
                                        <form onSubmit={(e) => handleSubmit(e, data.user_id, data.plant_id, data.generator_type)} className="flex flex-col">
                                            <label className="mb-4">
                                                <span className="block text-lg font-medium mb-2">Seleziona il punteggio</span>
                                                <select
                                                    onChange={(e) => handleScoreChange(e, index)}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-3"
                                                    required
                                                >
                                                    <option value="" disabled>Seleziona un punteggio</option>
                                                    {[1, 2, 3, 4, 5].map((num) => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <div className='flex justify-center'>
                                                <button
                                                    type="submit"
                                                    className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                                >
                                                    Invia
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
