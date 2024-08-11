import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom';


function Article() {

    const { id } = useParams();

    const [article, setArticle] = useState([]);

    useEffect(() => {
        const getArticle = async () => {
            
            try {
                const response = await axios.get(`http://localhost:8080/api/article/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 200) {
                    console.log("response: ", response.data);
                    setArticle(response.data);
                }
            } catch (error) {
                console.log(error);
            }
        }

        getArticle();
    }, []);

  return (
    <div>
      <div className='flex flex-col items-center justify-center'>
        <div className='flex space-between gap-20 md:gap-[45%] w-full items-center justify-center mt-20 font-arial text-xl md:text-2xl font-bold text-[#2d7044]'>
            <div className='hover:cursor-pointer'>{"<< precedente"}</div>
            <div className='hover:cursor-pointer'>{"successivo >>"}</div>
        </div>
        <div className='mt-4 w-[100px] p-1 bg-red-600 text-arial text-center font-bold text-xl text-white rounded-lg xl:absolute xl:top-[265px] xl:left-[230px] animate-blink'>NEWS</div>
        <div className='w-full mt-8 mb-5'>
            <h1 className='font-arial text-xl md:text-3xl w-[50%] mx-auto font-bold text-center'>{article.title}</h1>
        </div>
        <img src={`http://localhost:8080/uploaded_img/${article.image}`} alt={article.title} className='w-[50%] h-[50%] md:w-[40%] md:h-[40%]  lg:w-[20%] lg:h-[20%] mx-auto rounded-lg mt-5'/>
        
        <div className='w-[80%] mt-5 mb-5 text-arial text-justify text-xl p-0'>
            <div dangerouslySetInnerHTML={{ __html: article.content }}></div>
        </div>

        {/*
        <div className='w-[80%] mt-5 mb-5 text-arial text-justify text-xl p-0'>
            Negli ultimi decenni, l’umanità ha riconosciuto l’urgenza di affrontare il cambiamento climatico e di avviare una transizione ecologica verso un futuro sostenibile. La decarbonizzazione, ovvero la riduzione delle emissioni di anidride carbonica e di altri gas serra, è un elemento cruciale di questa transizione. In questo contesto, l’intelligenza artificiale sta emergendo come uno strumento potente e indispensabile per accelerare il progresso verso un’economia a basse emissioni di carbonio.

            <h3 className='font-arial text-3xl font-semibold mt-5 mb-5'>Applicazioni dell’IA nella Decarbonizzazione</h3>

            <ul class="list-disc list-inside space-y-2">
            <li>
                <strong>Ottimizzazione della Produzione di Energia Rinnovabile</strong>
                <ul class="list-disc list-inside ml-6 space-y-1">
                    <li>
                        <strong>Previsione della Domanda e della Produzione:</strong> L’IA può analizzare dati storici e in tempo reale per prevedere la domanda energetica e la produzione di energia da fonti rinnovabili come solare e eolico. Algoritmi avanzati di machine learning permettono di gestire meglio la variabilità delle fonti rinnovabili, migliorando l’affidabilità e la stabilità della rete elettrica.
                    </li>
                    <li>
                        <strong>Gestione delle Risorse Energetiche Distribuite:</strong> L’IA può coordinare una rete di risorse energetiche distribuite, inclusi impianti solari domestici e batterie di accumulo, per ottimizzare l’uso dell’energia prodotta localmente e ridurre la dipendenza dalle fonti fossili.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Efficienza Energetica e Riduzione dei Consumi</strong>
                <ul class="list-disc list-inside ml-6 space-y-1">
                    <li>
                        <strong>Smart Grid:</strong> Le reti elettriche intelligenti, alimentate dall’IA, possono monitorare e gestire la distribuzione dell’energia in modo più efficiente, riducendo le perdite e migliorando l’affidabilità del sistema.
                    </li>
                    <li>
                        <strong>Edifici Intelligenti:</strong> L’IA può ottimizzare i sistemi di riscaldamento, ventilazione e condizionamento dell’aria negli edifici, riducendo il consumo energetico e le emissioni di CO2.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Industria e Manifattura</strong>
                <ul class="list-disc list-inside ml-6 space-y-1">
                    <li>
                        <strong>Manutenzione Predittiva:</strong> L’IA può prevedere guasti e inefficienze nei macchinari industriali, permettendo interventi di manutenzione più mirati e riducendo così i consumi energetici e le emissioni.
                    </li>
                    <li>
                        <strong>Ottimizzazione dei Processi Produttivi:</strong> Algoritmi di machine learning possono analizzare i processi produttivi e suggerire modifiche per migliorare l’efficienza energetica e ridurre gli sprechi.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Mobilità Sostenibile</strong>
                <ul class="list-disc list-inside ml-6 space-y-1">
                    <li>
                        <strong>Veicoli Autonomi e Connessi:</strong> L’IA è fondamentale nello sviluppo di veicoli autonomi che possono ridurre il consumo di carburante attraverso una guida più efficiente e una migliore gestione del traffico.
                    </li>
                    <li>
                        <strong>Pianificazione del Trasporto Pubblico:</strong> L’IA può ottimizzare i percorsi e gli orari del trasporto pubblico per ridurre i tempi di attesa e migliorare l’efficienza energetica del sistema.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Agricoltura di Precisione</strong>
                <ul class="list-disc list-inside ml-6 space-y-1">
                    <li>
                        <strong>Gestione delle Colture:</strong> L’IA può analizzare dati provenienti da sensori e satelliti per ottimizzare l’uso di acqua, fertilizzanti e pesticidi, riducendo l’impatto ambientale dell’agricoltura.
                    </li>
                    <li>
                        <strong>Monitoraggio delle Emissioni:</strong> Algoritmi avanzati possono aiutare a monitorare e ridurre le emissioni di metano e altri gas serra provenienti dalle attività agricole.
                    </li>
                </ul>
            </li>
        </ul>
        </div>*/}
        </div>
    </div>
)
}

export default Article