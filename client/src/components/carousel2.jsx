import React from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';

const descItems = [
    {
        title: "COS'È GREEN VISA",
        text: <>Green Visa è una certificazione indipendente per le migliori pratiche nell’economia circolare, green economy e efficienza energetica. È una certificazione volontaria che promuove la sostenibilità e il rispetto ambientale, richiedendo solo una registrazione online.</>,
        image: "/img/eolic.jpg",
    },
    {
        title: "PERCHÈ SCEGLIERE GREEN VISA",
        text: <>La certificazione Green Visa è molto riconoscibile e aiuta le imprese a comunicare il loro impegno per la sostenibilità, rispondendo alle richieste dei consumatori di ridurre l’impronta ambientale.</>,
        image: "/img/plant.jpg",
    },
    {
        title: "COME FUNZIONA GREEN VISA",
        text: <>La certificazione inizia con un questionario che fornisce una diagnosi energetico-ambientale e un punteggio. Segue una visita ispettiva e un audit. Dopo la certificazione, si ricevono una targa e materiale promozionale. Lo staff supporta le imprese nella transizione ecologica.</>,
        image: "/img/heart-first.jpg",
    },
    {
        title: "A CHI SI RIVOLGE GREEN VISA",
        text: <>Green Visa è adattato a diversi settori con protocolli specifici e valuta l’impatto ambientale delle imprese con parametri internazionali. È accessibile a tutte le aziende che vogliono mostrare i loro progressi nella sostenibilità.</>,
        image: "/img/eco-building.jpg",
    },
];


const buttonStyle = {
    width: "30px",
    background: 'transparent',
    border: '0px',
    cursor: 'pointer',
    margin: '0 0px',
};

const properties = {
    prevArrow: <button style={buttonStyle}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg></button>,

    nextArrow: <button style={buttonStyle}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg></button>,
    transitionDuration: 300,
    duration: 3000,
    easing: 'ease',
};

function Carousel() {
    return (
        <div className="w-[95%] m-auto">
            <Slide {...properties}>
                {descItems.map((item, index) => (
                    <div
                        className="w-full h-auto flex flex-col lg:flex-row items-center justify-center p-4"
                        key={index}
                    >
                        <div className="w-full lg:w-[65%] h-auto lg:h-[40vh] px-4 flex flex-col items-center justify-center">
                            <h1 className="font-arial text-2xl sm:text-xl md:text-2xl lg:text-3xl text-center font-bold mb-4">
                                {item.title}
                            </h1>
                            <p className="text-justify text-lg sm:text-base md:text-lg lg:text-xl">
                                {item.text}
                            </p>
                        </div>
                        <div className="w-[90%] lg:w-[30%] lg:h-[250px] hidden lg:block">
                            <img
                                className="w-full h-full object-cover rounded-lg"
                                src={item.image}
                                alt="slide"
                            />
                        </div>
                    </div>
                ))}
            </Slide>
        </div>
    );
}

export default Carousel;