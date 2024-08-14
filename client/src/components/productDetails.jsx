import React, { useState, useEffect } from "react";
import QuantitySelector from "./quantitySelector";
import Products from "./products";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function ProductDetails() {
    const [product, setProduct] = useState({});
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [quantity, setQuantity] = useState(1); // Usa quantity per gestire la quantità
    const [valueFromSelect, setValueFromSelect] = useState(0);
    const { id } = useParams();
    const navigate = useNavigate();

    const handleSelectChange = (event) => {
        const selectedValue = event.target.value;
        setValueFromSelect(selectedValue);
    }

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity); // Aggiorna lo stato quantity con il valore dal QuantitySelector
    };

    useEffect(() => {
        const getProductDetails = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await axios.get(`http://localhost:8080/api/product-details/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.status === 200) {
                    setProduct(response.data.product);
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

    const cartData = {
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: quantity
    };

    try {
        const response = await axios.post(`http://localhost:8080/api/cart-insertion/${id}`, cartData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            setMessagePopUp(response.data.msg);
            setButtonPopup(true);
        }
    } catch (error) {
        setMessagePopUp(error.response?.data?.msg || error.message);
        setButtonPopup(true);
    }
};

    
    

    return (
        <>
        <div className="w-full h-auto flex flex-col lg:flex-row items-center mx-auto justify-center p-8">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <div className="w-[400px]">
                <img src={`http://localhost:8080/uploaded_img/${product.image}`} alt={product.name} className="rounded-lg"/>
            </div>
            <div className="w-full md:w-[50%] p-4 lg:pl-20 flex flex-col items-center text-arial text-xl text-center">
                <h1 className="text-arial text-2xl text-center font-bold pb-5 w-full">{product.name}</h1>
                <p className="m-4">{product.price}</p>
                <p className="pb-5 w-[70%]">{product.info}</p>
                <div className="flex flex-row gap-5 items-center justify-center" style={{ justifyContent: 'space-between' }}>
                    <div className="font-bold">Stanze</div>
                    <div className="text-arial text-xl text-black items-center">
                        <select className="bg-white w-[200px] rounded-lg" name="rooms" id="rooms" onChange={handleSelectChange}>
                            <option value="0">Scegli un'opzione</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-row items-center justify-center gap-5">
                    <QuantitySelector onValueChange={handleQuantityChange} value={quantity}/>
                    <button className="m-3 font-arial font-semibold text-xl w-auto p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" 
                        onClick={handleCartInsertion}
                    >Aggiungi al carrello</button>
                </div>
                
                <div className="font-arial text-xl text-black text-center"> COD: {product.cod} <br/> Categoria: {product.category} <br/> Tag: {product.tag} </div>
            </div>
        </div>
        <div className="w-full h-auto md:p-8 text-arial text-xl text-black text-center flex flex-col gap-5 items-center">
            <h1 className="text-2xl font-bold">Info</h1>
            <p className="p-4 md:w-[40%] text-justify">Dopo l’acquisto riceverai sulla tua mail un link univoco e privato che ti darà accesso al questionario che ci consentirà di calcolare in tempo reale le emissioni di CO2 della tua struttura/azienda.</p>
        </div>
        <h1 className="text-3xl font-bold text-center">Altri prodotti</h1>

        <div className="w-full mx-auto">
            <Products />
        </div>
        </>
    );
}

export default ProductDetails;
