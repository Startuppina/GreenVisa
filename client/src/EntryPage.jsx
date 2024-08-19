import React from "react";
import Products from "./components/products";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/scrollToTop";
import Products_form from "./components/products_form";

function EntryPage() {
    return (
        <>
        <ScrollToTop />
        <Navbar />
        <h1 className="text-arial text-3xl text-center font-bold pb-5">ENTRA IN GREEN VISA</h1>
        <Products />
        <h1 className="text-arial text-3xl text-center font-bold pt-3">Procedura</h1>
        <p className="text-arial text-xl text-justify px-4 md:px-16 lg:pl-40 lg:pr-40 pt-5 pb-4">Per iniziare, uno dei ticket di accesso al protocollo GREEN VISA previsto per la tua impresa sopra presenti.<br/><br/>
            Riceverai immediatamente una mail con un link a te dedicato e <strong>sarai guidato nella compilazione di un questionario multiple choice</strong>, per consentire all’algoritmo GREEN VISA di effettuare <strong>una diagnosi della situazione energetico/ambientale</strong> della tua impresa e <strong>misurare le emissioni di CO2 della tua attività.</strong><br/><br/>
            Ti sarà assegnato un punteggio sulla base dei <strong>rigorosi protocolli scientifici elaborati dai nostri esperti e riceverai una serie di suggerimenti utili a migliorare le prestazioni ambientali della tua impresa.</strong><br/><br/>
            <strong>Riceverai una targa da esibire all’ingresso della tua struttura</strong> e potrai acquistare (con tariffa dedicata ai membri GREEN VISA) ulteriori gadget e servizi utili a far conoscere online e offline il tuo impegno green.<br/><br/>
            <strong>Il nostro staff sarà sempre a tua disposizione e ti seguirà passo dopo passo.</strong></p>
        <Footer />
        </>
    );
}

export default EntryPage