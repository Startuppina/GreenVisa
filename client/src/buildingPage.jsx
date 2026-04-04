import React, { useState, useEffect } from "react";
import ScrollToTop from './components/scrollToTop';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { useParams } from "react-router-dom";
import Building from "./components/building";
import Plants from "./components/plants";
import Solars from "./components/solars";
import Photovoltaics from "./components/photovoltaics";
import Consumption from "./components/comsumption";
import ClimateAlteringGases from "./components/climateAlteringGases";
import { EmissionsCalculator } from "./components/emissionsCalculator";
import { useRecoveryContext } from "./provider/provider";
import { MutatingDots } from "react-loader-spinner";
import MessagePopUp from "./components/messagePopUp";
import ChatWidget from "./chatbot/ChatWidget";
import BuildingSubmitConfirmDialog from "./components/buildingSubmitConfirmDialog";


function BuildingPage() {
    const { id } = useParams();
    const [activeSection, setActiveSection] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { buildingID, triggerRefreshResults, buildingLocked, setBuildingLocked } = useRecoveryContext();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const [buttonPopUp, setButtonPopUp] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");


    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

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


    const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Stato per tenere traccia della larghezza della finestra per mostrare o meno userData modifier in un certo modo

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

            {
                windowWidth >= 1024 ? (
                    <div className="flex flex-wrap justify-center items-center gap-4 mt-10">
                        <button
                            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'impianti' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("impianti");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti</span>
                        </button>

                        <button
                            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'consumi' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("consumi");
                            }}
                        >
                            <span className="text-arial text-xl">Consumi annui</span>
                        </button>

                        <button
                            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'gasAlteranti' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("gasAlteranti");
                            }}
                        >
                            <span className="text-arial text-xl">Gas clima alteranti</span>
                        </button>

                        <button
                            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'solari' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}

                            onClick={() => {
                                toggleSection("solari");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti solari termici</span>
                        </button>

                        <button
                            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'fotovoltaici' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("fotovoltaici");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti fotovoltaici</span>
                        </button>
                    </div>

                ) : (
                    <div className={`flex flex-wrap justify-center items-center gap-4 mt-10 ${window.innerWidth < 1024 ? 'block' : 'hidden'}`}>
                        <button
                            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'impianti' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("impianti");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti</span>
                        </button>

                        <button
                            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'consumi' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("consumi");
                            }}
                        >
                            <span className="text-arial text-xl">Consumi annui</span>
                        </button>

                        {true && (
                            <button
                                className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'gasAlteranti' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                                onClick={() => {
                                    toggleSection("gasAlteranti");
                                }}
                            >
                                <span className="text-arial text-xl">Gas clima alteranti</span>
                            </button>
                        )}


                        <button
                            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'solari' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}

                            onClick={() => {
                                toggleSection("solari");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti solari termici</span>
                        </button>

                        <button
                            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'fotovoltaici' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
                            onClick={() => {
                                toggleSection("fotovoltaici");
                            }}
                        >
                            <span className="text-arial text-xl">Impianti fotovoltaici</span>
                        </button>
                    </div>

                )
            }


            {activeSection === "impianti" && <Plants />}
            {activeSection === "consumi" && <Consumption />}
            {activeSection === "gasAlteranti" && <ClimateAlteringGases />}
            {activeSection === "solari" && <Solars />}
            {activeSection === "fotovoltaici" && <Photovoltaics />}
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