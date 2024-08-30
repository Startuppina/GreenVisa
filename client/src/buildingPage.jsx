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

    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <Building />
            <Plants />
            <Solars />
            <Photovoltaics />
            <Footer />
        </div>
    )
}

export default BuildingPage