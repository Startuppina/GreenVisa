import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";

function Payment_cart() {
    const [cartProducts, setCartProducts] = useState([]);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState('');
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
                }
            } catch (error) {
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        getCartProducts();
    }, []);

    const calculateTotal = () => {
        return cartProducts.reduce((total, product) => { //total is the accumulator of the sum, product is the current element of the array cartProducts
            return total + (product.price * (product.quantity || 1));
        }, 0);
    }

    return (
        <>
        <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
            {messagePopUp}
        </MessagePopUp>
        <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-arial text-3xl text-center font-bold pb-6 w-full">Riepilogo Ordine</h1>

            {cartProducts.map((cartProduct) => (
                <div className="w-full flex flex-row items-center justify-between gap-4 pb-3" key={cartProduct.id}>
                    <div className="w-[250px]">
                        <img src={`http://localhost:8080/uploaded_img/${cartProduct.image}`} alt={cartProduct.name} className="rounded-lg"/>
                    </div>
                    <div className="mb-4 text-right">
                        <p className="font-semibold">{cartProduct.name}</p>
                        <p>Stanze: 1 – 24</p>
                        <p>Quantità: {cartProduct.quantity}</p>
                        <p className="font-bold">{cartProduct.price} €</p>
                    </div>
                </div>
            ))}
            
            <hr className="w-full border-b-2 border-black mx-auto mb-4"/>
            
            <div className="flex flex-row items-center justify-between w-full px-4">
                <p className="text-center font-bold text-xl md:text-2xl">Totale:</p>
                <p className="text-center text-xl font-bold md:text-2xl">{calculateTotal().toFixed(2)} €</p>
            </div>
        </div>
        </>
    );
}

export default Payment_cart;
