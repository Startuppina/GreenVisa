import React, { useState, useEffect } from "react";
import Payment_cart from "./payment_cart";
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { Link } from "react-router-dom";

function Payment() {
    const [showCartButton, setShowCartButton] = useState(window.innerWidth <= 1040);
    const [slideCartButton, setSlideCartButton] = useState(false);
    const [openCart, setOpenCart] = useState(false);
    const [state, setState] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
        focus: '',
        nome: '',
        cognome: '',
    });

    const formatCardNumber = (value) => {
        // remove all characters that are not digits
        let numbers = value.replace(/\D/g, '');
        // add a space after every four digits
        return numbers.replace(/(.{4})/g, '$1 ').trim();

        //Trim remove spaces at the beginning and the end of the string
        //$1 is a capture group which is added a space
        //g is for global
        // /\D/g is a regular expression which matches any non-digit
    };

    const formatExpiryDate = (value) => {
        // remove all characters that are not digits
        let numbers = value.replace(/\D/g, '');
        // add a slash after every two digits
        if (numbers.length >= 2) {
            return numbers.slice(0, 2) + '/' + numbers.slice(2); // slice extracts a part of a string
        }
        return numbers;
    };

    const formatCvc = (value) => {
        // remove all characters that are not digits
        return value.replace(/\D/g, '');
    };

    const handleInputChange = (evt) => {
        const { name, value } = evt.target;
        let updatedValue = value;

        if (name === "number") {
            updatedValue = formatCardNumber(value);
        } else if (name === "expiry") {
            updatedValue = formatExpiryDate(value);
        } else if (name === "cvc") {
            updatedValue = formatCvc(value);
        }

        setState((prev) => {
            const updatedState = { ...prev, [name]: updatedValue };
            if (name === "nome" || name === "cognome") {
                updatedState.name = `${updatedState.nome} ${updatedState.cognome}`;
            }
            // if i update the name, i need to update the name in the state of the card. Also surname
            return updatedState;
        });
    };

    const handleInputFocus = (evt) => {
        setState((prev) => ({ ...prev, focus: evt.target.name }));
    }

    useEffect(() => {
        const handleResize = () => {
            setShowCartButton(window.innerWidth >= 1040); //mean that if the window is bigger than 1040px, show the cart button
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        // Check if the openCart variable is true
        if (openCart) {
            // If openCart is true, add the 'no-scroll' class to the body element
            document.body.classList.add('no-scroll');
        } else {
            // If openCart is false, remove the 'no-scroll' class from the body element
            document.body.classList.remove('no-scroll');
        }
    }, [openCart]);

    useEffect(() => {
        setShowCartButton(window.innerWidth >= 1040);
    }, []);

    // This useEffect hook sets up an event listener for the 'keydown' event on the window object
    useEffect(() => {
        // Function to handle the keydown event
        const handleKeyDown = (e) => {
            // Check if the pressed key is the 'Delete' key
            if (e.key === "Delete") {
                // Get the currently active element
                const activeElement = document.activeElement;
                // If the active element is an input field, clear its value
                if (activeElement && activeElement.tagName === "INPUT") {
                    activeElement.value = "";
                    // Trigger the handleInputChange function with the active element as the target
                    handleInputChange({ target: activeElement });
                }
            }
        };

        // Add the event listener for 'keydown' with the handleKeyDown function
        window.addEventListener("keydown", handleKeyDown);

        // Return a cleanup function that removes the event listener when the component unmounts
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []); // Empty array means the effect runs only once on mount

    return (
        <>
            <div
                className={`fixed right-6 z-20 top-1/3 bg-[#2d7044] w-20 h-24 flex items-center justify-center rounded-lg cursor-pointer transition-transform duration-300 ease-in-out ${
                    showCartButton ? "hidden" : ""
                } ${slideCartButton ? "translate-x-10" : "translate-x-full"}`}
                onMouseOver={() => setSlideCartButton(true)}
                onMouseLeave={() => setSlideCartButton(false)}
                onClick={() => setOpenCart(!openCart)}
            >
                <div className="relative flex items-center justify-center w-full h-full">
                    <img src="/public/img/arrow.png" alt="open cart" className="w-8 rotate-180" />
                    <p className="absolute left-1 top-0 text-white text-xl rotate-90 origin-left ml-2 ">
                        Carrello
                    </p>
                </div>
            </div>

            <div
                className={`z-20 fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col md:flex-row justify-between overflow-y-auto bg-white p-4 transition-transform duration-300 ${
                    openCart ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="fixed left-0 z-20 top-1/3 bg-[#2d7044] w-20 h-24 p-2 flex flex-col items-center justify-center rounded-lg cursor-pointer"
                    onClick={() => setOpenCart(!openCart)}>
                    <img src="/public/img/arrow.png" alt="close cart" className="w-8 rotate-0" />
                    <p className="text-white text-xl">Chiudi</p>
                </div>
                <div className="ml-20 w-[75%]">
                    <Payment_cart />
                </div>
            </div>

            <div className="w-full px-4 md:px-8 lg:px-16 text-arial text-xl flex flex-col lg:flex-row gap-5 justify-between">
                <div className="w-full lg:w-1/2 flex flex-col">
                    <h1 className="text-3xl font-bold text-center pb-5">PAGAMENTO</h1>
                    <div className="flex flex-col justify-center md:flex-row md:justify-between z-10">
                        <div className="text-2xl font-bold">Informazioni di contatto</div>
                        <div className='md:text-right'>
                            Non hai fatto l'accesso? <span className='text-[#2d7044] font-bold'><Link to="/Login">Accedi</Link></span>
                        </div>
                    </div>
                    <p className="mt-5 mb-5">Utilizzeremo questa email per inviare i dettagli e gli aggiornamenti relativi al tuo ordine.</p>

                    <form className="w-full z-10 ">
                        <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3" placeholder="Email" />

                        <div className="flex items-center justify-between mb-5">
                            <input
                                type="checkbox"
                                name="newsletter"
                                id="newsletter"
                                style={{ width: "20px", height: "20px" }}
                            />
                            <p className="ml-2 text-right">Sì, voglio ricevere mail esclusive con offerte e informazioni sui prodotti.</p>
                        </div>

                        <h1 className="text-2xl font-bold mb-3">Indirizzo di fatturazione</h1>
                        <p className="mb-4">Inserisci l'indirizzo di fatturazione che corrisponde al tuo metodo di pagamento.</p>

                        <div className="flex flex-col mb-5">
                            <div className="flex flex-col md:flex-row md:gap-3 mb-3 z-10">
                                <input
                                    type="text"
                                    name="nome"
                                    id="nome"
                                    placeholder="Nome"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3 md:mb-0"
                                    value={state.nome}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                />
                                <input
                                    type="text"
                                    name="cognome"
                                    id="cognome"
                                    placeholder="Cognome"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                    value={state.cognome}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                />
                            </div>
                            <input type="text" name="societa" id="societa" placeholder="Societa" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3" />
                            <input type="text" name="indirizzo" id="indirizzo" placeholder="Indirizzo" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3" />
                            <div className="flex flex-col md:flex-row md:gap-3 mb-3">
                                <input type="text" name="Paese_regione" id="Paese_regione" placeholder="Paese/Regione" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3 md:mb-0" />
                                <input type="text" name="Cap" id="Cap" placeholder="Cap" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5" />
                            </div>
                            <div className="flex flex-col md:flex-row md:gap-3 mb-3">
                                <input type="text" name="Provincia" id="Provincia" placeholder="Provincia" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 mb-3 md:mb-0" />
                                <input type="text" name="Citta" id="Citta" placeholder="Citta" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5" />
                            </div>
                            <input type="tel" name="telefono" id="telefono" placeholder="Telefono" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5" />
                        </div>

                        <div className="mb-4">
                            <h1 className="text-2xl font-bold mb-3">Opzioni di pagamento</h1>
                            <p className="mb-3">Carta di credito / Carta di debito</p>

                            <div className="w-full flex flex-col md:flex-row md:gap-3 items-center justify-center">
                                <Cards
                                    number={state.number}
                                    expiry={state.expiry}
                                    cvc={state.cvc}
                                    name={state.name}
                                    focused={state.focus}
                                />
                                <div className="w-full flex flex-col gap-3 items-center justify-center pt-3 md:pt-0">
                                    <div className="w-full flex flex-row gap-3 md:flex-col">
                                        <input
                                            type="text"
                                            name="number"
                                            placeholder="Card Number"
                                            inputMode="numeric"
                                            pattern="[0-9\s]{13,19}"
                                            maxLength={19}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                            value={state.number}
                                            onChange={handleInputChange}
                                            onFocus={handleInputFocus}
                                        />
                                    </div>
                                    <div className="w-full flex flex-row gap-3 md:flex-col">
                                        <input
                                            type="text"
                                            name="expiry"
                                            id="expiry"
                                            placeholder="MM/YYYY"
                                            inputMode="numeric"
                                            pattern="[0-9/]{5}"
                                            maxLength={7}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                            value={state.expiry}
                                            onChange={handleInputChange}
                                            onFocus={handleInputFocus}
                                        />
                                        <input
                                            type="text"
                                            name="cvc"
                                            placeholder="CVC"
                                            inputMode="numeric"
                                            pattern="[0-9]{3,4}"
                                            maxLength={3}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                            value={state.cvc}
                                            onChange={handleInputChange}
                                            onFocus={handleInputFocus}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h1 className="text-2xl font-bold mb-3">Aggiungi nota all'ordine</h1>
                            <textarea name="note" id="note" className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 resize-none h-[200px]" placeholder="Nota" />
                        </div>

                        <div className="flex items-center justify-between mb-5">
                            <input
                                type="checkbox"
                                name="terms"
                                id="terms"
                                style={{ width: "20px", height: "20px" }}
                            />
                            <p className="ml-2 text-right">Per procedere con il tuo acquisto, accetta i Termini e condizioni e <span className="text-[#2d7044] hover:text-red-500"><Link to="/Privacy">Informativa sulla privacy.</Link></span></p>
                        </div>

                        <div className="w-full flex flex-col lg:flex-row items-center justify-between pb-5">
                            <p className="w-full text-center lg:text-left underline cursor-pointer mb-3 hover:text-red-500"><Link to="/Carrello">Torna al carrello</Link></p>
                            <input type="submit" value={`Ordina - Totale 350€`} className=" p-2 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black" />
                        </div>
                    </form>
                </div>

                {showCartButton && (
                    <div className="w-full md:w-1/2 lg:w-2/5 h-auto p-5 text-arial text-xl">
                        <Payment_cart />
                    </div>
                )}
            </div>
        </>
    );
}

export default Payment;
