import React, { useState, useEffect } from "react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ScrollToTop from "./components/scrollToTop";
import axios from "axios";
import MessagePopUp from "./components/messagePopUp";

const CertificationPage = () => {
    const [userInfo, setUserInfo] = useState({});
    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState("");

    const generatePDF = () => {
        const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' per landscape, formato A4

        // Specifica le dimensioni dell'immagine e del testo
        const imgSrc = '/img/empty_certificate.png'; // Percorso dell'immagine
        const imgWidth = 297;  // Larghezza A4 in mm
        const imgHeight = 210; // Altezza A4 in mm

        // Aggiungi l'immagine al PDF
        pdf.addImage(imgSrc, 'PNG', 0, 0, imgWidth, imgHeight); // Posiziona l'immagine in alto a sinistra

        // Aggiungi l'anno (centro dell'immagine)
        const year = new Date().getFullYear();
        pdf.setFontSize(30); // Imposta la dimensione del carattere 
        pdf.setFont("Helvetica", "bold"); // Imposta il carattere in grassetto
        pdf.text(year.toString(), pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() / 2 + 20, {
            align: 'center'
        });

        // Aggiungi il nome dell'azienda
        pdf.setFontSize(25); // Imposta una dimensione del carattere più piccola
        const companyName = "Nome Azienda"; // Sostituisci con il nome della tua azienda
        pdf.setFont("Helvetica", "bold"); // Imposta il carattere in grassetto
        pdf.text(companyName, pdf.internal.pageSize.getWidth() / 2, (pdf.internal.pageSize.getHeight() / 2) + 50, {
            align: 'center'
        });

        // Salva il PDF
        pdf.save('Certification.pdf'); // Salva il PDF
    };

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await axios.get(`/api/user-info`, {
                    withCredentials: true
                });

                if (response.status === 200) {
                    setUserInfo(response.data);

                }

            } catch (error) {
                console.error("Error fetching user info:", error);
                setMessagePopup(error.response?.data?.msg || error.message);
                setButtonPopup(true);
            }
        };

        fetchInfo();
    }, []);


    return (
        <>
            <ScrollToTop />
            <Navbar />
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup} MessagePopUp>
                {messagePopup}
            </MessagePopUp>
            <div className="font-arial text-xl mt-10 h-screen">
                <h1 className="text-center font-bold text-3xl">Certificazione</h1>
                <p className="text-center">Qui puoi scaricare la tua certificazione</p>
                <p className="text-center">Pagina di test</p>
                <div className="flex justify-center">
                    <button onClick={() => {
                        setTimeout(() => {
                            generatePDF();
                        }, 3000);
                    }}
                        className="mb-4 p-2 bg-blue-500 border-2 border-blue-500 rounded-lg text-white hover:bg-white hover:text-blue-500 transition-color duration-300 ease-in-out mt-10">
                        Scarica Certificazione
                    </button>
                </div>
                <div id="certification" className="flex justify-center">
                    {/* Contenitore responsivo per l'immagine della certificazione */}
                    <div className="relative w-full sm:w-2/3 md:w-1/2">
                        {/* Immagine della certificazione */}
                        <img src="/img/empty_certificate.png" alt="certification" className="w-full relative" />

                        {/* Posizionamento dell'anno (bloccato sull'immagine) */}
                        <div className="absolute top-[55%] md:top-[53%] left-[50%] transform -translate-x-1/2 text-2xl sm:text-3xl lg:text-4xl font-bold">
                            {new Date().getFullYear()}
                        </div>

                        {/* Posizionamento del nome dell'azienda (bloccato sull'immagine) */}
                        <div className="absolute top-[67%] md:top-[66%] lg:top-[67%] left-[50%] transform -translate-x-1/2 text-xl sm:text-2xl lg:text-3xl font-bold">
                            {userInfo.company_name}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default CertificationPage;
