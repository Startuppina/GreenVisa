import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import ConfirmPopUp from "./confirmPopUp";
import MessagesDashboard from "./contacts_receiver";
import ProductsForm from "./products_form";
import PromoCodeForm from "./promoCodeForm";
import PromoCodes from "./promoCodes";
import AllOrders from "./allOrders";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import UsersGeneratorTypes from "./usersGeneratorTypes";
import SecondLevelCerts from "./secondLevelCerts";
import AllUsers from "./allUsers";
import UsersBuildings from "./UsersBuildings";
import ScrollToTop from "./scrollToTop";
import AllNews from "./allNews";
import AllProducts from "./allProducts";
import NewsForm from "./news_form";

const Dashboard = () => {
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  const [showOrders, setShowOrders] = useState(false);
  const navigate = useNavigate();

  const [buttonPopup, setButtonPopup] = useState(false);
  const [messagePopUp, setMessagePopUp] = useState("");

  const [visible, setVisible] = useState(null);

  useEffect(() => {

    const fetchMessages = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.status === 200) {
          setTotalMessages(response.data.count);
        }
      } catch (error) {
        setMessagePopUp("Errore durante il recupero dei messaggi");
        setButtonPopup(true);
      }
    };

    const fetchRequests = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-second-level-requests`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          setTotalRequests(response.data.requests.length + response.data.approved.length);
        }
      } catch (error) {
        setMessagePopup("Errore durante il recupero dei dati.");
        setButtonPopup(true);
      }
    };
    fetchMessages();
    fetchRequests();
  }, []);


  const [activeSection, setActiveSection] = useState("users");

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const [messageCountFromRequests, setMessageCountFromRequests] = useState("");

  // Funzione che sarà chiamata dal figlio per inviare i dati
  const handleDataFromRequests = (data) => {
    setMessageCountFromRequests(data); // Aggiorna lo stato con i dati ricevuti
  };

  const [messageCountFromGenerators, setMessageCountFromGenerators] = useState("");

  const handleDataFromGenerators = (data) => {
    setMessageCountFromGenerators(data); // Aggiorna lo stato con i dati ricevuti
  };


  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col lg:flex-row h-auto w-[98.5%] mx-auto my-10 font-arial text-xl m-4">
        <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
          {messagePopUp}
        </MessagePopUp>

        {/* <div className={`flex flex-wrap justify-center items-center gap-4 ${window.innerWidth < 1024 ? 'hidden' : 'block'}`}>
          <button
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "users" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("users");
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
            <span>Utenti registrati</span>
          </button>

          <button
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersBuildings" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("usersBuildings");
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"  // Same sizing as the first button
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M22 22L2 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M2 11L6.06296 7.74968M22 11L13.8741 4.49931C12.7784 3.62279 11.2216 3.62279 10.1259 4.49931L9.34398 5.12486" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M15.5 5.5V3.5C15.5 3.22386 15.7239 3 16 3H18.5C18.7761 3 19 3.22386 19 3.5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M4 22V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M20 9.5V13.5M20 22V17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M15 22V17C15 15.5858 15 14.8787 14.5607 14.4393C14.1213 14 13.4142 14 12 14C10.5858 14 9.87868 14 9.43934 14.4393M9 22V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M14 9.5C14 10.6046 13.1046 11.5 12 11.5C10.8954 11.5 10 10.6046 10 9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5Z" stroke="currentColor" stroke-width="1.5"></path>
              </g>
            </svg>
            <span>Edifici degli utenti</span>
          </button>


          <button
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "news" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
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
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "products" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}

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
            className={`relative w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "messages" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'
              } gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("messages");
            }}
          >
            {totalMessages > 0 && (
              <span className="absolute bottom-[70px] left-[270px] bg-red-500 text-white px-3 py-1 rounded-full">
                {totalMessages}
              </span>
            )}

            <div className="flex justify-center items-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 ml-4"
              >
                <g fill="#feffff">
                  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                    <path
                      strokeLinejoin="round"
                      d="M14 19c3.771 0 5.657 0 6.828-1.172C22 16.657 22 14.771 22 11c0-3.771 0-5.657-1.172-6.828C19.657 3 17.771 3 14 3h-4C6.229 3 4.343 3 3.172 4.172C2 5.343 2 7.229 2 11c0 3.771 0 5.657 1.172 6.828c.653.654 1.528.943 2.828 1.07"
                    />
                    <path d="M12 11v.01M8 11v.01m8-.01v.01M14 19c-1.236 0-2.598.5-3.841 1.145c-1.998 1.037-2.997 1.556-3.489 1.225c-.492-.33-.399-1.355-.212-3.404L6.5 17.5" />
                  </g>
                </g>
              </svg>

              <div className="flex flex-col ml-2">
                <span className="mb-2">Messaggi</span>
              </div>
            </div>
          </button>

          <button
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "orders" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
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
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "promocodes" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
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
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "forms" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
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
            <span>Aggiungi</span>
          </button>

          <button
            className={`w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersImplants" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("usersImplants");
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
            <div className="flex flex-col">
              <span>Generatori da approvare</span>
              <span>Ricevuti: {messageCountFromGenerators ? messageCountFromGenerators : "controlla"}</span>
            </div>
          </button>
          <button
            className={`relative w-[300px] h-[100px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "2ndLevelCerts" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'
              } hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("2ndLevelCerts");
            }}
          >
            {totalRequests > 0 && (
              <span className="absolute bottom-[70px] left-[270px] bg-red-500 text-white px-3 py-1 rounded-full">
                {totalRequests}
              </span>
            )}

            <div className="flex items-center justify-start h-full px-4">
              <svg
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-10 w-10 flex-shrink-0 mr-4"
              >
                <g>
                  <path
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M37.42,14.7a4.1,4.1,0,0,0-4.08-4.11h0a4.11,4.11,0,1,0,0,8.21,4.09,4.09,0,0,0,2.88-1.18,4,4,0,0,0,1.19-2.92ZM16.1,29.44l-2-2L7.9,29.42H7.7a.69.69,0,0,1-.53-.2L5.72,27.79a.7.7,0,0,1-.11-.88L7.3,24a13,13,0,0,1,10.07-6.39l2.49-.22q2.17-2.58,4-4.42A26.4,26.4,0,0,1,32,7.12a25.63,25.63,0,0,1,9.77-1.61.79.79,0,0,1,.54.22.68.68,0,0,1,.22.5A25.27,25.27,0,0,1,40.78,16,25.79,25.79,0,0,1,35,24.16c-1.23,1.24-2.71,2.57-4.42,4l-.22,2.48A13,13,0,0,1,24,40.72l-2.89,1.69a.78.78,0,0,1-.37.09.82.82,0,0,1-.52-.2l-1.45-1.46a.69.69,0,0,1-.18-.71l1.93-6.27-1.94-1.94"
                  />
                  <line x1="30.62" y1="28.16" x2="20.52" y2="33.86" />
                  <line x1="19.86" y1="17.39" x2="14.15" y2="27.49" />
                  <path
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13,35c4-.74,11.1-7.4,11.93-11.93C20.37,23.94,13.71,31,13,35Z"
                  />
                </g>
              </svg>

              <div className="flex flex-col justify-center">
                <span className="text-lg font-medium">Richieste certificazioni 2° livello</span>
              </div>
            </div>
          </button>

        </div>
        */}


        <div className={`flex flex-col justify-start items-start gap-4 mr-4  ${window.innerWidth < 1024 ? 'hidden' : 'block'}`}>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "users" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("users");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "users" ? "users" : null);
              }}
              onMouseEnter={() => setVisible("users")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "users" && setVisible(null)} // Nascondi solo se non è attivo
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
                  d="M12 12c2.7 0 4.91-2.21 4.91-4.91S14.7 2.18 12 2.18 7.09 4.39 7.09 7.09 9.3 12 12 12zM12 14c-4.42 0-8 2.58-8 6.5V22h16v-1.5c0-3.92-3.58-6.5-8-6.5z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "users" || visible === "users" ? 'opacity-100' : 'opacity-0'}`}>
              Utenti
            </span>
          </div>


          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersBuildings" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("usersBuildings");
                setVisible(activeSection === "usersBuildings" ? "usersBuildings" : null);
              }}
              onMouseEnter={() => setVisible("usersBuildings")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "usersBuildings" && setVisible(null)} // Nascondi solo se non è attivo
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"  // Same sizing as the first button
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M22 22L2 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  <path d="M2 11L6.06296 7.74968M22 11L13.8741 4.49931C12.7784 3.62279 11.2216 3.62279 10.1259 4.49931L9.34398 5.12486" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  <path d="M15.5 5.5V3.5C15.5 3.22386 15.7239 3 16 3H18.5C18.7761 3 19 3.22386 19 3.5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  <path d="M4 22V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  <path d="M20 9.5V13.5M20 22V17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  <path d="M15 22V17C15 15.5858 15 14.8787 14.5607 14.4393C14.1213 14 13.4142 14 12 14C10.5858 14 9.87868 14 9.43934 14.4393M9 22V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M14 9.5C14 10.6046 13.1046 11.5 12 11.5C10.8954 11.5 10 10.6046 10 9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5Z" stroke="currentColor" stroke-width="1.5"></path>
                </g>
              </svg>
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "usersBuildings" || visible === "usersBuildings" ? 'opacity-100' : 'opacity-0'}`}>
              Edifici degli utenti
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "news" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("news");
                setVisible(activeSection === "news" ? "news" : null);
              }}
              onMouseEnter={() => { setVisible("news"); }} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "news" && setVisible(null)} // Nascondi solo se non è attivo
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "news" || visible === "news" ? 'opacity-100' : 'opacity-0'}`}>
              News
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "products" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("products");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "products" ? "products" : null);
              }}
              onMouseEnter={() => setVisible("products")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "products" && setVisible(null)} // Nascondi solo se non è attivo
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "products" || visible === "products" ? 'opacity-100' : 'opacity-0'}`}>
              Certificazioni
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`relative mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "messages" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'
                } gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("messages");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "messages" ? "messages" : null);
              }}
              onMouseEnter={() => setVisible("messages")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "messages" && setVisible(null)} // Nascondi solo se non è attivo
            >
              {totalMessages > 0 && (
                <span className="absolute left-[-20px] bottom-[20px] bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                  {totalMessages}
                </span>
              )}

              <div className="flex justify-center items-center">
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
                      <path
                        strokeLinejoin="round"
                        d="M14 19c3.771 0 5.657 0 6.828-1.172C22 16.657 22 14.771 22 11c0-3.771 0-5.657-1.172-6.828C19.657 3 17.771 3 14 3h-4C6.229 3 4.343 3 3.172 4.172C2 5.343 2 7.229 2 11c0 3.771 0 5.657 1.172 6.828c.653.654 1.528.943 2.828 1.07"
                      />
                      <path d="M12 11v.01M8 11v.01m8-.01v.01M14 19c-1.236 0-2.598.5-3.841 1.145c-1.998 1.037-2.997 1.556-3.489 1.225c-.492-.33-.399-1.355-.212-3.404L6.5 17.5" />
                    </g>
                  </g>
                </svg>
              </div>
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "messages" || visible === "messages" ? 'opacity-100' : 'opacity-0'}`}>
              Messaggi
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "orders" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("orders");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "orders" ? "orders" : null);
              }}
              onMouseEnter={() => setVisible("orders")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "orders" && setVisible(null)} // Nascondi solo se non è attivo
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "orders" || visible === "orders" ? 'opacity-100' : 'opacity-0'}`}>
              Ordini
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "promocodes" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("promocodes");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "promocodes" ? "promocodes" : null);
              }}
              onMouseEnter={() => setVisible("promocodes")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "promocodes" && setVisible(null)} // Nascondi solo se non è attivo
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "promocodes" || visible === "promocodes" ? 'opacity-100' : 'opacity-0'}`}>
              Codici Promozionali
            </span>
          </div>

          <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "forms" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("forms");
                // Mantiene il testo visibile se il pulsante è attivo
                setVisible(activeSection === "forms" ? "forms" : null);
              }}
              onMouseEnter={() => setVisible("forms")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "forms" && setVisible(null)} // Nascondi solo se non è attivo
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "forms" || visible === "forms" ? 'opacity-100' : 'opacity-0'}`}>
              Aggiungi
            </span>
          </div>

          {/*
                      <div className="flex justify-center items-start gap-2">
            <button
              className={`mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersImplants" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("usersImplants");
                setVisible(activeSection === "usersImplants" ? "usersImplants" : null);
              }}
              onMouseEnter={() => setVisible("usersImplants")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "usersImplants" && setVisible(null)} // Nascondi solo se non è attivo
            >
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
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "usersImplants" || visible === "usersImplants" ? 'opacity-100' : 'opacity-0'}`}>
              Validazione impianti
            </span>
          </div>
          */}


          <div className="flex justify-center items-start gap-2">
            <button
              className={`relative mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "2ndLevelCerts" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
              onClick={() => {
                toggleSection("2ndLevelCerts");
                setVisible(activeSection === "2ndLevelCerts" ? "2ndLevelCerts" : null);
              }}
              onMouseEnter={() => setVisible("2ndLevelCerts")} // Mostra il testo al passaggio del mouse
              onMouseLeave={() => activeSection !== "2ndLevelCerts" && setVisible(null)} // Nascondi solo se non è attivo
            >
              {totalRequests > 0 && (
                <span className="absolute left-[-20px] bottom-[20px] bg-red-500 text-white px-3 py-1 text-sm rounded-full">
                  {totalRequests}
                </span>
              )}

              <div className="flex items-center justify-start h-full">
                <svg
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <g>
                    <path
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M37.42,14.7a4.1,4.1,0,0,0-4.08-4.11h0a4.11,4.11,0,1,0,0,8.21,4.09,4.09,0,0,0,2.88-1.18,4,4,0,0,0,1.19-2.92ZM16.1,29.44l-2-2L7.9,29.42H7.7a.69.69,0,0,1-.53-.2L5.72,27.79a.7.7,0,0,1-.11-.88L7.3,24a13,13,0,0,1,10.07-6.39l2.49-.22q2.17-2.58,4-4.42A26.4,26.4,0,0,1,32,7.12a25.63,25.63,0,0,1,9.77-1.61.79.79,0,0,1,.54.22.68.68,0,0,1,.22.5A25.27,25.27,0,0,1,40.78,16,25.79,25.79,0,0,1,35,24.16c-1.23,1.24-2.71,2.57-4.42,4l-.22,2.48A13,13,0,0,1,24,40.72l-2.89,1.69a.78.78,0,0,1-.37.09.82.82,0,0,1-.52-.2l-1.45-1.46a.69.69,0,0,1-.18-.71l1.93-6.27-1.94-1.94"
                    />
                    <line x1="30.62" y1="28.16" x2="20.52" y2="33.86" />
                    <line x1="19.86" y1="17.39" x2="14.15" y2="27.49" />
                    <path
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13,35c4-.74,11.1-7.4,11.93-11.93C20.37,23.94,13.71,31,13,35Z"
                    />
                  </g>
                </svg>
              </div>
            </button>
            <span className={`transition-opacity duration-300 ease-in-out ${activeSection === "2ndLevelCerts" || visible === "2ndLevelCerts" ? 'opacity-100' : 'opacity-0'}`}>
              Certificati di 2° Livello
            </span>
          </div>

        </div>

        <div className={`flex flex-wrap justify-center items-center gap-4 ${window.innerWidth < 1024 ? 'block' : 'hidden'}`}>
          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "users" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("users");
            }}
          >
            <span className="truncate">Utenti registrati</span>
          </button>
          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersBuildings" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("usersBuildings");
            }}
          >
            <span className="truncate">Edifici degli utenti</span>
          </button>
          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "news" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("news");
            }}
          >
            <span className="truncate">News</span>
          </button>

          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "products" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("products");
            }}
          >
            <span className="truncate">Certificazioni</span>
          </button>
          <button
            className={`relative w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "messages" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("messages");
            }}
          >
            {totalMessages > 0 && (
              <span className="absolute bottom-[40px] left-[125px] bg-red-500 text-white px-3 py-1 rounded-full">
                {totalMessages}
              </span>
            )}
            <div className="flex justify-center items-center">
              <div className="flex flex-col ml-2">
                <span className="truncate">Messaggi</span>
              </div>
            </div>
          </button>

          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "orders" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("orders");
            }}
          >
            <span className="truncate">Ordini utenti</span>
          </button>

          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "promocodes" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("promocodes");
            }}
          >
            <span className="truncate">Codici promozionali</span>
          </button>

          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "forms" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("forms");
            }}
          >
            <span className="truncate">Aggiungi</span>
          </button>

          <button
            className={`w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "usersImplants" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("usersImplants");
            }}
          >
            <span className="overflow-hidden whitespace-nowrap text-ellipsis">Generatori da approvare</span>
          </button>

          <button
            className={`relative w-[150px] h-[60px] mb-4 rounded-lg border-[#2d7044] border-2 ${activeSection === "2ndLevelCerts" ? 'bg-[#2d7044] text-white' : 'bg-white text-[#2d7044]'} flex justify-center items-center gap-2 hover:bg-[#2d7044] hover:text-white transition-colors duration-300 ease-in-out`}
            onClick={() => {
              toggleSection("2ndLevelCerts");
            }}
          >
            {totalRequests > 0 && (
              <span className="absolute bottom-[40px] left-[125px] bg-red-500 text-white px-3 py-1 rounded-full text-xl">
                {totalRequests}
              </span>
            )}
            <span className="overflow-hidden whitespace-nowrap text-ellipsis">
              Certificati secondo livello
            </span>
          </button>


        </div>

        <div className="w-full">
          {activeSection === 'news' && <AllNews />}
          {activeSection === 'products' && <AllProducts />}
          {activeSection === 'users' && <AllUsers />}
          {activeSection === 'usersBuildings' && <UsersBuildings />}
          {activeSection === 'messages' && <MessagesDashboard />}
          {activeSection === 'orders' && <AllOrders />}
          {activeSection === 'promocodes' && <PromoCodes />}
          <div className="flex flex-col">
            {activeSection === 'forms' && <NewsForm />}
            {activeSection === 'forms' && <ProductsForm />}
            {activeSection === 'forms' && <PromoCodeForm />}
          </div>
          {activeSection === 'usersImplants' && <UsersGeneratorTypes sendDataToParent={handleDataFromGenerators} />}
          {activeSection === '2ndLevelCerts' && <SecondLevelCerts sendDataToParent={handleDataFromRequests} />}

        </div>

      </div >
    </>
  );
};

export default Dashboard;
