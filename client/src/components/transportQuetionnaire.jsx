import React, { useState, useEffect } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";

function SurveyComponent({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const { initialData, setInitialData } = useRecoveryContext(); // Stato per i dati iniziali
  const [totalScore, setTotalScore] = useState(0);

  //          <p>Hai totalizzato un punteggio di: <span class="score">${totalScore}</span> punti.</p>
  const json = {
    "title": "Certificazione trasporti",
    "logoPosition": "right",
    "completedHtml": `
      <style>
        .completed-page {
          text-align: center;
          font-family: Arial, sans-serif;
          color: #333;
          padding: 20px;
        }
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;

        }
        .message {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .message p {
          margin-bottom: 10px;
          font-size: 20px;
        }
        .message .score {
          font-size: 20px;
          font-weight: bold;
          color: #007bff;
        }
        .button-container {
          display: flex;
          justify-content: center;
        }
        .button-container button {
        font-size: 16px;
        padding: 0.5rem; /* p-2 */
        width: 200px; /* w-[150px] */
        z-index: 10; /* z-10 */
        background-color: #2d7044; /* bg-[#2d7044] */
        color: white; /* text-white */
        border-radius: 0.5rem; /* rounded-lg */
        border: 2px solid transparent; /* border-2 border-transparent */
        transition: background-color 300ms ease-in-out, color 300ms ease-in-out, border-color 300ms ease-in-out; /* transition-colors duration-300 ease-in-out */
      }
      .button-container button:hover {
        background-color: white; /* hover:bg-white */
        color: #2d7044; /* hover:text-[#2d7044] */
        border-color: #2d7044; /* hover:border-[#2d7044] */
      }
        
      </style>
      <div class="completed-page">
        <div class="logo-container">
          <img src="/public/img/logo.png" alt="Logo" class="logo">
        </div>
        <div class="message">
          <h2>Questionario completato!</h2>
          <p>Controlla la pagina utente per vedere il punteggio accumulato</p>
          <div class="button-container">
            <button onclick="window.location.href = '/User';">Torna alla pagina utente</button>
          </div>
        </div>
      </div>
    `,
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "radiogroup",
            "name": "question1",
            "title": "I criteri individuati mirano a limitare i principali impatti ambientali connessi alle caratteristiche fondamentali dell’attività che si sta procedendo a certificare. Per quest’area d’analisi le tematiche analizzate saranno quelle relative a:",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Indicazione del sistema di trasporto",
                "score": 1
              },
              {
                "value": "Item 2",
                "text": "Numero di mezzi da certificare",
                "score": 1
              },
              {
                "value": "Item 3",
                "text": "Utilizzo dei mezzi",
                "score": 1
              },
              {
                "value": "Item 4",
                "text": "Conferma del rispetto delle norme in riferimento alla gestione del mezzo (revisioni, assicurazioni, bolli, tagliandi)",
                "score": 1
              }
            ]
          },
          {
            "type": "multipletext",
            "name": "question2",
            "title": "Quanti e quali tipologie di mezzi di trasporto ha la sua attività?\n",
            "isRequired": true,
            "items": [
              {
                "name": "text1",
                "title": "Autobus\n",
                "score": 1
              },
              {
                "name": "text2",
                "title": "Minibus",
                "score": 1
              },
              {
                "name": "text3",
                "title": "Autovetture\n",
                "score": 1
              },
              {
                "name": "text4",
                "title": "Autovetture Cabrio\n",
                "score": 1
              },
              {
                "name": "text5",
                "title": "Scooter",
                "score": 1
              },
              {
                "name": "text6",
                "title": "Moto",
                "score": 1
              },
              {
                "name": "text7",
                "title": "Biciclette",
                "score": 1
              },
              {
                "name": "text8",
                "title": "Trasporto su acqua",
                "score": 1
              },
              {
                "name": "text9",
                "title": "Aerotrasporti\n",
                "score": 1
              }
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question3",
            "title": "In che anno sono stati immatricolati i mezzi sopra descritti?\n",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Mezzo",
                "cellType": "text"
              },
              {
                "name": "Column 2",
                "title": "Anno",
                "cellType": "dropdown",
                "choices": [
                  {
                    "value": 1,
                    "text": "2024"
                  },
                  {
                    "value": 2,
                    "text": "2023"
                  },
                  {
                    "value": 3,
                    "text": "2022"
                  },
                  {
                    "value": 4,
                    "text": "2021"
                  },
                  {
                    "value": 5,
                    "text": "2020"
                  },
                  {
                    "value": 6,
                    "text": "Prima del 2020"
                  },
                  {
                    "value": 7,
                    "text": "Prima del 2010"
                  }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question4",
            "title": "I mezzi che sta certificando rientrano nella macro area di emissioni, denominata euro?",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Mezzo",
                "cellType": "text"
              },
              {
                "name": "Column 2",
                "title": "Euro",
                "cellType": "dropdown",
                "choices": [
                  {
                    "value": 1,
                    "text": "6"
                  },
                  {
                    "value": 2,
                    "text": "5"
                  },
                  {
                    "value": 3,
                    "text": "4"
                  },
                  {
                    "value": 4,
                    "text": "3"
                  },
                  {
                    "value": 5,
                    "text": "2"
                  }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5
            ]
          },
          {
            "type": "radiogroup",
            "name": "question5",
            "title": "I mezzi di trasporto che sta certificando quanto Km l’anno percorrono?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Da 1000 a 10000 Km",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "Da 10000 a 20000 Km",
                "score": 50
              },
              {
                "value": "Item 3",
                "text": "Da 20000 a 50000 Km",
                "score": 25
              },
              {
                "value": "Item 4",
                "text": "Più di 50000 Km",
                "score": 10
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question6",
            "title": "Conferma il rispetto delle norme vigenti in merito alla gestione, manutenzione e assicurazione dei mezzi che sta certificando?",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Si",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              }
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question8",
            "title": "Indichi la data dell’ultima revisione fatta ai mezzi che sta certificando",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Mezzo",
                "cellType": "text"
              },
              {
                "name": "Column 2",
                "title": "Anno",
                "cellType": "dropdown",
                "choices": [
                  {
                    "value": 1,
                    "text": "2024"
                  },
                  {
                    "value": 2,
                    "text": "2023"
                  },
                  {
                    "value": 3,
                    "text": "2022"
                  },
                  {
                    "value": 4,
                    "text": "2021"
                  },
                  {
                    "value": 5,
                    "text": "2020"
                  },
                  {
                    "value": 6,
                    "text": "Prima del 2020"
                  },
                  {
                    "value": 7,
                    "text": "Prima del 2010"
                  }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question9",
            "title": "Indichi ove vi fosse, la presenza del bollino blu* relativamente ai mezzi che sta certificando\n",
            "description": "Si tratta del bollino che viene rilasciato al momento della revisione dell’autoveicolo o del motoveicolo a seguito del controllo dei dispositivi di combustione e scarico",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Mezzo",
                "cellType": "text"
              },
              {
                "name": "Column 2",
                "title": "Bollino",
                "cellType": "dropdown",
                "choices": [
                  {
                    "value": 1,
                    "text": "Si"
                  },
                  {
                    "value": 2,
                    "text": "No"
                  },
                  3,
                  4,
                  5
                ],
                "storeOthersAsComment": true
              },
              {
                "name": "Column 3",
                "title": "Anno\n",
                "cellType": "dropdown",
                "choices": [
                  {
                    "value": 1,
                    "text": "2024"
                  },
                  {
                    "value": 2,
                    "text": "2023"
                  },
                  {
                    "value": 3,
                    "text": "2022"
                  },
                  {
                    "value": 4,
                    "text": "2021"
                  },
                  {
                    "value": 5,
                    "text": "2020"
                  },
                  {
                    "value": 6,
                    "text": "Prima del 2020"
                  },
                  {
                    "value": 7,
                    "text": "Prima del 2010"
                  }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5
            ]
          },
          {
            "type": "html",
            "name": "question7",
            "html": "<p style=\"font-family: Arial, sans-serif; font-size: 1em; font-weight: bold;\">\n  Indichi la tipologia di alimentazione dei mezzi in esame\n</p>\n\n"
          },
          {
            "type": "radiogroup",
            "name": "question10",
            "visibleIf": "{question2.text1} notempty",
            "title": "Autobus:\n",
            "requiredIf": "{question2.text1} notempty",
            "choices": [
              {
                "value": "Item 1",
                "text": "Elettrico",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "Ibrido",
                "score": 80
              },
              {
                "value": "Item 3",
                "text": "Benzina",
                "score": 65
              },
              {
                "value": "Item 4",
                "text": "Diesel",
                "score": 35
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question11",
            "visibleIf": "{question2.text2} notempty",
            "title": "Minibus:\n",
            "requiredIf": "{question2.text2} notempty",
            "choices": [
              {
                "value": "Item 1",
                "text": "Elettrico",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "Ibrido",
                "score": 80
              },
              {
                "value": "Item 3",
                "text": "Benzina",
                "score": 65
              },
              {
                "value": "Item 4",
                "text": "Diesel",
                "score": 35
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question12",
            "visibleIf": "{question2.text3} notempty or {question2.text4} notempty",
            "title": "Trasporto con autovetture:\n",
            "requiredIf": "{question2.text3} notempty or {question2.text4} notempty",
            "choices": [
              {
                "value": "Item 1",
                "text": "Elettrico",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "Ibrido",
                "score": 80
              },
              {
                "value": "Item 3",
                "text": "Benzina",
                "score": 65
              },
              {
                "value": "Item 4",
                "text": "Diesel",
                "score": 35
              },
              {
                "value": "Item 5",
                "text": "Servizio carpool",
                "score": 85
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question13",
            "visibleIf": "{question2.text5} notempty or\n{question2.text6} notempty ",
            "title": "Trasporto con scooter e moto:\n",
            "requiredIf": "{question2.text5} notempty or\n{question2.text6} notempty ",
            "choices": [
              {
                "value": "Item 1",
                "text": "Elettrico",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "Benzina",
                "score": 65
              },
              {
                "value": "Item 3",
                "text": "Miscela",
                "score": 5
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question14",
            "visibleIf": "{question2.text7} notempty ",
            "title": "Trasporto con bicilette:\n",
            "requiredIf": "{question2.text7} notempty ",
            "choices": [
              {
                "value": "Item 1",
                "text": "Elettrico",
                "score": 75
              },
              {
                "value": "Item 2",
                "text": "tradizionale",
                "score": 100
              }
            ]
          },
          {
            "type": "panel",
            "name": "question15",
            "visibleIf": "{question2.text9} notempty ",
            "requiredIf": "{question2.text9} notempty ",
            "title": "Trasporto su acqua:",
            "elements": [
              {
                "type": "text",
                "name": "question16",
                "visibleIf": "{question2.text8} notempty ",
                "title": "Specifichi il tipo di mezzo\n",
                "requiredIf": "{question2.text8} notempty "
              },
              {
                "type": "radiogroup",
                "name": "question17",
                "visibleIf": "{question2.text8} notempty ",
                "title": "Motore:\n",
                "requiredIf": "{question2.text8} notempty ",
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "Benzina",
                    "score": 65
                  },
                  {
                    "value": "Item 2",
                    "text": "Diesel",
                    "score": 35
                  },
                  {
                    "value": "Item 3",
                    "text": "Gas",
                    "score": 75
                  },
                  {
                    "value": "Item 4",
                    "text": "Elettrico",
                    "score": 85
                  },
                  {
                    "value": "Item 5",
                    "text": "Vela",
                    "score": 100

                  },
                  {
                    "value": "Item 6",
                    "text": "Remi",
                    "score": 100
                  }
                ]
              }
            ]
          },
          {
            "type": "panel",
            "name": "question18",
            "visibleIf": "{question2.text9} notempty ",
            "requiredIf": "{question2.text9} notempty ",
            "title": "Aerotrasporti:",
            "elements": [
              {
                "type": "text",
                "name": "question19",
                "visibleIf": "{question2.text9} notempty ",
                "title": "Specifichi il tipo di mezzo",
                "requiredIf": "{question2.text9} notempty "
              },
              {
                "type": "text",
                "name": "question20",
                "visibleIf": "{question2.text9} notempty ",
                "title": "Specifichi il tipo di alimentazione:",
                "requiredIf": "{question2.text9} notempty "
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question21",
            "title": "Nel calcolo dei percorsi nella vostra attività si fa uso di software o navigatori in modo da ottimizzare il viaggio e circolare in regime di risparmio e rispetto dell’ambiente?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "si",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              },
            ]
          },
          {
            "type": "radiogroup",
            "name": "question22",
            "title": "I mezzi che sta certificando utilizzano pneumatici con etichetta energetica in classe A con caratteristiche di elevato rotolamento?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "si",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 35
              },
              {
                "value": "Item 3",
                "text": "Non tutti",
                "score": 75
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question23",
            "title": "Il personale conducente è stato formato alle tecniche di guida volte alla riduzione dei consumi? (eco-drive)?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "si",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              },
              {
                "value": "Item 3",
                "text": "Non tutti",
                "score": 50
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question24",
            "title": "Sarebbe interessato ad un corso di mobility manager*?\n",
            "description": "Il mobility manager è la figura che consente di dare risposte di breve periodo ai problemi della congestione del traffico e delle sue conseguenze sulla salute. Opera sul governo della domanda di trasporto, lavorando in particolare sugli spostamenti e sui comportamenti delle persone. Il mobility manager aziendale ha un’importante funzione poiché pianifica all’interno dell’attività e permette di ottimizzare i costi per gli spostamenti in armonia con le politiche di mobilità sostenibile del territorio in cui l’attività opera, migliorandone difatti l’immagine complessiva ed il rapporto con gli stakeholder.",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "si",
                "score": 35
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question25",
            "title": "Sarebbe interessato ad una certificazione di 2° livello?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "si",
                "score": 35
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question26",
            "title": "Sarebbe interessato a portare avanti un’attività di auditing energetico* per la struttura (Vs. uffici direzionali) che ha appena certificato?",
            "description": "Per auditing Energetico si intende quell’attività che si pone l’obiettivo di capire in che modo l’energia viene utilizzata, quali sono le cause degli eventuali sprechi ed eventualmente quali interventi possono essere suggeriti all’utente. \nLa proposta all’utente si traduce in un piano energetico che valuti non solo la fattibilità tecnica ma anche e soprattutto quella economica degli interventi migliorativi proposti",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Si",
                "score": 80
              },
              {
                "value": "Item 2",
                "text": "No",
                "score": 0
              }
            ]
          },
        ]
      }
    ]
  }


  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/user-info', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.status === 200) {
          setUserInfo(response.data.id);
          restoreSurveyData(response.data.id);
        }

      } catch (error) {
        console.error("Error fetching user info:", error);
        setMessagePopup(error.response?.data?.msg || error.message);
        setButtonPopup(true);
      }
    };

    fetchInfo();
  }, []);

  async function restoreSurveyData(surveyId) {
    console.log("Restoring survey data for survey ID:", surveyId);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:8080/api/responses/${surveyId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.data) {
        const surveyData = typeof response.data.survey_data === 'string'
          ? JSON.parse(response.data.survey_data)
          : response.data.survey_data;

        setInitialData({ surveyData, pageNo: response.data.pageNo });
      }
    } catch (error) {
      console.error("Error restoring survey data:", error);
    }
  }

  const survey = new Model(json);

  useEffect(() => {

    if (initialData) {
      survey.data = initialData.surveyData;
      survey.currentPageNo = initialData.pageNo;
    }
    survey.applyTheme(themeJson);

  }, [survey]);


  useEffect(() => {

    // Aggiungi i gestori dell'evento onComplete
    survey.onValueChanged.add(saveSurveyData);
    survey.onComplete.add(handleSurveyComplete);

    // Cleanup
    return () => {
      survey.onValueChanged.remove(saveSurveyData);
      survey.onComplete.remove(handleSurveyComplete);
    };
  }, [survey]);


  function handleSurveyComplete() {
    saveSurveyData(survey);

    console.log("Answers:", survey.data);
  }


  async function submitSurveyData(data) {
    const token = localStorage.getItem('token');
    console.log("Submitting survey data:", data);
    try {
      await axios.post("http://localhost:8080/api/responses", data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("Survey data saved successfully");
    } catch (error) {
      console.error("Error saving survey data:", error);
    }
  }

  function saveSurveyData(survey) {
    let totalScore = calcolaPunteggio(survey.data);
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
    };
    submitSurveyData(data);
  }

  // Funzione per calcolare il punteggio totale
  function calcolaPunteggio(formData) {
    let punteggioTotale = 0;

    // Itera attraverso le pagine
    json.pages.forEach(page => {
      page.elements.forEach(element => {
        // Controlla il tipo di elemento e calcola il punteggio
        console.log(`Elemento: ${element.name}, tipo: ${element.type}`);
        switch (element.type) {
          case 'radiogroup':
            const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
            punteggioTotale += punteggioRadiogroup;
            console.log(`Domanda: ${element.title}, Risposta: ${formData[element.name]}, Punteggio: ${punteggioRadiogroup}`);
            break;
          case 'multipletext':
            const punteggioMultipletext = calcolaPunteggioMultipletext(formData[element.name], element);
            punteggioTotale += punteggioMultipletext;
            console.log(`Domanda: ${element.title}, Risposte: ${JSON.stringify(formData[element.name])}, Punteggio: ${punteggioMultipletext}`);
            break;
          case 'matrixdynamic':
            const punteggioMatrixdynamic = calcolaPunteggioMatrixdynamic(formData[element.name], element);
            punteggioTotale += punteggioMatrixdynamic;
            console.log(`Domanda: ${element.title}, Risposte: ${JSON.stringify(formData[element.name])}, Punteggio: ${punteggioMatrixdynamic}`);
            break;
          case 'panel':
            const punteggioPanel = calcolaPunteggioPanel(formData[element.name], element);
            punteggioTotale += punteggioPanel;
            console.log(`Pannello: ${element.title}, Punteggio: ${punteggioPanel}`);
            break;
          case 'html':
            break;
          default:
            console.warn(`Tipo di domanda non gestito: ${element.type}`);
        }
      });
    });

    return punteggioTotale;
  }


  // Funzione per calcolare il punteggio per le domande di tipo radiogroup
  function calcolaPunteggioRadiogroup(response, element) {
    let punteggio = 0;
    if (response && element.choices) {
      const scelta = element.choices.find(choice => choice.value === response);
      if (scelta) {
        punteggio = scelta.score || 0;
      }
    }
    return punteggio;
  }


  // Funzione per calcolare il punteggio per le domande di tipo multipletext
  function calcolaPunteggioMultipletext(response, element) {
    let punteggio = 0;
    element.items.forEach(item => {
      console.log(`Item: ${item.name}, Risposta: ${response[item.name]}`);
      if (response[item.name]) {
        punteggio += item.score || 0;
        console.log(`Punteggio multiple text: ${punteggio}`);
      }
    });
    return punteggio;
  }

  const yearScores = {
    1: 100, //2024
    2: 95, //2023
    3: 90, //2022
    4: 85, //2021
    5: 80, //2020
    6: 50, //prima 2020
    7: 25 //prima 2010
  };

  const euroScores = {
    1: 100, //euro 6
    2: 75, //euro 5
    3: 50, //euro 4 
    4: 0, //euro 3
    5: 0 //euro 2
  };


  // Funzione per calcolare il punteggio per le domande di tipo matrixdynamic
  function calcolaPunteggioMatrixdynamic(responses, element) {
    let punteggioTotale = 0;

    // Funzione per calcolare il punteggio in base all'anno
    const calcolaPunteggioAnno = (response) => {
      console.log("Punteggio anno", response["Column 2"]);
      const punteggio = yearScores[response["Column 2"]] || 0;
      console.log(`Anno: ${response["Column 2"]}, Punteggio: ${punteggio}`);
      return punteggio;
    };

    // Funzione per calcolare il punteggio in base all'Euro
    const calcolaPunteggioEuro = (response) => {
      const punteggio = euroScores[response["Column 2"]] || 0;
      console.log(`Euro: ${response["Column 2"]}, Punteggio: ${punteggio}`);
      return punteggio;
    };

    responses.forEach(row => {
      if (element.name === 'question3' || element.name === 'question8') {
        // Calcola il punteggio per le domande basate sull'anno
        const punteggioAnno = calcolaPunteggioAnno(row);
        punteggioTotale += punteggioAnno;
      } else if (element.name === 'question4') {
        // Calcola il punteggio per le domande basate sugli Euro
        const punteggioEuro = calcolaPunteggioEuro(row);
        punteggioTotale += punteggioEuro;
      } else if (element.name === 'question9') {
        // Calcola il punteggio per la domanda 9
        if (row["Column 2"] === 1) {
          console.log("Column2 bollino valore", row["Column 2"]);
          // Se la risposta è "Si", calcola il punteggio basato sull'anno
          const punteggioAnno = yearScores[row["Column 3"]] || 0;
          punteggioTotale += punteggioAnno;
          console.log(`Domanda: ${element.name}, Risposta: Si, Anno: ${row["Column 3"]}, Punteggio: ${punteggioAnno}`);
        } else if (row["Column 2"] === 0) {
          // Se la risposta è "No", il punteggio è 0
          punteggioTotale += 0;
          console.log(`Domanda: ${element.name}, Risposta: No, Punteggio: 0`);
        }
      }
    });

    return punteggioTotale;
  }

  // Funzione per calcolare il punteggio per i pannelli
  function calcolaPunteggioPanel(formData, panel) {
    let punteggio = 0;

    if (formData && panel.elements) {
      panel.elements.forEach(element => {
        if (element.type === 'radiogroup') {
          const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
          punteggio += punteggioRadiogroup;
          console.log(`Domanda nel pannello: ${element.name}, Risposta: ${formData[element.name]}, Punteggio: ${punteggioRadiogroup}`);
        } else if (element.type === 'text') {
          // Puoi aggiungere logica specifica per i campi di testo se necessario
        }
      });
    }

    return punteggio;
  }



  return <Survey model={survey} />;
}

export default SurveyComponent;