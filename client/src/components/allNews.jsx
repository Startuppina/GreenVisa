import React, { useState, useEffect } from "react";
import axios from "axios";
import TextEditor from "./textEditor";
import NewsForm from "./news_form";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

function AllNews() {
    const [news, setNews] = useState([]);
    const [totalNews, setTotalNews] = useState(0);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");
    const [messageConfirm, setMessageConfirm] = useState("");
    const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [currentNewsToEdit, setCurrentNewsToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // Stato per il termine di ricerca
    const [filteredNews, setFilteredNews] = useState([]); // Stato per gli utenti filtrati

    useEffect(() => {
        const fetchNews = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await axios.get("http://localhost:8080/api/news", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 200) {
                    setNews(response.data);
                    setFilteredNews(response.data);
                    setTotalNews(response.data.length);
                }
            } catch (error) {
                //setMessagePopUp("Errore durante il recupero delle notizie");
                //setButtonPopup(true);
            }
        };

        fetchNews();
    }, []);

    const deleteItem = async () => {
        setPopupConfirmDelete(false);
        if (!itemToDelete) return;

        const { id } = itemToDelete;
        const token = localStorage.getItem("token");

        try {
            const response = await axios.delete(
                `http://localhost:8080/api/delete-news/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                setNews((prevNews) => prevNews.filter((news) => news.id !== id));
                setTotalNews((prevTotalNews) => prevTotalNews - 1);
                setMessagePopUp("Notizia eliminata con successo");
                setButtonPopup(true);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleEdit = (item) => {
        setItemToEdit({ ...item });
    };

    const saveEdit = async () => {
        if (!itemToEdit) return;

        const { id, ...editedData } = itemToEdit;
        const elements = { id, ...editedData };
        console.log(elements);
        const token = localStorage.getItem("token");

        try {
            const formData = new FormData();
            for (const key in elements) {
                if (elements[key] instanceof File) {
                    formData.append(key, elements[key]);
                } else {
                    formData.append(key, elements[key]);
                }
            }

            const response = await axios.put(
                `http://localhost:8080/api/edit-news/${id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                const updatedItem = response.data.tuple;
                console.log("ciao", updatedItem);

                setNews((prevNews) =>
                    prevNews.map((news) => (news.id === id ? updatedItem : news))
                );
                setMessagePopUp("Notizia modificata con successo");
                setButtonPopup(true);
                setItemToEdit(null);
            }
        } catch (error) {
            setMessagePopUp(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemToEdit((prevItem) => ({ ...prevItem, [name]: value }));
    };

    const handleQuillChange = (value) => {
        setItemToEdit((prevItem) => ({ ...prevItem, content: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setItemToEdit((prevItem) => ({ ...prevItem, [name]: files[0] }));
    };

    const cancelEdit = () => {
        setItemToEdit(null);
    };

    // Funzione di ricerca debounced
    const handleSearchChange = debounce((searchTerm) => {
        setFilteredNews(news.filter(news =>
            news.title.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, 300);

    return (
        <div className="w-full mb-8 border rounded-2xl shadow-lg p-4 h-[60vh] overflow-y-auto">
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
            <h2 className="text-2xl font-bold mb-4">
                News ({totalNews} {totalNews === 1 ? "articolo" : "articoli"})
            </h2>
            {totalNews > 0 && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cerca per titolo"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearchChange(e.target.value); // Chiama la funzione di ricerca
                        }}
                        className="w-full md:w-[400px] p-2 border border-gray-300 rounded-lg mb-10"
                    />
                </div>
            )}

            {filteredNews.length === 0 ? (
                <p className="text-center text-gray-500">Nessuna notizia trovata</p>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredNews.map((newsItem, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-4 shadow-lg bg-white"
                        >
                            <div className="flex flex-col items-start w-full md:flex-row gap-10">
                                <div className="flex flex-col w-[20%]">
                                    <h3 className="text-2xl font-bold mb-2 w-full">
                                        {newsItem.title}
                                    </h3>
                                    <div className="mb-2 w-[150px] h-[150px]">
                                        <img
                                            src={`http://localhost:8080/uploaded_img/${newsItem.image}`}
                                            alt={newsItem.title}
                                            className="w-full h-full object-cover rounded mb-2"
                                        />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <div
                                        className="prose lg:prose-xl prose-h1:text-3xl prose-h2:text-2xl prose-p:text-lg prose-ul:pl-5 prose-ul:list-disc w-full mx-auto text-black h-[30vh] overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: newsItem.content }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <>
                                    <button
                                        onClick={() => {
                                            handleEdit(newsItem, "news");
                                            setCurrentNewsToEdit(currentNewsToEdit === newsItem.id ? null : newsItem.id)
                                        }}
                                        className="bg-[#2d7044] text-white px-4 py-2 rounded-lg hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044] transition-colors duration-300 ease-in-out"
                                    >
                                        Modifica
                                    </button>
                                    <button
                                        onClick={() => {
                                            setItemToDelete({ id: newsItem.id });
                                            setMessageConfirm(
                                                "Sei sicuro di voler eliminare questa notizia?"
                                            );
                                            setPopupConfirmDelete(true);
                                        }}
                                        className="bg-red-500 border-2 border-red-500 text-white px-4 py-2 rounded-lg hover:border-red-500 hover:text-red-500 hover:bg-white transition-colors duration-300 ease-in-out"
                                    >
                                        Elimina
                                    </button>
                                </>
                            </div>
                            {currentNewsToEdit === newsItem.id && itemToEdit && (
                                <div className="w-[98.5%] mx-auto my-10 font-arial text-xl m-4 rounded-2xl border shadow-xl px-10 py-6">
                                    <h2 className="text-2xl font-bold text-center mb-4">
                                        Modifica Notizia
                                    </h2>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();

                                        }}
                                        className="flex flex-col"
                                    >
                                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Titolo</span>
                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={itemToEdit.title || ""}
                                                    onChange={handleChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                                                />
                                            </label>
                                            <label className="flex flex-col w-full">
                                                <span className="block mb-2">Immagine</span>
                                                <input
                                                    type="file"
                                                    name="image"
                                                    onChange={handleFileChange}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10"
                                                />
                                            </label>
                                        </div>
                                        <label className="flex flex-col w-full z-10">
                                            <span className="block mb-2">Contenuto:</span>
                                            <TextEditor value={itemToEdit.content || ""} onChange={handleQuillChange} />
                                        </label>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                type="submit"
                                                onClick={() => {
                                                    // Imposta l'item da modificare
                                                    setItemToEdit((prevItem) => ({
                                                        ...prevItem,
                                                        id: newsItem.id,
                                                    }));

                                                    // Chiama la funzione saveEdit
                                                    saveEdit();
                                                }}
                                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] "
                                            >
                                                Salva
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-gray-500 text-white rounded-lg border-2 border-transparent hover:border-gray-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-gray-500"
                                            >
                                                Annulla
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AllNews;