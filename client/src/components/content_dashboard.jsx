import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import MessagesDashboard from "./contacts_receiver";
import NewsForm from "./news_form";
import ProductsForm from "./products_form";
import TextEditor from "./textEditor";
import PromoCodeForm from "./promoCodeForm";
import PromoCodes from "./promoCodes";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [news, setNews] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalNews, setTotalNews] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);

  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopUp, setMessagePopUp] = useState("");
  const [messageConfirm, setMessageConfirm] = useState("");
  const [popupConfirmDelete, setPopupConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [showNews, setShowNews] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showPromocodes, setShowPromocodes] = useState(false);
  const [showForms, setShowForms] = useState(false);

  const navigate = useNavigate();

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
          setTotalNews(response.data.length);
        }
      } catch (error) {
        //setMessagePopUp("Errore durante il recupero delle notizie");
        //setButtonPopup(true);
      }
    };

    fetchNews();
  }, [news]); // No dependencies

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://localhost:8080/api/products-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          setProducts(response.data.products || []);
          setTotalProducts(response.data.products?.length || 0);
        }
      } catch (error) {
        //setMessagePopUp("Errore durante il recupero delle certificazioni");
        //setButtonPopup(true);
      }
    };

    fetchProducts();
  }, [products]); // No dependencies

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/categories"
        );
        if (response.status === 200) {
          setCategories(response.data);
        }
      } catch (error) {
        setMessagePopUp("Errore durante il recupero delle categorie");
        setButtonPopup(true);
      }
    };

    fetchCategories();
  }, []); // No dependencies

  const deleteItem = async () => {
    setPopupConfirmDelete(false);
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    const token = localStorage.getItem("token");

    try {
      const response = await axios.delete(
        `http://localhost:8080/api/delete-${type}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        if (type === "news") {
          setNews((prevNews) => prevNews.filter((news) => news.id !== id));
          setTotalNews((prevTotalNews) => prevTotalNews - 1);
          setMessagePopUp("Notizia eliminata con successo");
          setButtonPopup(true);
        } else if (type === "product") {
          setProducts((prevProducts) =>
            prevProducts.filter((product) => product.id !== id)
          );
          setTotalProducts((prevTotalProducts) => prevTotalProducts - 1);
          setMessagePopUp("Certificazione eliminata con successo");
          setButtonPopup(true);
        }
      }
    } catch (error) {
      setMessagePopUp(error.response?.data?.msg || error.message);
      setButtonPopup(true);
    }
  };

  const handleEdit = (item, type) => {
    setItemToEdit({ ...item, type });
  };

  const saveEdit = async () => {
    if (!itemToEdit) return;

    const { id, type, ...editedData } = itemToEdit;
    const elements = { id, type, ...editedData };
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
        `http://localhost:8080/api/edit-${type}/${id}`,
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
        console.log("ciao",updatedItem);
        if (type === "news") {
          setNews((prevNews) =>
            prevNews.map((news) => (news.id === id ? updatedItem : news))
          );
          setMessagePopUp("Notizia modificata con successo");
          setButtonPopup(true);
        } else if (type === "product") {
          setProducts((prevProducts) =>
            prevProducts.map((product) => (product.id === id ? updatedItem : product))
          );
          setMessagePopUp("Certificazione modificata con successo");
          setButtonPopup(true);
        }
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

  return (
    <div className="flex flex-col h-auto w-[98.5%] mx-auto my-10 font-arial text-xl m-4">
      <h1 className="text-3xl font-bold text-black text-center pb-10">
        Dashboard amministratore
      </h1>
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

      <div className="flex flex-col">
        <button
          className="bg-[#d9d9d9] text-black px-4 py-2 rounded mb-4 transition-transform transform hover:scale-105"
          onClick={() => setShowNews(!showNews)}
        >
          {showNews ? "Nascondi News" : "Mostra News"}
        </button>
        {showNews && (
          <div className="w-full mb-8">
            <h2 className="text-2xl font-bold mb-4">
              News ({totalNews} {totalNews === 1 ? "articolo" : "articoli"})
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {news.map((newsItem) => (
                <div
                  key={newsItem.id}
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
                        }}
                        className="bg-[#2d7044] text-white px-4 py-2 rounded hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044]"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: newsItem.id, type: "news" });
                          setMessageConfirm(
                            "Sei sicuro di voler eliminare questa notizia?"
                          );
                          setPopupConfirmDelete(true);
                        }}
                        className="bg-red-500 border-2 border-red-500 text-white px-4 py-2 rounded hover:border-red-500 hover:text-red-500 hover:bg-white"
                      >
                        Elimina
                      </button>
                    </>
                  </div>
                  {itemToEdit?.type === "news" && (
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
                          {/*<ReactQuill
                            value={itemToEdit.content || ""}
                            onChange={handleQuillChange}
                            className="mb-4"
                          />*/}
                          <TextEditor value={itemToEdit.content || ""} onChange={handleQuillChange}/>
                        </label>
                        <div className="flex justify-center gap-3">
                          <button
                            type="submit"
                            onClick={() => {
                              // Imposta l'item da modificare
                              setItemToEdit((prevItem) => ({
                                ...prevItem,
                                id: newsItem.id,
                                type: "news",
                              }));

                              // Chiama la funzione saveEdit
                              saveEdit();
                            }}
                            className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
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
          </div>
        )}

        <button
          className="bg-[#d9d9d9] text-black px-4 py-2 rounded mb-4 transition-transform transform hover:scale-105"
          onClick={() => setShowProducts(!showProducts)}
        >
          {showProducts ? "Nascondi Certificazioni" : "Mostra Certificazioni"}
        </button>
        {showProducts && (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-4">
              Certificazioni ({totalProducts}{" "}
              {totalProducts === 1 ? "certificazione" : "certificazioni"})
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {products.map((productItem) => (
                <div
                  key={productItem.id}
                  className="border rounded-lg p-4 shadow-lg bg-white mb-8"
                >
                  <div className="flex  gap-20 items-center">
                    <div className="flex flex-col">
                      <h3 className="text-xl font-bold mb-2">
                        Nome: {productItem.name}
                      </h3>
                      <div className="mb-2 w-[150px] h-[150px]">
                        <img
                          src={`http://localhost:8080/uploaded_img/${productItem.image}`}
                          alt={productItem.name}
                          className=" object-cover rounded mb-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-2 flex gap-2">
                        <label className="block text-gray-600 mb-1">
                          Prezzo:
                        </label>
                        <p>{productItem.price} €</p>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <label className="block text-gray-600 mb-1">
                          Codice:
                        </label>
                        <p>{productItem.cod}</p>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <label className="block text-gray-600 mb-1">Tag:</label>
                        <p>{productItem.tag}</p>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <label className="block text-gray-600 mb-1">
                          Categoria:
                        </label>
                        <p>{productItem.category}</p>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <label className="block text-gray-600 mb-1">
                          Info:
                        </label>
                        <p>{productItem.info}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <>
                      <button
                        onClick={() => handleEdit(productItem, "product")}
                        className="bg-[#2d7044] text-white px-4 py-2 rounded hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044]"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            id: productItem.id,
                            type: "product",
                          });
                          setMessageConfirm(
                            "Sei sicuro di voler eliminare questa certificazione?"
                          );
                          setPopupConfirmDelete(true);
                        }}
                        className="z-20 bg-red-500 text-white px-4 py-2 rounded border-2 border-red-500 hover:text-red-500 hover:bg-white"
                      >
                        Elimina
                      </button>
                    </>
                  </div>
                  {itemToEdit?.type === "product" && (
                    <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl">
                      <h2 className="text-2xl font-bold text-center mb-4">
                        Modifica Certificazione
                      </h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveEdit();
                        }}
                        className="flex flex-col"
                      >
                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Titolo</span>
                            <input
                              type="text"
                              name="name"
                              value={itemToEdit.name || ""}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                            />
                          </label>
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Prezzo</span>
                            <input
                              type="text"
                              name="price"
                              value={itemToEdit.price || ""}
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
                        <div className="flex flex-col md:flex-row md:gap-3 mb-4">
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Codice</span>
                            <input
                              type="text"
                              name="cod"
                              value={itemToEdit.cod || ""}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                            />
                          </label>
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Tag</span>
                            <input
                              type="text"
                              name="tag"
                              value={itemToEdit.tag || ""}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                            />
                          </label>
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Categoria</span>
                            <select
                              name="category"
                              value={itemToEdit.category || ""}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 h-[53px] z-10"
                            >
                              <option value="" disabled>
                                Seleziona una categoria
                              </option>
                              {categories.map((cat, index) => (
                                <option key={index} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="flex flex-col mb-4">
                          <label className="flex flex-col w-full">
                            <span className="block mb-2">Info</span>
                            <textarea
                              name="info"
                              value={itemToEdit.info || ""}
                              onChange={handleChange}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5 z-10 h-[150px]"
                            />
                          </label>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            type="submit"
                            onClick={() => {
                              // Imposta l'item da modificare
                              setItemToEdit((prevItem) => ({
                                ...prevItem,
                                id: productItem.id,
                                type: "product",
                              }));

                              // Chiama la funzione saveEdit
                              saveEdit();
                            }}
                            className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
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
          </div>
        )}
      </div>
      <button
        className="bg-[#d9d9d9] text-black px-4 py-2 rounded mb-4 transition-transform transform hover:scale-105"
        onClick={() => setShowMessages(!showMessages)}
      >
        {showMessages ? "Nascondi Messaggi" : "Mostra Messaggi"}
      </button>
      {showMessages && <MessagesDashboard />}

      <button
        className="bg-[#d9d9d9] text-black px-4 py-2 rounded mb-4 transition-transform transform hover:scale-105"
        onClick={() => setShowPromocodes(!showPromocodes)}
      >
        {showMessages ? "Nascondi Codici Promozionali" : "Mostra Codici Promozionali"}
      </button>
      {showPromocodes && <PromoCodes />}

      <button
        className="bg-[#d9d9d9] text-black px-4 py-2 rounded mb-4 transition-transform transform hover:scale-105"
        onClick={() => setShowForms(!showForms)}
      >
        {showForms ? "Nascondi Forms" : "Mostra Forms"}
      </button>
      {showForms && <NewsForm />}
      {showForms && <ProductsForm />}
      {showForms && <PromoCodeForm />}
    </div>
  );
};

export default Dashboard;
