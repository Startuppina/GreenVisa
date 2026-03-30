import React from "react";
import WellnessQuestionnaire from "./components/wellnessQuestionnaire.jsx";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { useLocation } from 'react-router-dom';
import ScrollToTop from "./components/scrollToTop.jsx";
import VehicleQuestionnaire from "./vehicleQuestionnaire/Questionnaire.jsx";

// import TransportQuestionnaire from "./components/transportQuestionnaire.jsx";

function QuestionnairePage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const param1 = queryParams.get('param1');
    console.log("CertificationID", param1);
    const category = queryParams.get('param2');
    console.log(category);

    return (
        <>
            <ScrollToTop />
            <Navbar />
            <main className="h-screen">
                {/* Vecchio questionario trasporti (lasciato per riferimento) */}
                {/* {category === "Certificazione trasporti" && <TransportQuestionnaire certification_id={param1} />} */}

                {/* Nuovo questionario trasporti */}
                {category === "Certificazione trasporti" && <VehicleQuestionnaire />}
                {category === "Certificazione spa e resorts" && <WellnessQuestionnaire certification_id={param1} />}
            </main>
            <Footer />
        </>
    )
}

export default QuestionnairePage;