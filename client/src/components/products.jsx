import React, { useState, useEffect } from "react";
import Slider from "react-slick/lib/slider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";
import { swipeMove } from "react-slick/lib/utils/innerSliderUtils";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";

const NextArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            className="absolute top-1/2 right-[-45px] z-10 w-16 h-16 flex items-center justify-center cursor-pointer"
            style={{ transform: 'translateY(-50%)' }}
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};

const PrevArrow = (props) => {
    const { onClick } = props;
    return (
        <div
            className="absolute top-1/2 left-[-45px] z-10 w-16 h-16 flex items-center justify-center cursor-pointer"
            style={{ transform: 'translateY(-50%)' }}
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </div>
    );
};

function Products(){
    const [numProducts, setNumProducts] = useState(0); // number of products available on the database
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const navigate = useNavigate();

    const Settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: document.body.clientWidth <= 1380 ? document.body.clientWidth <= 600 ? 1 : 2 : 3,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

    useEffect(() => {

        const getProductsInfo = async () => {

            const token = localStorage.getItem("token");
            
            try {
                const response = await axios.get("http://localhost:8080/api/products-info", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                }

                });
                console.log(response.data);
                if (response.status === 200) {
                    setNumProducts(response.data.numProducts);
                
                }
            } catch (error) {
                setMessagePopUp(error.response?.data?.msg || error.message);
                setShowPopUp(true);
            }

        };

        getProductsInfo();

    }, []);



    return (
        <div className="mt-5">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <div className="w-full md:w-[97.5%] h-auto bg-[#2d7044] p-10 pb-16  md:rounded-lg md:m-4">
                <div className="flex flex-col gap-5 md:flex-row items-center justify-center pb-10 md:justify-between">
                    <div className="text-arial text-xl text-white">{numProducts} {numProducts === 1 ? "risultato" : "risultati"}</div>
                    <div className="text-arial text-xl text-black w-full md:w-auto">
                        <select className="bg-white w-[260px] h-10 rounded-lg relative left-1/2 translate-x-[-50%] text-center" name="sorting" id="sorting">
                            <option value="default">Ordinamento predefinito</option>
                            <option value="price-asc">Prezzo crescente</option>
                            <option value="price-desc">Prezzo decrescente</option>
                        </select>
                    </div>
                </div>

                <div className="">
                    <Slider {...Settings}>
                        <Link to="/ProductDetails">
                            <div className="w-full bg-[#2d7044] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="h-[35vh]">
                                    <img src="/img/hospitality-certificate.png" alt="img" className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div className="text-arial text-xl text-white font-bold text-center pt-3">Green Visa Protocollo Hospitality</div>
                                <div className="text-arial text-xl text-white text-center pt-2">350,00 € – 1.180,00 €</div>
                            </div>
                        </Link>
                        <Link to="/ProductDetails">
                            <div className="w-full bg-[#2d7044] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="h-[35vh]">
                                    <img src="/img/hospitality-certificate.png" alt="img" className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div className="text-arial text-xl text-white font-bold text-center pt-3">Green Visa Protocollo Hospitality</div>
                                <div className="text-arial text-xl text-white text-center pt-2">350,00 € – 1.180,00 €</div>
                            </div>
                        </Link>
                        <Link to="/ProductDetails">
                            <div className="w-full bg-[#2d7044] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="h-[35vh]">
                                    <img src="/img/hospitality-certificate.png" alt="img" className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div className="text-arial text-xl text-white font-bold text-center pt-3">Green Visa Protocollo Hospitality</div>
                                <div className="text-arial text-xl text-white text-center pt-2">350,00 € – 1.180,00 €</div>
                            </div>
                        </Link>
                    </Slider>
                </div>
            </div>

        </div>
    );
}

export default Products