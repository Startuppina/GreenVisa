import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

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

function NewsUnread() {

    const [news, setNews] = useState([]);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [haveNews, setHaveNews] = useState(false);
    const [newToDelete, setNewToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get("http://localhost:8080/api/news-unread", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setNews(response.data);
                    console.log(response.data);
                    if (response.data.length > 0) {
                        setHaveNews(true);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        };
    
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            let newSlidesToShow = screenWidth <= 700 ? 1 : screenWidth <= 1000 ? 2 : screenWidth <= 1600 ? 3 : 4;
            setSlidesToShow(newSlidesToShow);
        };
    
        // Calcolare slidesToShow all'inizio
        handleResize();
    
        fetchNews();
    
        window.addEventListener('resize', handleResize);
    
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    

    const settings = {
        dots: true,
        infinite: news.length > slidesToShow,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        centerMode: slidesToShow < news.length,
        centerPadding: '0px',
    };

    return (
        <div className="w-full max-w-[97.5%] mx-auto h-auto bg-[#2d7044] p-4 md:rounded-lg mt-8 mb-7">
            <h1 className="text-center text-white text-2xl font-bold">Ti sei perso</h1>

            {haveNews ? (
                <div className="w-full h-auto p-8 ">
                        <Slider {...settings}>
                            {news.map((item) => (
                                <div className='pt-6 mx-auto z-10'>
                                    <Link to={`/Article/${item.id}`} key={item.id}>
                                        <div
                                            className={`relative mx-auto bg-[#d9d9d9] rounded-lg overflow-hidden flex flex-col items-center justify-between hover:transform hover:scale-105 transition-transform duration-300`}
                                            style={{
                                                width: slidesToShow === 1 ? '50%' : slidesToShow === 2 ? '70%' : slidesToShow === 3 ? '90%' : '90%',
                                                maxWidth: '300px',
                                                aspectRatio: '1', // Keep the aspect ratio 1:1 (square)
                                                margin: '0 auto',
                                            }}
                                        >
                                            <div className="w-full h-full border-gray-300 border-2 rounded-lg">
                                                <img
                                                    src={`http://localhost:8080/uploaded_img/${item.image}`}
                                                    alt={item.title}
                                                    className="w-full h-full object-fill rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-arial text-2xl text-white font-bold text-center p-4 flex items-center justify-center">
                                                <p className="overflow-ellipsis whitespace-nowrap overflow-hidden text-center">
                                                    {item.title}
                                                </p>
                                            </div>
                                    </Link>
                                </div>
                            ))}
                        </Slider>
                    </div>
            ) : (
                <div className="w-full h-auto p-8">
                    <h1 className="text-center text-white text-xl">Hai letto tutte le notizie </h1>
                </div>
            )}
        </div>

    );
}

export default NewsUnread;