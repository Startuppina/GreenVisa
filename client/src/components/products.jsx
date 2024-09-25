import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import getPriceCategory from "./getPriceCategory";

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

function Products() {
    const [numProducts, setNumProducts] = useState(0);
    const [products, setProducts] = useState([]);
    const [haveProducts, setHaveProducts] = useState(false);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [messageConfirm, setMessageConfirm] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const [value, setValue] = useState("");
    const [productOrdering, setProductOrdering] = useState("default");
    const navigate = useNavigate();

    useEffect(() => {
        const getProductsInfo = async () => {

            try {
                const response = await axios.get("http://localhost:8080/api/products-info", {
                    params: { order: productOrdering },
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status === 200) {
                    setNumProducts(response.data.numProducts);
                    if (response.data.numProducts > 0) {
                        setHaveProducts(true);
                    }
                    setProducts(response.data.products);
                }
            } catch (error) {
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        getProductsInfo();

    }, [productOrdering]);

    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            let newSlidesToShow = screenWidth <= 700 ? 1 : screenWidth <= 1380 ? 2 : 3;
            setSlidesToShow(newSlidesToShow);
        };

        handleResize(); // Call once to set the initial state
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const deleteProduct = async () => {

        const token = localStorage.getItem('token');
        if (!token) {
            setMessagePopUp('Token non trovato');
            setButtonPopup(true);
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-product/${productToDelete}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                navigate(0);
            }

        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }

    };

    const settings = {
        dots: true,
        infinite: products.length > slidesToShow,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        centerMode: slidesToShow < products.length,
        centerPadding: '0px',
    };

    const handleSelect = (event) => {
        setValue(event.target.value);

        if (event.target.value === "price-asc") {
            setProductOrdering("asc");
        } else if (event.target.value === "price-desc") {
            setProductOrdering("desc");
        } else if (event.target.value === "default") {
            setProductOrdering("default");
        }
    };

    return (
        <div className="mt-5 flex justify-center items-center w-full">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteProduct}>
                {messageConfirm}
            </ConfirmPopUp>
            <div className="w-full md:w-[97.5%] h-auto bg-[#2d7044] p-8 pb-12 md:rounded-lg md:m-4">  {/* Adjusted padding */}
                {haveProducts === false ? (
                    <div className="text-center text-arial text-3xl text-black h-[30vh] flex flex-col items-center justify-center">
                        <p>Nessuna certificazione ancora disponibile</p>
                        <svg width="200" height="200" xmlns='http://www.w3.org/2000/svg'>
                            <image href="./public/sad.svg" width="200" height="200" />
                        </svg>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-5 md:flex-row items-center justify-center pb-10 md:justify-between">
                            <div className="text-arial text-xl text-white">
                                {numProducts} {numProducts === 1 ? "risultato" : "risultati"}
                            </div>
                            <div className="text-arial text-xl text-black w-full md:w-auto">
                                <select className="bg-white w-[260px] h-10 rounded-lg relative left-1/2 md:left-0 translate-x-[-50%] md:translate-x-0 text-center" name="sorting" id="sorting" onChange={handleSelect}>
                                    <option value="default">Ordinamento predefinito</option>
                                    <option value="price-asc">Prezzo crescente</option>
                                    <option value="price-desc">Prezzo decrescente</option>
                                </select>
                            </div>
                        </div>
                        <div className="">
                            <Slider {...settings}>
                                {products.map((item) => (
                                    <div className='p-4 mx-auto z-10' key={item.id}> {/* Adjusted padding */}
                                        <Link to={`/ProductDetails/${item.id}`}>
                                            <div className="w-full bg-[#2d7044] rounded-lg p-2 hover:transform hover:scale-105 duration-300">
                                                <div className="h-[35vh]"> {/* Adjusted height */}
                                                    <img src={`http://localhost:8080/uploaded_img/${item.image}`} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                                </div>
                                                <div className="text-arial text-xl text-white font-bold text-center pt-3">{item.name}</div>
                                                <div className="text-arial text-xl text-white text-center pt-2">{getPriceCategory(item.category)}</div>
                                            </div>
                                        </Link>

                                    </div>
                                ))}
                            </Slider>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Products;
