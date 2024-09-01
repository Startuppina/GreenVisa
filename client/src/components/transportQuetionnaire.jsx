import React, { useState, useEffect } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import { useNavigate } from "react-router-dom";

function SurveyComponent({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const { initialData, setInitialData } = useRecoveryContext(); // Stato per i dati iniziali
  const [totalScore, setTotalScore] = useState(0);

  const json = {
    "title": "Questionario certificazione trasporti",
    "completeText": "Invia",
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
          <p>Hai totalizzato un punteggio di: <span class="score">${totalScore}</span> punti.</p>
          <div class="button-container">
            <button onclick="window.location.href = '/User';">Torna alla pagina utente</button>
          </div>
        </div>
      </div>
    `,
    "showCompletedPage": true, "pages": [
      {
        "name": "page1",
        "title": "\n",
        "elements": [
          {
            "type": "radiogroup",
            "name": "question1",
            "title": "I criteri individuati mirano a limitare i principali impatti ambientali connessi alle caratteristiche fondamentali dell’attività che si sta procedendo a certificare. Per quest’area d’analisi le tematiche analizzate saranno quelle relative a:\n",
            "titleLocation": "top",
            "isRequired": true,
            "choices": [
              {
                "value": "item1",
                "text": "Indicazione del sistema di trasporto",
                "score": 10
              },
              {
                "value": "Item 2",
                "text": "Numero di mezzi da certificare",
                "score": 20
              },
              {
                "value": "Item 3",
                "text": "Utilizzo dei mezzi",
                "score": 30
              },
              {
                "value": "Item 4",
                "text": "Conferma del rispetto delle norme in riferimento alla gestione del mezzo (revisioni, assicurazioni, bolli, tagliandi)",
                "score": 40
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
                "title": "Minibus\n",
                "score": 5
              },
              {
                "name": "text2",
                "title": "Autobus\n",
                "score": 10
              },
              {
                "name": "text3",
                "title": "Autovetture",
                "score": 15
              },
              {
                "name": "text4",
                "title": "Autovetture cabrio",
                "score": 20
              },
              {
                "name": "text5",
                "title": "Scooter",
                "score": 10
              },
              {
                "name": "text6",
                "title": "Moto\n",
                "score": 5
              },
              {
                "name": "text7",
                "title": "Biciclette",
                "score": 10
              },
              {
                "name": "text8",
                "title": "Trasporto su acqua",
                "score": 25
              },
              {
                "name": "text9",
                "title": "Aerotrasporti",
                "score": 30
              }
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "vehicle_registration_year_dynamic",
            "title": "In che anno sono stati immatricolati i mezzi sopra descritti?",
            "columns": [
              {
                "name": "vehicle",
                "title": "Mezzo",
                "cellType": "text",
                "isRequired": true
              },
              {
                "name": "year",
                "title": "Anno di immatricolazione",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  "2024",
                  "2023",
                  "2022",
                  "2021",
                  "2020",
                  "Prima del 2020",
                  "Prima del 2010"
                ]
              }
            ],
            "rowCount": 1,
            "minRowCount": 1,
            "addRowText": "Aggiungi un altro mezzo",
            "removeRowText": "Rimuovi questo mezzo"
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
            "title": "Conferma il rispetto delle norme vigenti in merito alla gestione, manutenzione e assicurazione dei mezzi che sta certificando?\n",
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
            "name": "vehicle_revision_year_dynamic",
            "title": "Indichi la data dell’ultima revisione fatta ai mezzi che sta certificando",
            "isRequired": true,
            "columns": [
              {
                "name": "vehicle",
                "title": "Mezzo",
                "cellType": "text",
                "isRequired": true
              },
              {
                "name": "year",
                "title": "Anno di immatricolazione",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  "2024",
                  "2023",
                  "2022",
                  "2021",
                  "2020",
                  "Prima del 2020",
                  "Prima del 2010"
                ]
              }
            ],
            "rowCount": 1,
            "minRowCount": 1,
            "addRowText": "Aggiungi un altro mezzo",
            "removeRowText": "Rimuovi questo mezzo"
          },
          {
            "type": "matrixdynamic",
            "name": "question4",
            "title": "Indichi ove vi fosse, la presenza del bollino blu* relativamente ai mezzi che sta certificando",
            "description": "Si tratta del bollino che viene rilasciato al momento della revisione dell’autoveicolo o del motoveicolo a seguito del controllo dei dispositivi di combustione e scarico",
            "isRequired": true,
            "columns": [
              {
                "name": "vehicle",
                "title": "Mezzo",
                "cellType": "text",
                "isRequired": true
              }
            ],
            "rowCount": 1,
            "minRowCount": 1,
            "addRowText": "Aggiungi un altro mezzo",
            "removeRowText": "Rimuovi questo mezzo"
          },
          {
            "type": "panel",
            "name": "question7",
            "title": "Indichi la tipologia di alimentazione dei mezzi in esame\n",
            "visibleIf": "{question2.text1} notempty or {question2.text2} notempty or {question2.text3} notempty or {question2.text4} notempty or {question2.text5} notempty or {question2.text6} notempty or {question2.text7} notempty or {question2.text8} notempty or {question2.text9} notempty",
            "elements": [
              {
                "type": "radiogroup",
                "name": "question10",
                "title": "Autobus\n",
                "visibleIf": "{question2.text2} notempty",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "elettrico",
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
                "title": "Minibus\n",
                "visibleIf": "{question2.text1} notempty",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "elettrico",
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
                "title": "Trasporto con autovetture\n",
                "visibleIf": "{question2.text3} notempty",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "elettrico",
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
                "title": "Trasporto con scooter\n",
                "visibleIf": "{question2.text5} notempty",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "elettrico",
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
                "title": "Trasporto con biciclette\n",
                "visibleIf": "{question2.text7} notempty",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "Elettriche",
                    "score": 75
                  },
                  {
                    "value": "Item 3",
                    "text": "Tradizionali",
                    "score": 100
                  }
                ]
              },
              {
                "type": "panel",
                "name": "question15",
                "title": "Trasporto su acqua\n",
                "visibleIf": "{question2.text8} notempty",
                "elements": [
                  {
                    "type": "text",
                    "name": "question16",
                    "title": "Tipo di mezzo\n",
                    "isRequired": true
                  },
                  {
                    "type": "radiogroup",
                    "name": "question17",
                    "title": "A motore\n",
                    "isRequired": true,
                    "choices": [
                      {
                        "value": "Item 1",
                        "text": "Benzina",
                        "score": 100
                      },
                      {
                        "value": "Item 2",
                        "text": "Diesel",
                        "score": 35
                      },
                      {
                        "value": "Item 3",
                        "text": "Gas",
                        "score": 65
                      },
                      {
                        "value": "Item 4",
                        "text": "A motore elettrico",
                        "score": 80
                      },
                      {
                        "value": "Item 5",
                        "text": "A vela",
                        "score": 100
                      },
                      {
                        "value": "Item 6",
                        "text": "A remi",
                        "score": 100
                      }
                    ]
                  }
                ]
              },
              {
                "type": "panel",
                "name": "question18",
                "title": "Aerotrasporti\n",
                "visibleIf": "{question2.text9} notempty",
                "elements": [
                  {
                    "type": "text",
                    "name": "question19",
                    "title": "specifichi il tipo di alimentazione",
                    "isRequired": true
                  }
                ]
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question20",
            "title": "Nel calcolo dei percorsi nella vostra attività si fa uso di software o navigatori in modo da ottimizzare il viaggio e circolare in regime di risparmio e rispetto dell’ambiente?\n",
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
            "type": "radiogroup",
            "name": "question21",
            "title": "I mezzi che sta certificando utilizzano pneumatici con etichetta energetica in classe A con caratteristiche di elevato rotolamento?\n",
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
                "score": 65
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
            "name": "question22",
            "title": "Il personale conducente è stato formato alle tecniche di guida volte alla riduzione dei consumi? (eco-drive)?\n",
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
            "name": "question23",
            "title": "Sarebbe interessato ad un corso di mobility manager?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Si",
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
            "name": "question24",
            "title": "Sarebbe interessato ad una certificazione di 2° livello?\n",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Si",
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
            "title": "Sarebbe interessato a portare avanti un’attività di auditing energetico* per la struttura (Vs. uffici direzionali) che ha appena certificato?\n",
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
          }
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

    // Aggiungi il gestore dell'evento onComplete
    survey.onValueChanged.add(saveSurveyData);
    survey.onComplete.add(handleSurveyComplete);

    // Rimuovi i gestori degli eventi quando il componente viene smontato
    return () => {
      survey.onValueChanged.remove(saveSurveyData);
      survey.onComplete.remove(handleSurveyComplete);
    };
  }, [survey]);

  async function handleSurveyComplete() {
    await saveSurveyData(survey);
    setTotalScore(calculateTotalScore(survey.data, json));
    console.log("Answers:", survey.data);
  }


  async function submitSurveyData(data) {
    const token = localStorage.getItem('token');
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
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
    };
    submitSurveyData(data);
  }

  function calculateTotalScore(answers, surveyJson) {
    let totalScore = 0;

    surveyJson.pages.forEach(page => {
      page.elements.forEach(element => {
        switch (element.type) {
          case 'radiogroup':
            totalScore += calculateRadioGroupScore(answers[element.name], element.choices);
            break;
          case 'multipletext':
            totalScore += calculateMultipleTextScore(answers[element.name], element.items);
            break;
          case 'matrixdynamic':
            totalScore += calculateMatrixDynamicScore(answers[element.name], element.columns, element.name);
            break;
          case 'panel':
            element.elements.forEach(panelElement => {
              if (panelElement.type === 'radiogroup') {
                totalScore += calculateRadioGroupScore(answers[panelElement.name], panelElement.choices);
              }
            });
            break;
          default:
            console.warn(`Tipo di domanda non gestito: ${element.type}`);
        }
      });
    });

    return totalScore;
  }

  function calculateRadioGroupScore(answer, choices) {
    const choice = choices.find(choice => choice.value === answer);
    return choice ? choice.score || 0 : 0;
  }

  function calculateMultipleTextScore(multipleTextAnswers, items) {
    const itemScores = items.reduce((acc, item) => {
      acc[item.title.trim()] = item.score || 0;
      return acc;
    }, {});

    return Object.entries(multipleTextAnswers).reduce((score, [key, value]) => {
      return score + (itemScores[key] || 0) * parseInt(value, 10) || 0;
    }, 0);
  }

  function calculateMatrixDynamicScore(matrixDynamicAnswers, columns, matrixType) {
    console.log(matrixType);
    // Helper function to calculate scores based on year choices
    function getYearScores(yearColumn) {
      // Define scores for each year or range of years
      const yearScores = {};

      yearColumn.choices.forEach(choice => {
        switch (choice.value) {
          case '2024':
            yearScores['2024'] = 10;
            break;
          case '2023':
            yearScores['2023'] = 9;
            break;
          case '2022':
            yearScores['2022'] = 8;
            break;
          case '2021':
            yearScores['2021'] = 7;
            break;
          case '2020':
            yearScores['2020'] = 6;
            break;
          case 'Prima del 2020':
            yearScores['Prima del 2020'] = 5;
            break;
          case 'Prima del 2010':
            yearScores['Prima del 2010'] = 4;
            break;
          default:
            yearScores[choice.value] = 0; // Default score for unrecognized values
        }
      });

      return yearScores;
    }

    const mezzoScoreMap = {
      "Minibus": 5,
      "Autobus": 10,
      "Autovetture": 15,
      "Autovetture cabrio": 20,
      "Scooter": 10,
      "Moto": 5,
      "Biciclette": 10,
      "Trasporto su acqua": 25,
      "Aerotrasporti": 30
    };


    // Helper function to calculate scores based on mezzo choices
    function getMezzoScores(mezzoColumn) {
      return mezzoScoreMap
    }

    if (matrixType === 'vehicle_registration_year_dynamic' || matrixType === 'vehicle_revision_year_dynamic') {
      // Process year-based scoring
      const yearColumn = columns.find(column => column.name === 'year');
      console.log(yearColumn);
      if (!yearColumn) return 0;

      const yearScores = getYearScores(yearColumn);

      return matrixDynamicAnswers.reduce((score, row) => {
        return score + (yearScores[row.year] || 0);
      }, 0);
    } else if (matrixType === 'question4') {
      // Process mezzo-based scoring
      const mezzoColumn = columns.find(column => column.title === 'Mezzo');
      console.log("colonna mezzo", mezzoColumn);
      if (!mezzoColumn) return 0;

      // Assuming you have predefined scores for vehicles elsewhere
      const mezzoScores = getMezzoScores(mezzoColumn);

      return matrixDynamicAnswers.reduce((score, row) => {
        // row.vehicle è il valore testuale del mezzo
        const vehicle = row.vehicle.trim(); // Usa trim() per rimuovere spazi indesiderati
        console.log(score + (mezzoScores[vehicle]));
        return score + (mezzoScores[vehicle] || 0);
      }, 0);
    }

    // Return 0 if matrixType is not recognized
    return 0;
  }


  return <Survey model={survey} />;
}

export default SurveyComponent;