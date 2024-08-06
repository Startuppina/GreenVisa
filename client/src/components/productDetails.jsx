import React from "react";
import QuantitySelector from "./quantitySelector";
import Products from "./products";

function ProductDetails() {
    return (
        <>
        <div className="w-full h-auto flex flex-col lg:flex-row items-center mx-auto justify-center p-8">
            <div className="w-[400px]">
                <img src="/img/hospitality-certificate.png" alt="certification image" className="rounded-lg"/>
            </div>
            <div className="w-full md:w-[50%] p-4 lg:pl-20 flex flex-col items-center text-arial text-xl text-center">
                <h1 className="text-arial text-2xl text-center font-bold pb-5 w-full">Green Visa Certificate - Protocollo Hospitality</h1>
                <p className="m-4">350,00 € – 1.180,00 €</p>
                <p className="pb-5 w-[70%]">La certificazione editoriale Green Visa per la tua struttura ricettiva.</p>
                <div className="flex flex-row gap-5 items-center justify-center" style={{ justifyContent: 'space-between' }}>
                    <div className="font-bold">Stanze</div>
                    <div className="text-arial text-xl text-black items-center">
                        <select className="bg-white w-[200px] rounded-lg" name="rooms" id="rooms">
                            <option value="0">Scegli un'opzione</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-row items-center justify-center gap-5">
                    <QuantitySelector />
                    <button className="m-3 font-arial font-semibold text-xl w-auto p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">Aggiungi al carrello</button>
                </div>
                
                <p> COD: N/A Categoria: Certificazione Hotel Tag: hospitality, hotel </p>
            </div>
        </div>
        <div className="w-full h-auto md:p-8 text-arial text-xl text-black text-center flex flex-col gap-5 items-center">
            <h1 className="text-2xl font-bold">Info</h1>
            <p className="p-4 md:w-[40%] text-justify">Dopo l’acquisto riceverai sulla tua mail un link univoco e privato che ti darà accesso al questionario che ci consentirà di calcolare in tempo reale le emissioni di CO2 della tua struttura.</p>
        </div>
        <h1 className="text-3xl font-bold text-center">Altri prodotti</h1>

        <Products/>
        </>
    );
}

export default ProductDetails;