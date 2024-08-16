import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function Article() {
    const { id } = useParams();
    const [article, setArticle] = useState({});
    const [countNews, setCountNews] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Fetching article with ID:", id);
        const getArticle = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/article/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 200) {
                    console.log("response: ", response.data.article);
                    setArticle(response.data.article);
                    setCountNews(response.data.countnews);
                    console.log("news: ", response.data.countnews);
                }
            } catch (error) {
                console.log(error);
            }
        };

        getArticle();
    }, [id]);

    const nextArticle = (currentId) => {
        const nextId = parseInt(currentId) + 1;
        if (nextId <= countNews) {
            navigate(`/Article/${nextId}`);
        } else {
            navigate(`/Article/${1}`);
        }
    };

    const previousArticle = (currentId) => {
        const prevId = parseInt(currentId) - 1;
        if (prevId >= 1) {
            navigate(`/Article/${prevId}`);
        } else {
            navigate(`/Article/${countNews}`);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen p-4 w-full'>
            <div className='w-full flex flex-col items-center justify-center'>
                <div className='flex flex-col gap-3 md:flex-row w-full md:w-[80%] items-center justify-center  mb-6'>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] rounded-lg bg-[#2d7044] text-white hover:bg-[#1e4d2c] shadow-lg transition-all duration-300 ease-in-out'
                        onClick={() => previousArticle(id)}
                    >
                        {"<< Precedente"}
                    </button>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] rounded-lg bg-[#2d7044] text-white hover:bg-[#1e4d2c] shadow-lg transition-all duration-300 ease-in-out'
                        onClick={() => navigate('/News')}
                    >
                        Torna alle News
                    </button>
                    <button
                        className='text-center text-xl px-6 py-3 mx-2 w-[200px] md:w-[250px] rounded-lg bg-[#2d7044] text-white hover:bg-[#1e4d2c] shadow-lg transition-all duration-300 ease-in-out'
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
            <img
                src={`http://localhost:8080/uploaded_img/${article.image}`}
                alt={article.title}
                className='w-[50%] md:w-[30%] lg:w-[20%] mx-auto rounded-lg mt-5'
            />
            <div className='w-full mt-5 mb-5 text-arial text-justify text-lg md:text-xl px-4 lg:px-20 mx-auto'>
                <div
                    className="prose lg:prose-xl prose-h1:text-3xl prose-h2:text-2xl prose-p:text-lg prose-ul:pl-5 prose-ul:list-disc w-[90%] mx-auto text-black"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                ></div>
            </div>
        </div>
    );
}

export default Article;
