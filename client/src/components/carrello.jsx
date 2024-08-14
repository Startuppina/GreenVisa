import React, { useEffect, useState } from "react";
import QuantitySelector from "./quantitySelector";
import { Link } from "react-router-dom";
import MessagePopUp from "./messagePopUp";
import axios from "axios";

function Carrello() {
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState('');
    const [cartProducts, setCartProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [removingProductId, setRemovingProductId] = useState(null);


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
                    // Initialize quantities
                    const initialQuantities = response.data.cart.reduce((acc, product) => {
                        acc[product.id] = product.quantity; // Assuming each product has a unique id
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
    }, []);

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
        setRemovingProductId(productId);
        
        // Attendi il completamento dell'animazione
        setTimeout(async () => {
            const token = localStorage.getItem('token');
    
            try {
                const response = await axios.delete(`http://localhost:8080/api/remove-from-cart/${productId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setCartProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
                    setQuantities(prevQuantities => {
                        const { [productId]: _, ...rest } = prevQuantities;
                        return rest;
                    });
                }
            } catch (error) {
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            } finally {
                setRemovingProductId(null);
            }
        }, 300); // Durata dell'animazione in millisecondi
    }
    

    const calculateSubtotal = () => {
        return cartProducts.reduce((total, product) => total + (product.price * (quantities[product.id] || 1)), 0);
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
                {cartProducts.map((product) => (
                    <React.Fragment key={product.id}>
                        <div className="w-full h-auto flex flex-col md:flex-row items-center justify-center px-5 mx-auto gap-5">
                            <div className="w-[250px]">
                                <img src={`http://localhost:8080/uploaded_img/${product.image}`} alt={product.name} className="rounded-lg"/>
                            </div>
                            <div className="w-full md:w-[60%] p-8 flex flex-col gap-5 text-arial text-xl text-left">
                                <div className="flex flex-col lg:flex-row items-start justify-between">
                                    <p className="font-bold text-left">{product.name}</p>
                                    <p className="flex items-end">{product.price} €</p>
                                </div>
                                <p>Stanze: 1 – 24</p>
                                <div className="z-10">
                                    <QuantitySelector
                                        value={quantities[product.id] || 1}
                                        onValueChange={(newQuantity) => handleQuantityChange(product.id, newQuantity)}
                                    />
                                </div>
                                <div onClick={() => handleRemoveProduct(product.id)} className="underline text-[#2d7044] hover:text-red-500 cursor-pointer z-10 transition-colors duration-300 ease-in-out">Rimuovi articolo</div>
                            </div>
                        </div>
                        <hr className="w-full md:w-[80%] border-b-2 border-black mx-auto"/>
                    </React.Fragment>
                ))}
            </div>

            <div className="w-[90%] md:w-[70%] h-auto p-5 text-arial text-xl mx-auto">
                <p>Codice Promozionale</p>
                <div className="w-full h-auto flex flex-col md:flex-row gap-4 md:gap-12 items-center justify-between">
                    <input type="text" id="promocode" name="promocode" className='w-full p-2 bg-[#d9d9d9]'/>
                    <button type="submit" className="w-full md:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">Applica</button>
                </div>
                <div className="w-full h-auto flex flex-row items-center justify-between">
                    <p>Subtotale</p>
                    <p>{calculateSubtotal().toFixed(2)} €</p>
                </div>
                <div className="w-full h-auto flex flex-row items-center justify-between font-bold">
                    <p>Totale</p>
                    <p>{calculateTotal().toFixed(2)} €</p>
                </div>
                <button type="submit" className="relative left-[50%] translate-x-[-50%] w-full md:w-[30%] mt-5 p-1 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black"><Link to="/Payment">Concludi il pagamento</Link></button>
            </div>
        </div>
    );
}

export default Carrello;
