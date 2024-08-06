import React from "react";
import Slider from "react-slick/lib/slider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Items = [

    {
        id: 1,
        title: "ACCRESCI LA TUA GREEN REPUTATION",
        text: "Accresci la tua green reputation e preparati ad un significativo incremento del tuo fatturato. Oggi i consumatori sono sempre più attenti all’impatto ambientale dei beni e dei servizi che acquistano: comunicare il proprio impegno ambientale, ti consentirà di essere premiato da un mercato sempre più attento alla salute del Pianeta."
    },
    {
        id: 2,
        title: "ENTRA NEL GREEN VISA NETWORK",
        text: "Ricevi aggiornamenti sulle nuove buone pratiche Green, partecipa ai GREEN VISA Awards e diventa protagonista degli eventi GREEN VISA sulla Green Economy",
    },
    {
        id: 3,
        title: "COMUNICA L’ANIMA GREEN DELLA TUA AZIENDA",
        text: <> Riceverai il kit GREEN VISA, che comprende il tuo attestato di sostenibilità, una vetrofania e una bandiera GREEN VISA e tutto il materiale per la tua comunicazione smart, web & social. <br/> <br/>Il nostro staff sarà a tua disposizione per pianificare una compagna di green marketing su misura</>,
    },
    {
        id: 4,
        title: "OTTIENI LA TUA CERTIFICAZIONE CON UN CLICK",
        text: "In autonomia o con il supporto del nostro staff, inserisci sul portale i dati che consentono al nostro organismo di valorizzare il tuo impegno a favore della sostenibilità"
    }
]

const NextArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            className="absolute top-1/2 right-0 z-10 w-16 h-16 flex items-center justify-center cursor-pointer"
            style={{ transform: 'translateY(-50%)' }}
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};

const PrevArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            className="absolute top-1/2 left-0 z-10 w-16 h-16 flex items-center justify-center cursor-pointer"
            style={{ transform: 'translateY(-50%)' }}
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </div>
    );
};

function Vantaggi() {
    const Settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: document.body.clientWidth <= 800 ? 1 : 2,
        slidesToScroll: document.body.clientWidth <= 800 ? 1 : 2,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };


    return (
        <div className="p-0 pt-3">
            <h1 className="font-arial text-3xl text-center font-bold mb-3 p-4">I VANTAGGI DEL GREEN VISA</h1>
            <Slider {...Settings}>
                {Items.map(item => (
                    <div key={item.id} className="items-center gap-4 mb-0 w-[40%] mx-auto p-0 px-14">
                        <div className="w-[100%]">
                            <h3 className="text-xl md:text-2xl font-arial font-bold text-center mb-2">{item.title}</h3>
                            <p className="text-xl font-arial text-justify">{item.text}</p>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default Vantaggi;
            