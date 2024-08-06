import React from "react";
import QuantitySelector from "./quantitySelector";
import { Link } from "react-router-dom";

function Carrello() {
    return (
        <div className="w-full min-h-screen">
            <div className="w-full p-5">
                <h1 className="text-arial text-3xl text-center font-bold pb-5">CARRELLO</h1>
                <div className="w-full h-auto flex flex-col md:flex-row items-center justify-center px-5 mx-auto gap-5">
                    <div className="w-[250px]">
                        <img src="/img/hospitality-certificate.png" alt="certification image" className="rounded-lg"/>
                    </div>
                    <div className="w-full md:w-[60%] p-8 flex flex-col gap-5 text-arial text-xl text-left">
                        <div className="flex flex-col lg:flex-row items-center justify-between text-center">
                            <p className="font-bold">Green Visa Certificate - Protocollo Hospitality</p>
                            <p>350,00 €</p>
                        </div>
                        <p>Stanze: 1 – 24</p>
                        <div className="z-10">
                            <QuantitySelector/>
                        </div>
                        <a href="#" className="underline text-[#2d7044] hover:text-red-500 cursor-pointer z-10 transition-colors duration-300 ease-in-out">Rimuovi articolo</a>
                    </div>
                </div>
                <hr className="w-full md:w-[75%] border-b-2 border-black mx-auto"/>
            </div>

            <div className="w-[90%] md:w-[70%] h-auto p-5 text-arial text-xl mx-auto">
                <p>Codice Promozionale</p>
                <div className="w-full h-auto flex flex-col md:flex-row gap-4 md:gap-12 items-center justify-between">
                    <input type="text" id="promocode" name="promocode" className='w-full p-2 bg-[#d9d9d9]'/>
                    <button type="submit" className="w-full md:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">Applica</button>
                </div>
                <div className="w-full h-auto flex flex-row items-center justify-between">
                    <p>Subtotale</p>
                    <p>350,00 €</p>
                </div>
                <div className="w-full h-auto flex flex-row items-center justify-between font-bold">
                    <p>Totale</p>
                    <p>350,00 €</p>
                </div>
                <button type="submit" className="relative left-[50%] translate-x-[-50%] w-full md:w-[30%] mt-5 p-1 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black"><Link to="/Payment">Concludi il pagamento</Link></button>
            </div>
        </div>
    );
}

export default Carrello;
