import React from 'react'
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Navbar from "./navbar";
import Footer from "./footer";
import { Link } from "react-router-dom";

const News = [

    {
        id: 1,
        title: "Un nuovo AI ci ha dato la possibilità di imparare a lavorare con un computer",
        img: "/img/AI.jpg"
    },
    {
        id: 2,
        title: "L’importanza della Compensazione delle Emissioni di CO2",
        img: "/img/CO2.png"
    },
    {
        id: 3,
        title: " Elettrificazione delle strutture ricettive: un passo avanti verso un ...",
        img: "/img/struttura.png"
    },
]

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
    const Settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: document.body.clientWidth <= 1380 ? document.body.clientWidth <= 700 ? 1 : 2 : 3,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

  return (
    <>
    <div className='items-center w-[99%] mx-auto'>
        <div className='text-3xl font-bold text-center mb-3'><span className='text-[#2d7044]'>GREEN </span>NEWS</div>

        <div className="w-full h-auto p-8">
            <Slider {...Settings}>
                {News.map((item) => (
                    <Link to="/Article" key={item.id}>
                        <div className='p-6'>
                            <div className="w-full bg-[#d9d9d9] rounded-lg flex flex-col items-center justify-center hover:transform hover:scale-105 transition-transform duration-300">
                                <div className="w-full h-[30vh] lg:h-[50vh]">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-fill rounded-lg" />
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
    </>
  )
}

export default News_carousel