import React, { useState, useEffect, useRef } from "react";
import ScrollToTop from './components/scrollToTop';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import BuildingFrom from "./components/buildingFrom";
import axios from "axios";
import { Link } from "react-router-dom";
import ConfirmPopUp from "./components/confirmPopUp";
import { useRecoveryContext } from "./provider/provider";
import { useNavigate } from "react-router-dom";

export default function Buildings() {
    const [buildings, setBuildings] = useState([]);
    const [numBuildings, setNumBuildings] = useState(0);
    const [showBuildingForm, setShowBuildingForm] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const { addBuildingTrigger, setAddBuildingTrigger } = useRecoveryContext();

    const { buildingID, setBuildingID } = useRecoveryContext();

    const navigate = useNavigate();

    const formRef = useRef(null);
    useEffect(() => {
        if (showBuildingForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    })

    useEffect(() => {
        const fetchBuildings = async () => {
            setBuildingID(0);
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get("http://localhost:8080/api/fetch-buildings", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    setBuildings(response.data.buildings);
                    setNumBuildings(response.data.numBuildings);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchBuildings();
    }, [addBuildingTrigger]);

    const deleteBuilding = async () => {
        const token = localStorage.getItem('token');
        const { id } = buildingToDelete;
        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-building/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                // Aggiorna lo stato dei buildings dopo l'eliminazione
                const updatedBuildings = buildings.filter(building => building.id !== id);
                setBuildings(updatedBuildings);
                setNumBuildings(updatedBuildings.length);
                setPopupConfirmDelete(false);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const generateColor = (index) => {
        const baseHue = 200;
        const hueShift = (index * 30) % 360;
        return `hsl(${baseHue + hueShift}, 70%, 80%)`;
    };

    return (
        <div>
            <ScrollToTop />
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteBuilding}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <Navbar />
            <main className="text-arial text-xl">
                <h1 className="text-3xl font-bold text-center">I TUOI EDIFICI</h1>
                {buildings.length > 0 && (
                    <div className="w-[200px] m-auto flex justify-center mt-4 hover:cursor-pointer hover:text-[#2d7044]" onClick={() => navigate(`/report`)}>Visualizza il report</div>
                )}

                {numBuildings === 0 ? (
                    <div className="text-center mt-20">
                        <h1 className="text-2xl mb-4">Non hai ancora edifici registrati, aggiungine uno</h1>
                        <div className="flex flex-col items-center justify-center m-2 mt-5">
                            <button
                                className="p-2 mb-4 w-20 h-20 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                                onClick={() => setShowBuildingForm(!showBuildingForm)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                            </button>
                        </div>
                        {showBuildingForm && <BuildingFrom buildingData="empty" isEdit={false} />}
                    </div>
                ) : (
                    <div className="text-center mt-10">
                        <h1 className="text-2xl font-bold text-center mb-3">Edifici: {numBuildings}</h1>
                        <div className="flex flex-wrap justify-center gap-4">
                            {buildings.map((building, index) => (
                                <div key={index} className="flex flex-col items-center">

                                    <div
                                        className="w-[95vw] lg:w-[400px] h-auto rounded-lg p-4 hover:transform hover:scale-105 duration-300"
                                        style={{ backgroundColor: generateColor(index) }}
                                    >
                                        <div className="font-bold flex items-center justify-center text-2xl uppercase">
                                            {building.name}
                                        </div>
                                        <div className="flex justify-center gap-4">
                                            <Link to={`/building/${building.id}`}>
                                                <button className="p-2 w-24 mt-3 bg-blue-700 text-white rounded-lg border-2 border-transparent hover:border-blue-700 transition-colors duration-300 ease-in-out hover:bg-white hover:text-blue-700"
                                                >
                                                    Accedi
                                                </button>
                                            </Link>
                                            <button
                                                className="p-2 w-24 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500"
                                                onClick={() => {
                                                    setBuildingToDelete({ id: building.id });
                                                    setMessageConfirm("Sei sicuro di voler eliminare questo Edificio?");
                                                    setPopupConfirmDelete(true);
                                                }}
                                            >
                                                Elimina
                                            </button>
                                        </div>

                                    </div>



                                </div>

                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-center m-2 mt-5">
                            <button
                                className="p-2 mb-4 w-20 h-20 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] flex items-center justify-center"
                                onClick={() => setShowBuildingForm(!showBuildingForm)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                            </button>
                        </div>
                        {showBuildingForm && <div ref={formRef}><BuildingFrom buildingData="empty" isEdit={false} /></div>}
                    </div>
                )
                }
                <div className="w-full mx-auto mt-10 px-4 lg:px-20 ">
                    <div className=" font-arial text-justify">
                        <h1 className="text-3xl font-bold mb-6 text-center">Procedura di Inserimento dei Buildings e Impianti</h1>

                        <p className="text-xl mb-4">
                            Il sistema permette di inserire edifici e associare a ciascuno impianti di vario tipo, inclusi impianti solari e impianti fotovoltaici.
                            Ogni impianto inserito contribuirà a determinare le emissioni di CO2 per l'edificio.
                        </p>

                        <p className="text-xl mb-4">
                            Per iniziare, dovrai creare un nuovo edificio compilando le informazioni richieste, come la descrizione e la localizzazione del building.
                            Successivamente, potrai aggiungere impianti specifici, selezionando il tipo di impianto (es. riscaldamento, raffrescamento, acqua calda sanitaria) e
                            inserendo i dettagli riguardanti il generatore, il tipo di combustibile, e altre caratteristiche come la fornitura di elettricità.
                        </p>

                        <p className="text-xl mb-4">
                            Il sistema include anche la possibilità di inserire impianti solari e fotovoltaici. Questi impianti sono considerati altamente sostenibili
                            e possono migliorare le emissioni dell'edificio. Le emissioni sono calcolate in base ai dati forniti e riflette il
                            livello di sostenibilità dell'edificio.
                        </p>

                        <p className="text-xl mb-4">
                            È fondamentale sfruttare il sistema in modo onesto e accurato. Inserire dati reali e corretti sugli impianti e i consumi è essenziale per ottenere
                            un risultato affidabile e veritiero. Solo con dati autentici sarà possibile determinare con precisione il livello di sostenibilità dell'edificio.
                        </p>

                        <p className="text-xl mb-4 font-bold">
                            Ricorda: la trasparenza e l'onestà sono essenziali per contribuire al successo del sistema e migliorare l'impatto ambientale complessivo.
                        </p>
                    </div>
                </div>

            </main >
            <Footer />
        </div >
    );
}
