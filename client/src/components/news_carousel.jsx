import React, { useState, useEffect } from 'react';
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from "react-router-dom";
import axios from 'axios';

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

const News_carousel = () => {
    const [News, setNews] = useState([]);
    const [slidesToShow, setSlidesToShow] = useState(1);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/news");
                if (response.status === 200) {
                    setNews(response.data);
                    const screenWidth = document.body.clientWidth;

                    // Determina il numero di slides da mostrare in base alla larghezza dello schermo
                    let newSlidesToShow;
                    if (response.data.length === 1) {
                        newSlidesToShow = 1; // Se c'è solo una card, mostra solo una
                    } else {
                        newSlidesToShow = Math.min(response.data.length, screenWidth <= 700 ? 1 : screenWidth <= 1380 ? 2 : 3);
                    }
                    setSlidesToShow(newSlidesToShow);
                } else {
                    console.error("Error fetching news");
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            }
        };

        fetchNews();
    }, []);

    const Settings = {
        dots: true,
        infinite: slidesToShow !== 1, // Se c'è solo una card, non rendere il carosello infinito
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        nextArrow: slidesToShow !== 1 ? <NextArrow /> : null, // Nascondi le frecce se c'è solo una card
        prevArrow: slidesToShow !== 1 ? <PrevArrow /> : null,
        centerMode: slidesToShow < News.length, // Abilita il centering solo se ci sono più news che slides visibili
        centerPadding: '0px',
    };

    return (
        <div className='w-full mx-auto'>
            <div className='text-3xl font-bold text-center mb-3'>
                <span className='text-[#2d7044]'>GREEN </span>NEWS
            </div>

            <div className="w-full h-auto p-8">
                <Slider {...Settings}>
                    {News.map((item) => (
                        <Link to="/Article" key={item.id}>
                            <div className='p-6 mx-auto'>
                                <div className="mx-auto bg-[#d9d9d9] rounded-lg flex flex-col items-center justify-center hover:transform hover:scale-105 transition-transform duration-300"
                                    style={{
                                        width: slidesToShow === 1 ? '40%' : slidesToShow === 2 ? '80%' : '100%',
                                        margin: slidesToShow === 1 ? '0 auto' : slidesToShow === 2 ? '0 auto' : '0 auto',
                                    }}>
                                    <div className="w-full h-[30vh] lg:h-[50vh]">
                                        <img src={`http://localhost:8080/uploaded_img/${item.image}`} alt={item.title} className="w-full h-full object-fill rounded-lg" />
                                    </div>
                                    <div className="text-arial text-xl text-black font-bold text-center p-3 h-[12vh] overflow-hidden">
                                        <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical' }}>
                                            {item.title}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </Slider>
            </div>
        </div>
    );
};

export default News_carousel;
