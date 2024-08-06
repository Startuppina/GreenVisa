import React from "react";

function Payment_cart() {
    return (
        <>
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-arial text-3xl text-center font-bold pb-6 w-full">Riepilogo Ordine</h1>

            <div className="w-full flex flex-row items-center justify-between gap-4 pb-3">
                <div className="w-[250px]">
                    <img src="/img/hospitality-certificate.png" alt="certification image" className="rounded-lg"/>
                </div>
                <div className="mb-4 text-right">
                    <p className="font-semibold">Green Visa Certificate - Protocollo Hospitality</p>
                    <p>Stanze: 1 – 24</p>
                    <p>Quantità: 1</p>
                    <p className="font-bold">350,00 €</p>
                </div>
            </div>
            <hr className="w-full border-b-2 border-black mx-auto mb-4"/>

            <div className="flex flex-row items-center justify-between w-full">
                <p className="text-center font-bold text-xl md:text-2xl">Totale:</p>
                <p className="text-center text-xl font-bold md:text-2xl">350,00 €</p>
            </div>

        </div>
        </>
    );
}

export default Payment_cart;