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

        getArticleData();
    }, [id]);

    useEffect(() => {
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
    }, []);

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
                <div className='flex flex-col gap-3 md:flex-row w-full md:w-[80%] items-center justify-center mb-6'>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] hover:text-[#2d7044] transition-all duration-300 ease-in-out'
                        onClick={() => previousArticle(id)}
                    >
                        {"<< Precedente"}
                    </button>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] hover:text-[#2d7044] transition-all duration-300 ease-in-out'
                        onClick={() => navigate('/News')}
                    >
                        Torna alle News
                    </button>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] hover:text-[#2d7044] transition-all duration-300 ease-in-out'
                        onClick={() => nextArticle(id)}
                    >
                        {"Successivo >>"}
                    </button>
                </div>
                <div className='w-[120px] p-2 bg-red-600 text-arial text-center font-bold text-2xl text-white rounded-lg animate-blink'>
                    NEWS
                </div>
            </div>

            <div className='w-full mt-8 mb-5'>
                <h1 className='font-arial text-2xl md:text-4xl w-[90%] mx-auto font-bold text-center text-[#2d7044]'>
                    {article.title}
                </h1>
            </div>
            <div className="w-[300px] h-[300px] border-gray-300 border-2 rounded-lg">
                <img
                    src={`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/uploaded_img/${article.image}`}
                    alt={article.title}
                    className="w-full h-full object-fill rounded-lg"
                />
            </div>
            <div className='w-[90%] mt-20 mb-5 px-4 mx-auto text-lg md:text-xl text-justify'>
                <div
                    id='content'
                    dangerouslySetInnerHTML={{ __html: article.content }}
                ></div>
            </div>

        </div>
    );
}

export default Article;
