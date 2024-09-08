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
import AllOrders from "./allOrders";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import UsersGeneratorTypes from "./usersGeneratorTypes";
import SecondLevelCerts from "./secondLevelCerts";

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

  const [showOrders, setShowOrders] = useState(false);

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
        console.log("ciao", updatedItem);
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

  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="flex flex-col h-auto w-[98.5%] mx-auto my-10 font-arial text-xl m-4">
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

      <div className="flex flex-wrap justify-center items-center gap-4">
        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("news");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <path
              d="M5 21h12a4 4 0 0 0 4-4V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v13c0 1.657-.343 3-2 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 10a2 2 0 0 1 2-2h2v10.5c0 1.38-.62 2.5-2 2.5s-2-1.12-2-2.5V10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="8" r="1" fill="currentColor" />
            <path d="M11 14h6m-6 3h3" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>News</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("products");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="currentColor">
              <path
                d="M1 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7v-.354A4.01 4.01 0 0 0 7.465 11H13a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1.535a4.018 4.018 0 0 0-1 .82V4Zm5.646 2a3.984 3.984 0 0 0-2.275-.983A.5.5 0 0 1 4.5 5h7a.5.5 0 0 1 0 1H6.646ZM8.5 8a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3ZM7 9a3 3 0 1 1-6 0a3 3 0 0 1 6 0Zm-5 3.443V14.5a.495.495 0 0 0 .264.441a.5.5 0 0 0 .513-.026L4 14.1l1.223.816a.498.498 0 0 0 .706-.16a.505.505 0 0 0 .071-.257v-2.056a3.959 3.959 0 0 1-2 .556a3.959 3.959 0 0 1-2-.556Z"
              />
            </g>
          </svg>
          <span>Certificazioni</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("messages");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="#feffff">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <path strokeLinejoin="round" d="M14 19c3.771 0 5.657 0 6.828-1.172C22 16.657 22 14.771 22 11c0-3.771 0-5.657-1.172-6.828C19.657 3 17.771 3 14 3h-4C6.229 3 4.343 3 3.172 4.172C2 5.343 2 7.229 2 11c0 3.771 0 5.657 1.172 6.828c.653.654 1.528.943 2.828 1.07" />
                <path d="M12 11v.01M8 11v.01m8-.01v.01M14 19c-1.236 0-2.598.5-3.841 1.145c-1.998 1.037-2.997 1.556-3.489 1.225c-.492-.33-.399-1.355-.212-3.404L6.5 17.5" />
              </g>
            </g>
          </svg>
          <span>Messaggi</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("orders");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2">
              <path d="M5 7h13.79a2 2 0 0 1 1.99 2.199l-.6 6A2 2 0 0 1 18.19 17H8.64a2 2 0 0 1-1.962-1.608L5 7Z" />
              <path strokeLinecap="round" d="m5 7l-.81-3.243A1 1 0 0 0 3.22 3H2m6 18h2m6 0h2" />
            </g>
          </svg>
          <span>Ordini utenti</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("promocodes");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 480 496"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <path
              fill="currentColor"
              d="M91 347v85l85-21l64 64l64-64l85 21v-85l86-22l-43-85l43-85l-86-22V48l-85 21l-64-64l-64 64l-85-21v85L5 155l43 85l-43 85zm-5-126l-19-39l34-8q15-3 23.5-14.5T133 133v-30l32 9h11q17 0 30-13l34-34l34 34q13 13 30 13q6 0 11-2l32-7v30q0 15 8.5 26.5T379 174l34 8l-19 39q-10 19 0 38l19 39l-34 8q-15 3-23.5 14.5T347 347v30l-32-9h-11q-17 0-30 13l-34 34l-34-34q-13-13-30-13q-6 0-11 2l-32 7v-30q0-15-8.5-26.5T101 306l-34-8l19-39q10-19 0-38zm133 92l100-101q14-14 0-30q-15-13-30 0l-70 71l-28-28q-15-13-30 0q-13 15 0 30z"
            />
          </svg>
          <span>Codici promozionali</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("forms");
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="currentColor">
              <path
                d="M21 12H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1ZM8 10h12V7.94H8Z"
              />
              <path
                d="M21 14.08H7a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1h11.36L22 16.3v-1.22a1 1 0 0 0-1-1ZM20 18H8v-2h12Z"
              />
              <path
                d="M11.06 31.51v-.06l.32-1.39H4V4h20v10.25l2-1.89V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1h8a3.44 3.44 0 0 1 .06-.49Z"
              />
              <path
                d="m22 19.17l-.78.79a1 1 0 0 0 .78-.79Z"
              />
              <path
                d="M6 26.94a1 1 0 0 0 1 1h4.84l.3-1.3l.13-.55v-.05H8V24h6.34l2-2H7a1 1 0 0 0-1 1Z"
              />
              <path
                d="m33.49 16.67l-3.37-3.37a1.61 1.61 0 0 0-2.28 0L14.13 27.09L13 31.9a1.61 1.61 0 0 0 1.26 1.9a1.55 1.55 0 0 0 .31 0a1.15 1.15 0 0 0 .37 0l4.85-1.07L33.49 19a1.6 1.6 0 0 0 0-2.27ZM18.77 30.91l-3.66.81l.89-3.63L26.28 17.7l2.82 2.82Zm11.46-11.52l-2.82-2.82L29 15l2.84 2.84Z"
              />
            </g>
          </svg>
          <span>Forms</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("usersImplants");
          }}
        >
          {/* Inserisci l'SVG corretto */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="currentColor">
              <rect
                width="24"
                height="24"
                x="0"
                y="0"
                rx="4"
                fill="transparent"
                stroke="transparent"
                strokeWidth="0"
                strokeOpacity="100%"
                paintOrder="stroke"
              ></rect>
              <g fill="#ffffff">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m4 12l6 6L20 6"
                />
              </g>
            </g>
          </svg>
          <span>Generatori da approvare</span>
        </button>

        <button
          className="w-[300px] h-[100px] mb-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm hover:shadow-md text-white flex justify-center items-center gap-2"
          style={{ backgroundColor: "#2d7044" }}
          onClick={() => {
            toggleSection("2ndLevelCerts");
          }}
        >
          {/* Inserisci l'SVG corretto */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <g fill="currentColor">
              <rect
                width="24"
                height="24"
                x="0"
                y="0"
                rx="4"
                fill="transparent"
                stroke="transparent"
                strokeWidth="0"
                strokeOpacity="100%"
                paintOrder="stroke"
              ></rect>
              <g fill="#ffffff">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m4 12l6 6L20 6"
                />
              </g>
            </g>
          </svg>
          <span>Richieste certificazioni 2° Livello</span>
        </button>

      </div>

      <div className="flex flex-col">

        {activeSection === 'news' && (
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
                        className="bg-[#2d7044] text-white px-4 py-2 rounded hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044] transition-colors duration-300 ease-in-out"
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
                        className="bg-red-500 border-2 border-red-500 text-white px-4 py-2 rounded hover:border-red-500 hover:text-red-500 hover:bg-white transition-colors duration-300 ease-in-out"
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
                                type: "news",
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
          </div>
        )}

        {activeSection === 'products' && (
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
                        className="bg-[#2d7044] text-white px-4 py-2 rounded hover:text-[#2d7044] hover:bg-white border-2 border-[#2d7044] transition-colors duration-300 ease-in-out"
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
                        className="z-20 bg-red-500 text-white px-4 py-2 rounded border-2 border-red-500 hover:text-red-500 hover:bg-white transition-colors duration-300 ease-in-out"
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

      {activeSection === 'messages' && <MessagesDashboard />}
      {activeSection === 'orders' && <AllOrders />}
      {activeSection === 'promocodes' && <PromoCodes />}
      {activeSection === 'forms' && <NewsForm />}
      {activeSection === 'forms' && <ProductsForm />}
      {activeSection === 'forms' && <PromoCodeForm />}
      {activeSection === 'usersImplants' && <UsersGeneratorTypes />}
      {activeSection === '2ndLevelCerts' && <SecondLevelCerts />}

    </div>
  );
};

export default Dashboard;
