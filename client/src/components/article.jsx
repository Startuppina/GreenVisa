import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function Article() {
    const { id } = useParams();
    const [article, setArticle] = useState({});
    const [countNews, setCountNews] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Fetching article with ID:", id); // Debug
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
    }, [id]); // Aggiungi [id] come dipendenza in modo che useEffect venga eseguito quando l'id cambia

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
        <div>
            <div className='flex flex-col items-center justify-center'>
                <div className='flex space-between gap-20 md:gap-[45%] w-full items-center justify-center mt-20 font-arial text-xl md:text-2xl font-bold text-[#2d7044]'>
                    <div
                        className='hover:cursor-pointer'
                        onClick={() => previousArticle(id)} // Passa l'id corrente alla funzione
                    >
                        {"<< precedente"}
                    </div>
                    <div
                        className='hover:cursor-pointer'
                        onClick={() => nextArticle(id)} // Passa l'id corrente alla funzione
                    >
                        {"successivo >>"}
                    </div>
                </div>
                <div className='mt-4 w-[100px] p-1 bg-red-600 text-arial text-center font-bold text-xl text-white rounded-lg xl:absolute xl:top-[265px] xl:left-[230px] animate-blink'>
                    NEWS
                </div>
                <div className='w-full mt-8 mb-5'>
                    <h1 className='font-arial text-xl md:text-3xl w-[50%] mx-auto font-bold text-center'>{article.title}</h1>
                </div>
                <img
                    src={`http://localhost:8080/uploaded_img/${article.image}`}
                    alt={article.title}
                    className='w-[50%] h-[50%] md:w-[40%] md:h-[40%] lg:w-[20%] lg:h-[20%] mx-auto rounded-lg mt-5'
                />
                <div className='w-full mt-5 mb-5 text-arial text-justify text-xl p-0 mx-0'>
                    <div
                        className="prose lg:prose-xl prose-h1:text-3xl prose-h2:text-2xl prose-p:text-xl prose-ul:pl-5 prose-ul:list-disc w-[90%] mx-auto"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default Article;
