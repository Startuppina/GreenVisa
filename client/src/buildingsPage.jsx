import React, { useState, useEffect } from "react";
import ScrollToTop from './components/scrollToTop';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import BuildingFrom from "./components/buildingFrom";
import axios from "axios";
import { Link } from "react-router-dom";
import ConfirmPopUp from "./components/confirmPopUp";
import { useRecoveryContext } from "./provider/provider";

export default function Buildings() {
    const [buildings, setBuildings] = useState([]);
    const [numBuildings, setNumBuildings] = useState(0);
    const [showBuildingForm, setShowBuildingForm] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState(null);
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    const { addBuildingTrigger, setAddBuildingTrigger } = useRecoveryContext();

    const { buildingID, setBuildingID } = useRecoveryContext();

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

                {numBuildings === 0 ? (
                    <div className="text-center mt-20">
                        <h1 className="text-2xl mb-4">Non hai ancora edifici registrati, aggiungine uno</h1>
                        <div className="flex justify-center" onClick={() => setShowBuildingForm(!showBuildingForm)}>
                            <img src="/img/add.png" title="aggiungi" className="w-[80px] md:w-[80px] transition-transform duration-300 ease-in-out hover:scale-105 rounded-lg" />
                        </div>
                        {showBuildingForm && <BuildingFrom />}
                    </div>
                ) : (
                    <div className="text-center mt-10">
                        <h1 className="text-2xl font-bold text-center mb-3">Edifici: {numBuildings}</h1>
                        <div className="flex flex-wrap justify-center gap-4">
                            {buildings.map((building, index) => (
                                <div key={building.id} className="flex flex-col items-center">
                                    <Link to={`/building/${building.id}`}>
                                        <div
                                            className="w-[400px] h-[200px] rounded-lg p-4 hover:transform hover:scale-105 duration-300"
                                            style={{ backgroundColor: generateColor(index) }}
                                        >
                                            <div className="font-bold h-full flex items-center justify-center text-2xl uppercase">{building.name}</div>
                                        </div>
                                    </Link>
                                    <button className='p-2 w-24 z-10 mt-3 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500'
                                        onClick={() => {
                                            setBuildingToDelete({
                                                id: building.id,
                                            });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questo Edificio?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}>
                                        Elimina
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center mt-20" onClick={() => setShowBuildingForm(!showBuildingForm)}>
                            <img src="/img/add.png" title="hospitality" className="w-[80px] md:w-[80px] transition-transform duration-300 ease-in-out hover:scale-105 rounded-lg" />
                        </div>
                        {showBuildingForm && <BuildingFrom />}
                    </div>
                )}
            </main >
            <Footer />
        </div >
    );
}
