import React, { useState, useEffect } from "react";
import QuantitySelector from "./quantitySelector";
import Products from "./products";
import MessagePopUp from "./messagePopUp";
import CategoryBasedSelect from "./categoryBasedSelect";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import getPriceCategory from "./getPriceCategory";

function ProductDetails() {
    const [product, setProduct] = useState({});
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [quantity, setQuantity] = useState(1); // Usa quantity per gestire la quantità
    const [valueFromSelect, setValueFromSelect] = useState("");
    const [category, setCategory] = useState("");
    const { id } = useParams();
    const navigate = useNavigate();

    const handleSelectChange = (selectedValue) => {
        setValueFromSelect(selectedValue);
        console.log("Selezionato:", selectedValue);
    }

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity); // Aggiorna lo stato quantity con il valore dal QuantitySelector
    };

    useEffect(() => {
        const getProductDetails = async () => {

            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/product-details/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status === 200) {
                    setProduct(response.data.product);
                    setCategory(response.data.product.category);
                }
            } catch (error) {
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        getProductDetails();
    }, [id]);


    const handleCartInsertion = async () => {
        const token = localStorage.getItem("token");

        console.log("Valore di valueFromSelect prima dell'invio:", valueFromSelect);

        // Funzione per generare un identificatore unico (session_id) se non esiste già
        const getSessionID = () => {
            let sessionID = localStorage.getItem("session_id");
            if (!sessionID) {
                sessionID = '_' + Math.random().toString(36).substr(2, 9); // Genera session_id
                localStorage.setItem("session_id", sessionID);
            }
            return sessionID;
        };

        // Controllo se l'utente è autenticato
        const isAuthenticated = !!token;  // true se c'è un token, altrimenti false

        const cartData = {
            name: product.name,
            image: product.image,
            price: product.price,
            quantity: quantity,
            option: valueFromSelect,
            session_id: isAuthenticated ? null : getSessionID()  // Invia session_id per utenti anonimi
        };

        console.log(cartData);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/cart-insertion/${id}`, cartData, {
                headers: {
                    'Content-Type': 'application/json',
                    // Invia il token JWT solo se l'utente è autenticato
                    'Authorization': isAuthenticated ? `Bearer ${token}` : undefined
                }
            });

            if (response.status === 200) {
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
            }
        } catch (error) {
            // Gestione degli errori, es: token scaduto o errore generico
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };


    return (
        <>
            <div className="w-full h-auto md:p-8 text-arial text-xl text-black text-center flex flex-col gap-5 items-center">
                <h1 className="text-2xl font-bold">NOTA BENE</h1>
                <p className="p-4 w-full lg:w-[40%] text-justify">All'aquisto di una certificazione potrai registrare un solo edificio. Se desideri registrare più edifici l'aquisto dovrà essere ripetuto.</p>
            </div>
            <div className="w-full h-auto flex flex-col lg:flex-row items-center justify-center mx-auto p-4 lg:p-8 gap-6">
                <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                    {messagePopUp}
                </MessagePopUp>


                {/* Sezione immagine prodotto */}
                <div className="w-full max-w-lg lg:max-w-xl h-[250px] sm:h-[300px] lg:h-[400px] overflow-hidden">
                    <img
                        src={`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/uploaded_img/${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>

                {/* Sezione descrizione prodotto */}
                <div className="w-full max-w-lg p-4 flex flex-col items-center text-arial text-lg sm:text-xl text-center">
                    <h1 className="text-2xl font-bold pb-4 w-full">{product.name}</h1>
                    <p className="m-4">{getPriceCategory(product.category)}</p>
                    <p className="pb-5 w-full sm:w-[80%] lg:w-[70%]">{product.info}</p>

                    {/* Select per categoria e selezione quantità */}
                    <CategoryBasedSelect
                        onSelectChange={handleSelectChange}
                        value={valueFromSelect}
                        category={category}
                    />

                    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                        {/*<QuantitySelector
                            onValueChange={handleQuantityChange}
                            value={quantity}
                        />*/}
                        <button
                            className="font-arial font-semibold text-lg sm:text-xl w-auto px-4 py-2 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                            onClick={handleCartInsertion}
                        >
                            Aggiungi al carrello
                        </button>
                    </div>

                    {/* Dettagli aggiuntivi */}
                    <div className="mt-5 font-arial text-lg sm:text-xl text-black text-center">
                        COD: {product.cod} <br />
                        Categoria: {product.category} <br />
                        Tag: {product.tag}
                    </div>
                </div>
            </div>
            <div className="w-full h-auto md:p-8 text-arial text-xl text-black text-center flex flex-col gap-5 items-center">
                <h1 className="text-2xl font-bold">Info</h1>
                <p className="p-4 w-full lg:w-[40%] text-justify">Dopo l’acquisto riceverai sulla tua mail un link univoco e privato che ti darà accesso al questionario che ci consentirà di calcolare in tempo reale le emissioni di CO2 della tua struttura/azienda.</p>
            </div>
            <h1 className="text-3xl font-bold text-center">Altri prodotti</h1>

            <div className="w-full mx-auto">
                <Products />
            </div>
        </>
    );
}

export default ProductDetails;
