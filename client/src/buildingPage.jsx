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


function BuildingPage() {
    const [activeSection, setActiveSection] = useState(null);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <Building />

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
                    className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === 'solari' ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}

                    onClick={() => {
                        toggleSection("solari");
                    }}
                >
                    <span className="text-arial text-xl">Impainti solari termici</span>
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
            {activeSection === "impianti" && <Plants />}
            {activeSection === "solari" && <Solars />}
            {activeSection === "fotovoltaici" && <Photovoltaics />}
            <Footer />
        </div>
    )
}

export default BuildingPage