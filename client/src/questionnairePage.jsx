import React from "react";
import SurveyComponent from "./components/transportQuetionnaire.jsx"
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { useLocation } from 'react-router-dom';
import ScrollToTop from "./components/scrollToTop.jsx";

function QuestionnairePage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const param1 = queryParams.get('param1');

    return (
        <>
            <ScrollToTop />
            <Navbar />
            <main className="h-screen">
                <SurveyComponent param1={param1} />
            </main>
            <Footer />
        </>
    )
}

export default QuestionnairePage;