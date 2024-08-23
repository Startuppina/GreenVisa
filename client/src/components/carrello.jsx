import React, { useEffect, useState } from "react";
import QuantitySelector from "./quantitySelector";
import { Link } from "react-router-dom";
import MessagePopUp from "./messagePopUp";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import { MutatingDots } from 'react-loader-spinner';

function Carrello() {
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { cartProducts, setCartProducts, quantities, setQuantities, isEmpty, setIsEmpty } = useRecoveryContext();
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);


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
                    if (response.data.count === 0) {
                        setIsEmpty(true);
                    } else {
                        setIsEmpty(false);
                    }

                    setCartProducts(response.data.cart);
                    const initialQuantities = response.data.cart.reduce((acc, product) => {
                        acc[product.product_id] = product.quantity;
                        return acc;
                    }, {});
                    setQuantities(initialQuantities);
                }
            } catch (error) {
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
                setCartProducts(prevProducts => prevProducts.filter(product => product.product_id !== productId));
                setQuantities(prevQuantities => {
                    const { [productId]: _, ...rest } = prevQuantities;
                    return rest;
                });
                if (cartProducts.length === 1) {
                    setIsEmpty(true);
                }
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
                setDiscount(response.data.discount);
            }

        } catch (error) {
            setPromoCode('');
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    }

    const calculateSubtotal = () => {
        return cartProducts.reduce((total, product) => total + (product.price * (quantities[product.product_id] || 1)), 0);
    }

    const calculateDiscount = () => {
        return calculateSubtotal() * (discount / 100);
    }
    const calculateTotal = () => {
        return calculateSubtotal(); // Add additional charges (like taxes) if applicable
    }

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
                                        <p className="flex items-end">{product.price} €</p>
                                    </div>
                                    <p>Stanze: 1 – 24</p>
                                    <div className="">
                                        <QuantitySelector
                                            value={quantities[product.product_id] || 1}
                                            onValueChange={(newQuantity) => handleQuantityChange(product.product_id, newQuantity)}
                                        />
                                    </div>
                                    <div onClick={() => handleRemoveProduct(product.product_id)} className="underline text-[#2d7044] hover:text-red-500 cursor-pointer transition-colors duration-300 ease-in-out">Rimuovi articolo</div>
                                </div>
                            </div>
                            <hr className="w-full md:w-[80%] border-b-2 border-black mx-auto"/>
                        </React.Fragment>
                    ))
                )}
            </div>
            <div className="w-[90%] md:w-[70%] h-auto p-5 text-arial text-xl mx-auto">
                <p>Codice Promozionale</p>
                <div className="w-full h-auto flex flex-col md:flex-row gap-4 md:gap-12 items-center justify-between mb-10">
                    <input type="text" id="promocode" name="promocode" className='bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5' onChange={(e) => setPromoCode(e.target.value)}/>
                    <button type="submit" className="w-full md:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" onClick={applyPromoCode}>Applica</button>
                </div>
                {/*<div className="w-full h-auto flex flex-row items-center justify-between">
                    <p>Subtotale</p>
                    <p>{calculateSubtotal().toFixed(2)} €</p>
                </div>*/}
                <div className="w-full h-auto flex flex-row items-center justify-between font-bold">
                    <p>Totale</p>
                    {/*<p>{(calculateTotal() - calculateDiscount()).toFixed(2)} €</p>*/}
                    <p>{calculateTotal().toFixed(2)} €</p>
                </div>
                <div className="w-full h-auto flex flex-row items-center justify-between">
                    <p>- Sconto {discount}% applicato sulle certificazioni compatibili <br/> (riduzione applicata in fase di checkout)</p>
                    
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center mt-5">
                        <MutatingDots 
                            height="100"
                            width="100"
                            color="#2d7044"
                            secondaryColor= '#2d7044'
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
