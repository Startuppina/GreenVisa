import React from "react";

function Plate() {

    return (
        <div className="p-6 rounded-lg mx-4 md:mx-14 mt-4 text-xl ">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="w-full h-auto flex justify-center">
                    <img src="/img/plate.png" alt="plate" className="max-w-full max-h-[300px] object-cover rounded-lg shadow-md transform transition-transform hover:scale-105" />
                </div>
                <div className="flex flex-col items-start gap-6">
                    <h1 className="font-bold text-2xl lg:text-3xl text-center lg:text-left text-[#333]">
                        Acquista la tua targa per la certificazione GREEN VISA
                    </h1>
                    <div className="text-3xl font-semibold text-center lg:text-left text-[#2d7044]">
                        29,00 €
                    </div>
                    <p className="leading-relaxed text-justify text-[#555]">
                        Comunica alla tua clientela il tuo impegno green e la tua appartenenza al network GREEN VISA, esponendo un’elegante targa personalizzata.
                    </p>
                    <p className="leading-relaxed text-justify text-[#555]">
                        Targa in metacrilato personalizzata, in quadricromia. Formato 22,5 cm X 16,5 cm, spessore 6 mm.
                    </p>
                    <p className="font-semibold text-center lg:text-left text-[#2d7044]">
                        <strong>Il prodotto è acquistabile dopo il conseguimento della certificazione GREEN VISA.</strong>
                    </p>
                    <button className="bg-[#2d7044] text-white border-2 border-[#2d7044] px-6 py-3 rounded-lg font-bold text-xl hover:bg-white hover:text-[#2d7044] transition-colors duration-300">
                        Acquista ora
                    </button>
                </div>
            </div>
        </div>


    );
}

export default Plate;