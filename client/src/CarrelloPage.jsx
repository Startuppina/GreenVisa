import React from "react";
import Carrello from "./components/carrello";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/scrollToTop";

function CarrelloPage() {
    return (
        <>
        <ScrollToTop />
        <Navbar />
        <Carrello />
        <Footer />
        </>

    );
}

export default CarrelloPage;