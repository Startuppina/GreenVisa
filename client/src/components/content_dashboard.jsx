import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessagePopUp from './messagePopUp';
import ConfirmPopUp from './confirmPopUp';

const Dashboard = () => {
    const [news, setNews] = useState([]);
    const [products, setProducts] = useState([]);
    const [totalNews, setTotalNews] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [messageConfirm, setMessageConfirm] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { id: string, type: 'news' | 'product' }

    useEffect(() => {
        const fetchedNews = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get('http://localhost:8080/api/news', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    setNews(response.data);
                    setTotalNews(response.data.length);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero delle notizie");
                setButtonPopup(true);
            }
        };

        const fetchedProducts = async () => {
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get('http://localhost:8080/api/products-info', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    const productsData = Array.isArray(response.data) ? response.data : response.data.products || [];
                    setProducts(productsData);
                    setTotalProducts(productsData.length);
                }
            } catch (error) {
                setMessagePopUp("Errore durante il recupero dei prodotti");
                setButtonPopup(true);
            }
        };

        fetchedNews();
        fetchedProducts();
    }, []);

    const deleteItem = async () => {
        if (!itemToDelete) return;

        const { id, type } = itemToDelete;
        const token = localStorage.getItem('token');

        try {
            const response = await axios.delete(`http://localhost:8080/api/delete-${type}/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                if (type === 'news') {
                    setNews(prevNews => prevNews.filter(news => news.id !== id));
                    setTotalNews(prevTotalNews => prevTotalNews - 1);
                } else if (type === 'product') {
                    setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
                    setTotalProducts(prevTotalProducts => prevTotalProducts - 1);
                }
                setPopupConfirmDelete(false);
            }
        } catch (error) {
            setMessagePopUp(`Errore durante la cancellazione del ${type}`);
            setButtonPopup(true);
        }
    };

    const handleDelete = (id, type) => {
        setItemToDelete({ id, type });
        setMessageConfirm(type === 'news' ? "Sei sicuro di voler eliminare questa notizia?" : "Sei sicuro di voler eliminare questo prodotto?");
        setPopupConfirmDelete(true);
    };

    return (
        <div className="flex flex-col h-auto w-[98.5%] mx-auto my-10 font-arial text-xl m-4 rounded-2xl border shadow-xl px-20 py-6">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopUp}
            </MessagePopUp>
            <ConfirmPopUp
                trigger={popupConfirmDelete}
                setTrigger={setPopupConfirmDelete}
                onButtonClick={deleteItem}
            >
                {messageConfirm}
            </ConfirmPopUp>
            <div className="flex-grow text-arial text-xl p-4">
                <h1 className="text-3xl font-bold text-black text-center pb-10">Contenuti caricati</h1>

                <div className="flex justify-between mb-6">
                    <p>News totali: {totalNews}</p>
                    <p>Prodotti totali: {totalProducts}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-bold mb-4">News</h2>
                        <table className="table-auto w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border px-4 py-2">Titolo</th>
                                    <th className="border px-4 py-2">Contenuto</th>
                                    <th className="border px-4 py-2">Immagine</th>
                                    <th className="border px-4 py-2 w-[10%]">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {news.map(newsItem => (
                                    <tr key={newsItem.id}>
                                        <td className="border px-4 py-2 truncate max-w-xs">{newsItem.title}</td>
                                        <td className="border px-4 py-2 truncate max-w-xs">{newsItem.content}</td>
                                        <td className="border px-4 py-2">{newsItem.image}</td>
                                        <td className="border px-4 py-2 flex items-center">
                                            <button 
                                                onClick={() => handleDelete(newsItem.id, 'news')} 
                                                className="bg-red-500 text-white px-4 py-2 rounded w-full"
                                            >
                                                Elimina
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-bold mb-4">Prodotti</h2>
                        <table className="table-auto w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border px-4 py-2">Nome</th>
                                    <th className="border px-4 py-2">Prezzo</th>
                                    <th className="border px-4 py-2">Immagine</th>
                                    <th className="border px-4 py-2">Categoria</th>
                                    <th className="border px-4 py-2 w-[10%]">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td className="border px-4 py-2 truncate max-w-xs">{product.name}</td>
                                        <td className="border px-4 py-2">${product.price}</td>
                                        <td className="border px-4 py-2">{product.image}</td>
                                        <td className="border px-4 py-2">{product.category}</td>
                                        <td className="border px-4 py-2 flex items-center">
                                            <button 
                                                onClick={() => handleDelete(product.id, 'product')} 
                                                className="bg-red-500 text-white px-4 py-2 rounded w-full"
                                            >
                                                Elimina
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
