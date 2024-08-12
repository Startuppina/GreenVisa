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

const NewsCarousel = () => {
    const [news, setNews] = useState([]);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [haveNews, setHaveNews] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/news");
                if (response.status === 200) {
                    setNews(response.data);
                    if (response.data.length > 0) {
                        setHaveNews(true);
                    }

                    const screenWidth = window.innerWidth;
                    let newSlidesToShow = screenWidth <= 700 ? 1 : screenWidth <= 1380 ? 2 : 3;
                    setSlidesToShow(newSlidesToShow);
                } else {
                    console.error("Error fetching news");
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            }
        };

        fetchNews();

        const handleResize = () => {
            const screenWidth = window.innerWidth;
            let newSlidesToShow = screenWidth <= 700 ? 1 : screenWidth <= 1380 ? 2 : 3;
            setSlidesToShow(newSlidesToShow);
        };

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
        <div className='w-full mx-auto'>
            <div className='text-3xl font-bold text-center mb-3'>
                <span className='text-[#2d7044]'>GREEN </span>NEWS
            </div>

            {haveNews === false ? (
                <div className="text-center text-arial text-3xl text-black h-[30vh] flex flex-col items-center justify-center"><p>Nessuna notizia disponibile</p> <svg width="200" height="200" xmlns='http://www.w3.org/2000/svg'><image href="./public/sad.svg" width="200" height="200"/></svg></div>
            ) : (
                <div className="w-full h-auto p-8">
                <Slider {...settings}>
                    {news.map((item) => (
                        <Link to={`/Article/${item.id}`} key={item.id}>
                            <div className='p-6 mx-auto'>
                            <div className={`mx-auto bg-[#d9d9d9] rounded-lg overflow-hidden flex flex-col items-center justify-between hover:transform hover:scale-105 transition-transform duration-300`}
                                    style={{
                                        width: slidesToShow === 1 ? '90%' : slidesToShow === 2 ? '90%' : '100%',
                                        maxWidth: '800px',
                                        height: '450px',
                                        margin: '0 auto',
                                    }}>
                                    <div className="relative w-full h-[80%]">
                                        <div className="absolute inset-0">
                                            <img 
                                                src={`http://localhost:8080/uploaded_img/${item.image}`} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover rounded-t-lg" // Arrotonda solo la parte superiore
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full h-[20%] text-arial text-2xl text-black font-bold text-center p-4 flex items-center justify-center overflow-hidden">
                                        <p className="overflow-ellipsis whitespace-nowrap overflow-hidden text-center">
                                            {item.title}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </Slider>
            </div>
            )}
        </div>
    );
};

export default NewsCarousel;
