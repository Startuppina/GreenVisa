import React from "react";
import TransportQuetionnaire from "./components/transportQuetionnaire.jsx"
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { useLocation } from 'react-router-dom';
import ScrollToTop from "./components/scrollToTop.jsx";

function QuestionnairePage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const param1 = queryParams.get('param1');
    const category = queryParams.get('param2');
    console.log(category);

    return (
        <>
            <ScrollToTop />
            <Navbar />
            <main className="h-screen">
                {category === "Certificazione trasporti" && <TransportQuetionnaire param1={param1} />}
            </main>
            <Footer />
        </>
    )
}

export default QuestionnairePage;