import React, { useEffect, useState } from "react";
import QuantitySelector from "./quantitySelector";
import MessagePopUp from "./messagePopUp";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import { MutatingDots } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';

function Carrello() {
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { cartProducts, setCartProducts, quantities, setQuantities, isEmpty, setIsEmpty } = useRecoveryContext();
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [promoCategory, setPromoCategory] = useState('');

    const navigate = useNavigate();


    useEffect(() => {
        const getCartProducts = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get('http://localhost:8080/api/fetch-user-cart', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    setCartProducts(response.data.cart);
                    const initialQuantities = response.data.cart.reduce((acc, product) => {
                        acc[product.product_id] = product.quantity;
                        return acc;
                    }, {});
                    setQuantities(initialQuantities);
                    setIsEmpty(response.data.cart.length === 0); // Imposta isEmpty qui
                }
            } catch (error) {

                if (error.response && error.response.status === 403) {
                    navigate('/login');
                    return;
                }
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        getCartProducts();
    }, [setCartProducts, setQuantities, setIsEmpty]);

    const handleQuantityChange = async (productId, newQuantity) => {
        const token = localStorage.getItem('token');

        try {
            const response = await axios.put(`http://localhost:8080/api/update-quantity/${productId}`, { quantity: newQuantity }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setQuantities(prevQuantities => ({
                    ...prevQuantities,
                    [productId]: newQuantity
                }));
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    const handleRemoveProduct = async (productId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.delete(`http://localhost:8080/api/remove-from-cart/${productId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setCartProducts(prevProducts => {
                    const updatedProducts = prevProducts.filter(product => product.product_id !== productId);
                    setIsEmpty(updatedProducts.length === 0); // Verifica se il carrello è vuoto
                    return updatedProducts;
                });
                setQuantities(prevQuantities => {
                    const { [productId]: _, ...rest } = prevQuantities;
                    return rest;
                });
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleCheckout = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        const productsData = cartProducts.map(product => ({
            id: product.product_id,
            name: product.name,
            price: product.price,
            quantity: quantities[product.product_id]
        }));

        localStorage.setItem('productsIDs', JSON.stringify(cartProducts.map(product => product.product_id)));
        console.log(JSON.parse(localStorage.getItem('productsIDs')));

        // Prepara i dati per il checkout, includendo il promoCode
        const checkoutData = {
            products: productsData,
            promoCode: promoCode
        };

        try {

            console.log(promoCode);

            const response = await axios.post('http://localhost:8080/api/get-code-id', { code: promoCode }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                console.log(response.data);
                console.log(response.data.codeId);
                localStorage.setItem('codeId', response.data.codeId);
            }

        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }

        try {
            // Esegui il checkout e redirigi l'utente alla pagina appropriata
            const response = await axios.post('http://localhost:8080/api/checkout-session', checkoutData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        } finally {
            setIsLoading(false);
        }
    };

    const applyPromoCode = async () => {
        const token = localStorage.getItem('token');

        try {
            const response = await axios.post('http://localhost:8080/api/apply-promo-code', { code: promoCode }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setMessagePopUp(response.data.msg);
                setButtonPopup(true);
                setPromoCategory(response.data.used_by);
                setDiscount(response.data.discount);
                console.log("Discount: ", response.data.discount);
                console.log("Used by: ", response.data.used_by);
            }

        } catch (error) {
            setPromoCode('');
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    function getDescrizioneCategoria(category, option) {
        if (category === "Certificazione hotel") {
            return `stanze: ${option}`;
        } else if (category === "Certificazione spa e resort") {
            return `servizi: ${option}`;
        } else if (category === "Certificazione trasporti") {
            return `veicoli: ${option}`;
        } else if (category === "Certificazione industria") {
            return `impianti: ${option}`;
        } else if (category === "Certificazione store e retail") {
            return `negozi: ${option}`;
        } else {
            return `coperti: ${option}`;
        }
    }

    const calculateSubtotal = () => {
        return cartProducts.reduce((total, product) => total + (product.price * (quantities[product.product_id] || 1)), 0);
    }

    const calculateDiscount = (price) => {
        return price * (discount / 100);
    }
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        if (promoCategory === "Tutti") {
            return subtotal - calculateDiscount(subtotal); // Applica lo sconto su tutto il totale
        } else {
            return subtotal;
        }
    };

    return (
        <div className="w-full min-h-screen">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <div className="w-full p-5">
                <h1 className="text-arial text-3xl text-center font-bold pb-5">CARRELLO</h1>
                {isEmpty ? (
                    <div>
                        <div className="text-arial text-3xl text-center">Nessun articolo presente</div>
                        <img src="/img/sad_cart.png" alt="empty carrello" className="w-[250px] h-[250px] mx-auto" />
                    </div>
                ) : (
                    cartProducts.map((product) => (
                        <React.Fragment key={product.product_id}>
                            <div className="w-full h-auto flex flex-col md:flex-row items-center justify-center px-5 mx-auto gap-5 transition-all duration-500 ease-out">
                                <div className="w-[250px] h-[200px] overflow-hidden mt-3 mb-3">
                                    <img
                                        src={`http://localhost:8080/uploaded_img/${product.image}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                                <div className="w-full md:w-[60%] p-4 flex flex-col gap-5 text-arial text-xl text-left">
                                    <div className="flex flex-col lg:flex-row items-start justify-between">
                                        <p className="font-bold text-left">{product.name}</p>
                                        <p className="flex items-end">{(product.price * (quantities[product.product_id] || 1)).toFixed(2)} €</p> {/* Calcolo dinamico del prezzo totale */}
                                    </div>
                                    <p>{getDescrizioneCategoria(product.category, product.option)}</p>
                                    <div className="">
                                        <QuantitySelector
                                            value={quantities[product.product_id] || 1}
                                            onValueChange={(newQuantity) => handleQuantityChange(product.product_id, newQuantity)}
                                        />
                                    </div>
                                    <div onClick={() => handleRemoveProduct(product.product_id)} className="underline text-[#2d7044] hover:text-red-500 cursor-pointer transition-colors duration-300 ease-in-out">Rimuovi articolo</div>
                                </div>
                            </div>
                            <hr className="w-full md:w-[80%] border-b-2 border-black mx-auto" />
                        </React.Fragment>
                    ))
                )}
            </div>
            <div className="w-[90%] md:w-[70%] h-auto p-5 text-arial text-xl mx-auto">
                <p>Codice Promozionale</p>
                <div className="w-full h-auto flex flex-col md:flex-row gap-4 md:gap-12 items-center justify-between mb-10">
                    <input type="text" id="promocode" name="promocode" className='bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5' onChange={(e) => setPromoCode(e.target.value)} />
                    <button type="submit" className="w-full md:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" onClick={applyPromoCode}>Applica</button>
                </div>
                {<div className="w-full h-auto flex flex-row items-center justify-between">
                    <p>Subtotale</p>
                    <p>{calculateSubtotal().toFixed(2)} €</p>
                </div>}
                <div className="w-full h-auto flex flex-row items-center justify-between">
                    {/*promoCategory === "Tutti" && <p>- Sconto {discount}% applicato su tutti i prodotti <br /> (riduzione applicata in fase di checkout)</p>*/}
                    {promoCategory === "Tutti" && (
                        <div className="w-full flex flex-col md:flex-row justify-between">
                            <div>Sconto {discount}% applicato su tutte le certificazioni</div>
                            <div>
                                -{(calculateSubtotal() * (discount / 100)).toFixed(2)} €
                            </div>
                        </div>

                    )}
                    {
                        promoCategory === "Certificazione trasporti" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione trasporti")
                                .map(product => (
                                    <div key={product.id} className="w-full flex flex-col md:flex-row justify-between">
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                    {
                        promoCategory === "Certificazione spa e resorts" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione spa e resorts")
                                .map(product => (
                                    <div key={product.id} className="w-full flex flex-col md:flex-row justify-between">
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                    {
                        promoCategory === "Certificazione hotel" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione hotel")
                                .map(product => (
                                    <div key={product.id}>
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                    {
                        promoCategory === "Certificazione industria" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione industria")
                                .map(product => (
                                    <div key={product.id} className="w-full flex flex-col md:flex-row justify-between">
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                    {
                        promoCategory === "Certificazione store e retail" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione store e retail")
                                .map(product => (
                                    <div key={product.id} className="w-full flex flex-col md:flex-row justify-between">
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                    {
                        promoCategory === "Certificazione bar e ristoranti" && (
                            cartProducts
                                .filter(product => product.category === "Certificazione bar e ristoranti")
                                .map(product => (
                                    <div key={product.id} className="w-full flex flex-col md:flex-row justify-between">
                                        <div>Sconto {discount}% applicato su {product.name}</div>
                                        <div>
                                            -{(product.price * (discount / 100) * (product.quantity || 1)).toFixed(2)} €
                                        </div>
                                    </div>
                                ))
                        )
                    }

                </div>
                <hr className="w-full border-[1.5px] border-black" />
                <div className="w-full h-auto flex flex-row items-center justify-between font-bold">
                    <p>Totale</p>
                    {/*<p>{(calculateTotal() - calculateDiscount()).toFixed(2)} €</p>*/}
                    <p>{calculateTotal().toFixed(2)} €</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center mt-5">
                        <MutatingDots
                            height="100"
                            width="100"
                            color="#2d7044"
                            secondaryColor='#2d7044'
                            radius='12.5'
                            ariaLabel="mutating-dots-loading"
                            visible={true}
                        />
                    </div>
                ) : (
                    <button
                        type="submit"
                        className="relative left-[50%] translate-x-[-50%] w-full md:w-auto mt-5 p-1 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black"
                        onClick={handleCheckout}
                    >
                        Concludi il pagamento
                    </button>
                )}
            </div>
        </div>
    );
}

export default Carrello;

