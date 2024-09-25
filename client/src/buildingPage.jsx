import React, { useState, useEffect } from "react";
import ScrollToTop from './components/scrollToTop';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Building from "./components/building";
import Plants from "./components/plants";
import Solars from "./components/solars";
import Photovoltaics from "./components/photovoltaics";
import Consumption from "./components/comsumption";
import { EmissionsCalculator } from "./components/emissionsCalculator";
import { useRecoveryContext } from "./provider/provider";


function BuildingPage() {
    const [activeSection, setActiveSection] = useState(null);
    const { buildingID } = useRecoveryContext();

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const handleEmissionsResult = () => {
        return EmissionsCalculator(buildingID);
    }

    const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Stato per tenere traccia della larghezza della finestra per mostrare o meno userData modifier in un certo modo

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <Building />

            {windowWidth >= 1024 ? (
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

            )}


            {activeSection === "impianti" && <Plants />}
            {activeSection === "consumi" && <Consumption />}
            {activeSection === "solari" && <Solars />}
            {activeSection === "fotovoltaici" && <Photovoltaics />}
            <div className="w-full flex justify-center items-center mt-5 gap-3 mb-5">
                <button
                    type="submit"
                    className="mt-7 font-arial text-xl w-[50%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-blue-700 text-white rounded-lg border-2 border-transparent hover:border-blue-700 transition-colors duration-300 ease-in-out hover:bg-white hover:text-blue-700"
                    onClick={handleEmissionsResult}
                >
                    Calcola le emissioni
                </button>
            </div>
            <Footer />
        </div>
    )
}

export default BuildingPage