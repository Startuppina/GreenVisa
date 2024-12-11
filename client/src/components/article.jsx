import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function Article() {
    const { id } = useParams();
    const [article, setArticle] = useState({});
    const [articleIds, setArticleIds] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getArticleData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/article/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 200) {
                    setArticle(response.data.article);
                    setArticleIds(response.data.ids);
                }
            } catch (error) {
                console.log(error);
            }
        };

        const setNewsread = async () => {

            const token = localStorage.getItem("token");

            try {
                const response = await axios.put(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/set-news-read/${id}`, {}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    console.log(response.data);
                }

            } catch (error) {
                console.log(error);
            }

        };


        setNewsread();
        getArticleData();

    }, [id]);


    const nextArticle = (currentId) => {
        const currentIndex = articleIds.indexOf(parseInt(currentId));
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % articleIds.length;
            const nextId = articleIds[nextIndex];
            navigate(`/Article/${nextId}`);
        }
    };

    const previousArticle = (currentId) => {
        const currentIndex = articleIds.indexOf(parseInt(currentId));
        if (currentIndex !== -1) {
            const prevIndex = (currentIndex - 1 + articleIds.length) % articleIds.length;
            const prevId = articleIds[prevIndex];
            navigate(`/Article/${prevId}`);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center p-4 w-full'>
            <div className='w-full flex flex-col items-center justify-center'>
                <div className="flex flex-wrap gap-4 w-full items-center justify-center mb-6">
                    <button
                        className="text-center bg-[#2d7044] border-2 border-[#2d7044] text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 mx-1 sm:mx-2 w-auto rounded-full shadow-lg hover:bg-white hover:text-[#2d7044] hover:shadow-xl transition-transform duration-300 ease-in-out transform hover:-translate-y-1"
                        onClick={() => previousArticle(id)}
                    >
                        ← Precedente
                    </button>
                    <button
                        className="text-center bg-[#2d7044] border-2 border-[#2d7044] text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 mx-1 sm:mx-2 w-auto rounded-full shadow-lg hover:bg-white hover:text-[#2d7044] hover:shadow-xl transition-transform duration-300 ease-in-out transform hover:-translate-y-1"
                        onClick={() => navigate('/News')}
                    >
                        Vai alla News
                    </button>
                    <button
                        className="text-center bg-[#2d7044] border-2 border-[#2d7044] text-white text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 mx-1 sm:mx-2 w-auto rounded-full shadow-lg hover:bg-white hover:text-[#2d7044] hover:shadow-xl transition-transform duration-300 ease-in-out transform hover:-translate-y-1"
                        onClick={() => nextArticle(id)}
                    >
                        Successivo →
                    </button>
                </div>


                {/* 
                <div className='w-[120px] p-2 bg-red-600 text-arial text-center font-bold text-2xl text-white rounded-lg animate-blink'>
                    NEWS
                </div>*/}
            </div>

            <div className='w-full mt-8 mb-5'>
                <h1 className='font-arial text-xl text-center text-gray-500 mb-4'>
                    Pubblicato il {new Date(article.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',         // Mostra il giorno con due cifre
                        month: 'long',          // Nome completo del mese
                        year: 'numeric',        // Mostra l'anno completo
                    })}
                </h1>
                <h1 className='font-arial text-2xl md:text-4xl w-[90%] mx-auto font-bold text-center'>
                    {article.title}
                </h1>
            </div>
            <div className="w-[400px] h-[400px] border-gray-300 border-2 rounded-lg">
                <img
                    src={`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/uploaded_img/${article.image}`}
                    alt={article.title}
                    className="w-full h-full object-fill rounded-lg"
                />
            </div>
            <div className='w-full md:w-[80%] xl:w-[60%] mt-20 mb-5 px-1 mx-auto text-lg md:text-xl text-justify'>
                <div
                    id='content'
                    dangerouslySetInnerHTML={{ __html: article.content }}
                ></div>
            </div>

        </div>
    );
}

export default Article;
