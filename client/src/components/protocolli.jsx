import React from "react";
import Infinite_carousel from "./infinite_carousel";

function Protocolli() {

    const imgStyle = "relative w-[35vw] md:w-[25vw] transition-transform duration-300 ease-in-out hover:scale-105 rounded-lg";
    return (
        <div className="bg-[#2d7044] md:rounded-xl md:m-4">
            <h1 className="font-arial text-2xl md:text-3xl text-center text-white font-bold mb-5 pt-3">I PROTOCOLLI GREEN VISA</h1>
            <Infinite_carousel />
            <div className="flex flex-col items-center justify-center flex-wrap w-full">
                {/*<div className="flex flex-row gap-5 items-center justify-center w-full h-auto flex-wrap pb-8">
                    <img src="/img/hospitality.png" title="hospitality" className={imgStyle} />
                    <img src="/img/spa.png" title="spa and resort" className={imgStyle}/>
                    <img src="/img/transport.png" title="transport" className={imgStyle}/>
                    <img src="/img/industry.png" title="industry" className={imgStyle}/>
                    <img src="/img/store.png" title="store and retail" className={imgStyle}/>
                    <img src="/img/restaurant.png" title="restaurants" className={imgStyle}/>
                </div>*/}
                <p className="font-arial text-xl text-white w-full md:w-[85%] p-4 text-justify mb-7">
                    Ogni protocollo permetti di misurare con rigore scientifico le emissioni di CO2 in base alla struttura:<br />
                    <strong>HOSPITALITY</strong>: hotel, B&B, residence e qualsiasi struttura ricettiva.<br />
                    <strong>SPA & WELLNESS</strong>: centri wellness, piscine ed ogni edificio dedicato al relax e alla cura della persona.<br />
                    <strong>TRASPORTI</strong>: ridurre le emissioni in un settore fondamentale per le organizzazione rappresenta una sfida al giorno d’oggi.<br />
                    <strong>INDUSTRY</strong>: misurazione scientifica di qualsiasi sito produttivo, tenendo conto delle specificità dei macchinari utilizzati e della filiera oggetto dello studio.<br />
                    <strong>STORE</strong>: dedicato a qualsiasi struttura per la vendita, dalla piccola bottega al grande centro commerciale.<br />
                    <strong>BAR & REASTAURANT</strong>: dedicato a risortanti, bar, pub e strutture dedicate a ricevimenti.<br /><br />

                    Il protocollo, come previsto dai più <strong>rigorosi standard internazionali</strong>,
                    si basa su <strong>dati certi e facilmente reperibili che riguardano
                        l’edificio, gli impianti presenti</strong> (caldaie o altri sistemi per
                    il riscaldamento, sistemi per il raffrescamento e per la produzione di
                    acqua calda sanitaria, più eventuali impianti fotovoltaici) <strong>e i
                        vettori energetici</strong> che alimentano i sistemi.
                </p>
            </div>
        </div>
    );
}

export default Protocolli;