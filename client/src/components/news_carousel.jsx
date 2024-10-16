import React, { useState, useEffect } from 'react';
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MessagePopUp from './messagePopUp';
import ConfirmPopUp from './confirmPopUp';

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
    const [newToDelete, setNewToDelete] = useState(null);
    const navigate = useNavigate();

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [messageConfirm, setMessageConfirm] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/news`);
                if (response.status === 200) {
                    setNews(response.data);
                    if (response.data.length > 0) {
                        setHaveNews(true);
                    }

                    const screenWidth = window.innerWidth;
                    let newSlidesToShow = screenWidth <= 700 ? 1 : screenWidth <= 1380 ? 2 : 3;
                    setSlidesToShow(newSlidesToShow);
                }
            } catch (error) {
                setMessagePopup("Errore durante il recupero delle notizie");
                setButtonPopup(true);
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

    const handleDeleteNews = (id) => {
        setNewToDelete(id);
        setMessageConfirm('Sei sicuro di voler eliminare la news?');
        setPopupConfirmDelete(true);
    };

    const deleteNews = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessagePopup('Token non trovato');
            setButtonPopup(true);
            return;
        }

        try {
            const response = await axios.delete(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/delete-news/${newToDelete}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                navigate(0);
            }

        } catch (error) {
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    return (
        <div className='w-full mx-auto'>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteNews}>
                {messageConfirm}
            </ConfirmPopUp>
            <div className='text-3xl font-bold text-center mb-3'>
                <span className='text-[#2d7044]'>GREEN </span>NEWS
            </div>

            {haveNews === false ? (
                <div className="text-center text-arial text-3xl text-black h-[30vh] flex flex-col items-center justify-center">
                    <p>Nessuna notizia disponibile</p>
                    <svg width="200" height="200" xmlns='http://www.w3.org/2000/svg'>
                        <image href="./public/sad.svg" width="200" height="200" />
                    </svg>
                </div>
            ) : (
                <div className="w-full h-auto p-8">
                    <Slider {...settings}>
                        {news.map((item) => (
                            <div className='p-6 mx-auto z-10'>
                                <Link to={`/Article/${item.id}`} key={item.id}>
                                    <div
                                        className={`relative mx-auto bg-[#d9d9d9] rounded-lg overflow-hidden flex flex-col items-center justify-between hover:transform hover:scale-105 transition-transform duration-300`}
                                        style={{
                                            width: slidesToShow === 1 ? '90%' : '100%',
                                            maxWidth: '500px',
                                            aspectRatio: '1', // Keep the aspect ratio 1:1 (square)
                                            margin: '0 auto',
                                        }}
                                    >
                                        <div className="w-full h-full border-gray-300 border-2 rounded-lg">
                                            <img
                                                src={`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/uploaded_img/${item.image}`}
                                                alt={item.title}
                                                className="w-full h-full object-fill rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-arial text-2xl text-black font-bold text-center p-4 flex items-center justify-center">
                                        <p className="overflow-ellipsis whitespace-nowrap overflow-hidden text-center">
                                            {item.title}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </Slider>
                </div>

            )}
        </div>
    );
};

export default NewsCarousel;
