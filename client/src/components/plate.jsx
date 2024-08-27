import React from "react";

function Plate() {

    return (
        <div className="bg-[#D3BC8D] p-6 rounded-lg mx-4 md:mx-14 mt-4 text-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="w-full h-auto flex justify-center">
                    <img src="/img/plate.png" alt="plate" className="max-w-full max-h-[300px] object-cover rounded-lg shadow-lg" />
                </div>
                <div className="flex flex-col items-start gap-6">
                    <h1 className="font-bold text-2xl lg:text-3xl text-center lg:text-left">
                        Acquista la tua targa per la certificazione GREEN VISA
                    </h1>
                    <div className="text-2xl font-semibold text-center lg:text-left">
                        29,00 €
                    </div>
                    <p className="leading-relaxed text-justify">
                        Comunica alla tua clientela il tuo impegno green e la tua appartenenza al network GREEN VISA, esponendo un’elegante targa personalizzata.
                    </p>
                    <p className="leading-relaxed text-justify">
                        Targa in metacrilato personalizzata, in quadricromia. Formato 22,5 cm X 16,5 cm, spessore 6 mm.
                    </p>
                    <p className="font-semibold text-center lg:text-left">
                        <strong>Il prodotto è acquistabile dopo il conseguimento della certificazione GREEN VISA.</strong>
                    </p>
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-bold text-xl hover:bg-black hover:text-white transition-colors">
                        Acquista ora
                    </button>
                </div>
            </div>
        </div>

    );
}

export default Plate;