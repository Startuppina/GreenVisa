import React, { useState, useEffect } from "react";
import ScrollToTop from './components/scrollToTop';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { useParams } from "react-router-dom";
import Building from "./components/building";
import ClimateAlteringGases from "./components/climateAlteringGases";
import { EmissionsCalculator } from "./components/emissionsCalculator";
import { useRecoveryContext } from "./provider/provider";
import { MutatingDots } from "react-loader-spinner";
import MessagePopUp from "./components/messagePopUp";
import ChatWidget from "./chatbot/ChatWidget";
import BuildingSubmitConfirmDialog from "./components/buildingSubmitConfirmDialog";


function BuildingPage() {
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const { buildingID, triggerRefreshResults, buildingLocked, setBuildingLocked } = useRecoveryContext();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const [buttonPopUp, setButtonPopUp] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");


    const handleEmissionsResult = async () => {
        if (!buildingID || id === 'new' || buildingLocked) {
            return;
        }

        setIsLoading(true);

        setTimeout(async () => {
            try {
                // Attende la risoluzione della Promise restituita da EmissionsCalculator
                const response = await EmissionsCalculator(buildingID);

                // Se la risposta contiene un messaggio di errore
                if (response.success === false) {
                    setMessagePopup(response.message || "Errore sconosciuto.");
                    setButtonPopUp(true);  // Mostra il popup con il messaggio di errore
                } else {
                    // Successo: puoi gestire la logica per il successo qui
                    console.log("Emissioni calcolate con successo");
                    setBuildingLocked(true);
                }

                setIsLoading(false);
                triggerRefreshResults();

            } catch (error) {
                console.error("Error calculating emissions:", error);
                setMessagePopup("Errore durante il calcolo delle emissioni.");
                setButtonPopUp(true);  // Mostra il popup con un messaggio di errore generico
                setIsLoading(false);
            }
        }, 1000); // Ritarda di 1 secondo prima di eseguire il calcolo
    };
    useEffect(() => {
        if (id === 'new') {
            setBuildingLocked(false);
        }
    }, [id, setBuildingLocked]);

    const canSubmitEmissions = !buildingLocked && id !== 'new' && Boolean(buildingID);




    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <MessagePopUp trigger={buttonPopUp} setTrigger={setButtonPopUp}>
                {messagePopup}
            </MessagePopUp>
            {showConfirmDialog && (
                <BuildingSubmitConfirmDialog
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={() => {
                        setShowConfirmDialog(false);
                        handleEmissionsResult();
                    }}
                />
            )}
            <Building />
            {id !== 'new' && (
                <ClimateAlteringGases
                    scope="building"
                    title="Gas clima alteranti"
                    description="Sottosezione dell'edificio dedicata ai gas clima alteranti archiviati direttamente sulla scheda edificio."
                    emptyMessage="Nessun gas clima alterante associato direttamente all'edificio"
                />
            )}
            {
                isLoading ? (
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
                    <div className="w-full flex flex-col justify-center items-center mt-5 gap-3 mb-5">
                        <button
                            type="submit"
                            className="mt-7 font-arial text-xl w-[50%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-blue-700 text-white rounded-lg border-2 border-transparent hover:border-blue-700 transition-colors duration-300 ease-in-out hover:bg-white hover:text-blue-700"
                            onClick={() => {
                                if (canSubmitEmissions) {
                                    setShowConfirmDialog(true);
                                }
                            }}
                            disabled={!canSubmitEmissions}
                        >
                            Calcola le emissioni
                        </button>
                        <div className="w-full text-arial text-xl text-center">
                            {buildingLocked
                                ? "Dati finalizzati: non sono più consentite modifiche."
                                : "Confermando il calcolo, i dati non saranno più modificabili."}
                        </div>
                    </div>
                )
            }
            <Footer />
            <ChatWidget questionnaireType="buildings" buildingId={id === 'new' ? null : (id || null)} />
        </div >
    )
}

export default BuildingPage