import React, { useState, useEffect } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import generatePDF from "../pdfGeneratorQuestionnaires";

function TransportQuestionnaire({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const [userData, setUserData] = useState({});
  const [initialData, setInitialData] = useState({}); // Stato per i dati iniziali
  const [totalScore, setTotalScore] = useState(0);
  const [CO2Emissions, setCO2Emissions] = useState(0);

  //          <p>Hai totalizzato un punteggio di: <span class="score">${totalScore}</span> punti.</p>
  const json = {
    //"title": "Certificazione trasporti",
    "completeText": "Termina",
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
          font-size: 24px;
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
        font-size: 20px;
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
        color: #2d7044; /* hover: */
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
            "type": "html",
            "name": "question28",
            "html": "<div style=\"font-family: Arial, sans-serif; font-size: 1.25rem; padding: 2rem; line-height: 1.75; background-color: #f9fafb; border-radius: 1.5rem; border: 0.1px solid #A3A3A3;\">\n  <h1 style=\"font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #2d7044;\">\n    Questionario trasporti\n  </h1>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    Regolamento per la Compilazione del Questionario\n  </h2>\n\n  <p style=\"margin-bottom: 0.25rem;\">\n    Benvenuto nel questionario sui trasporti! Ti chiediamo di leggere attentamente le seguenti istruzioni per compilare\n    correttamente tutte le sezioni. Il questionario è progettato per raccogliere informazioni più accurate possibili, quindi è\n    fondamentale seguire queste linee guida. \n    <strong style=\"font-weight: 600;\">\n      Tutte le domande sono obbligatorie (hanno un asterisco rosso \n      <span style=\"color: #f56565;\">*</span>)\n    </strong>.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    1. Compilazione Onesta e Rilevante\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Rispondi in modo sincero e accurato, fornendo informazioni che riflettano la tua situazione attuale. È obbligatorio rispondere a tutte le domande.\n    In alcune domande non è necessario selezionare tutte le voci (ad esempio, se non hai veicoli immatricolati nel 2023, non selezionare\n    2023 come anno. \n    <strong>La stessa cosa vale per tutte le altre domande che hanno menu a discesa</strong>).\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    2. Esattezza delle Risposte\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Assicurati che tutte le risposte fornite siano corrette e coerenti. Non inserire \"0\" se non possiedi veicoli immatricolati\n    in un certo anno: semplicemente non rispondere per quell'anno.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    3. Attenzione ai Dettagli\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Presta attenzione ai dettagli numerici. Se una domanda richiede un numero, assicurati di inserire il valore\n    corretto, evitando stime imprecise.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    4. Rispetto dei Tempi\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Completa il questionario con calma. Una compilazione attenta e precisa è preferibile a una rapida e incompleta.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    5. Assistenza\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Se hai dubbi o difficoltà nella compilazione, contattaci per chiarimenti. È importante comprendere bene ogni\n    domanda prima di rispondere.\n  </p>\n\n  <p style=\"margin-bottom: 0.25rem;\">Grazie per la tua collaborazione!</p>\n</div>\n"
          },
          {
            "type": "radiogroup",
            "name": "question1",
            "title": "I criteri individuati mirano a limitare i principali impatti ambientali connessi alle caratteristiche fondamentali dell’attività che si sta procedendo a certificare. Per quest’area d’analisi le tematiche analizzate saranno quelle relative a:",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Indicazione del sistema di trasporto",
                "score": 0
              },
              {
                "value": "Item 2",
                "text": "Numero di mezzi da certificare",
                "score": 0
              },
              {
                "value": "Item 3",
                "text": "Utilizzo dei mezzi",
                "score": 0
              },
              {
                "value": "Item 4",
                "text": "Conferma del rispetto delle norme in riferimento alla gestione del mezzo (revisioni, assicurazioni, bolli, tagliandi)",
                "score": 0
              }
            ]
          },
          {
            "type": "multipletext",
            "name": "question2",
            "title": "Quanti e quali tipologie di mezzi di trasporto ha la sua attività?",
            "isRequired": true,
            "items": [
              {
                "name": "text1",
                "title": "Autobus",
                "score": 0
              },
              {
                "name": "text2",
                "title": "Minibus",
                "score": 0
              },
              {
                "name": "text3",
                "title": "Autovetture",
                "score": 0
              },
              {
                "name": "text4",
                "title": "Autovetture Cabrio",
                "score": 0
              },
              {
                "name": "text5",
                "title": "Scooter",
                "score": 0
              },
              {
                "name": "text6",
                "title": "Moto",
                "score": 0
              },
              {
                "name": "text7",
                "title": "Biciclette",
                "score": 0
              },
              {
                "name": "text8",
                "title": "Trasporto su acqua",
                "score": 0
              },
              {
                "name": "text9",
                "title": "Aerotrasporti",
                "score": 0
              }
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question3",
            "title": "In che anno sono stati immatricolati i mezzi sopra descritti? Indica il numero di mezzi immatricolati per i vari anni",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Numero Mezzi",
                "cellType": "number",
                "min": 1,
                "isRequired": true,
                "minValue": 0, // Solo numeri positivi
                "validators": [
                  {
                    "type": "numeric",
                    "text": "Inserire un numero valido."
                  }
                ],
              },
              {
                "name": "Column 2",
                "title": "Anno",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  { "value": 1, "text": "2024" },
                  { "value": 2, "text": "2023" },
                  { "value": 3, "text": "2022" },
                  { "value": 4, "text": "2021" },
                  { "value": 5, "text": "2020" },
                  { "value": 6, "text": "Prima del 2020" },
                  { "value": 7, "text": "Prima del 2010" }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5,
              6,
              7
            ],
            "rowCount": 1,

          },
          {
            "type": "matrixdynamic",
            "name": "question4",
            "title": "I mezzi che sta certificando rientrano nella macro area di emissioni, denominata euro? Inidica il numero di mezzi per ogni area",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Numero mezzi",
                "cellType": "number",
                "isRequired": true,
                "minValue": 0, // Solo numeri positivi
                "validators": [
                  {
                    "type": "numeric",
                    "text": "Inserire un numero valido."
                  }
                ],
              },
              {
                "name": "Column 2",
                "title": "Euro",
                "cellType": "dropdown",
                "isRequired": true,
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
            ],
            "rowCount": 1,
          },
          {
            "type": "radiogroup",
            "name": "question5",
            "title": "I mezzi di trasporto che sta certificando quanto Km l’anno percorrono?",
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
            "title": "Indichi la data dell’ultima revisione fatta ai mezzi che sta certificando. Indica il numero di mezzi per ogni anno di revisione",
            "description": "Rimuovi le righe non necessarie",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Mumero mezzi",
                "cellType": "number",
                "isRequired": true,
                "minValue": 0, // Solo numeri positivi
                "validators": [
                  {
                    "type": "numeric",
                    "text": "Inserire un numero valido."
                  }
                ],
              },
              {
                "name": "Column 2",
                "title": "Anno",
                "cellType": "dropdown",
                "isRequired": true,
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
            ],
            "rowCount": 1,
          },
          {
            "type": "matrixdynamic",
            "name": "question9",
            "title": "Indichi ove vi fosse, la presenza del bollino blu* relativamente ai mezzi che sta certificando. indica il numero di mezzi che hanno il bollino e il numero di mezzi che non hanno il bollino",
            "description": "Si tratta del bollino che viene rilasciato al momento della revisione dell’autoveicolo o del motoveicolo a seguito del controllo dei dispositivi di combustione e scarico",
            "isRequired": true,
            "columns": [
              {
                "name": "Column 1",
                "title": "Numero mezzi",
                "cellType": "number",
                "isRequired": true,
                "minValue": 0, // Solo numeri positivi
                "validators": [
                  {
                    "type": "numeric",
                    "text": "Inserire un numero valido."
                  }
                ],
              },
              {
                "name": "Column 2",
                "title": "Bollino",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  {
                    "value": 1,
                    "text": "Si"
                  },
                  {
                    "value": 2,
                    "text": "No"
                  }
                ],
                "storeOthersAsComment": true
              },
              {
                "name": "Column 3",
                "title": "Anno",
                "cellType": "dropdown",
                "isRequired": true,
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
            ],
            "rowCount": 1,
          },
          {
            "type": "matrixdynamic",
            "name": "question10",
            "description": "Per ogni riga, inserisci il numero di veicoli corrispondente al tipo di carburante selezionato dal menu a discesa. Non è necessario selezionare tutti i carburanti: scegli solo quelli rilevanti per i mezzi che possiedi o gestisci.",
            "visibleIf": "{question2.text1} notempty or {question2.text2} notempty or {question2.text3} notempty or {question2.text4} notempty or {question2.text5} notempty or {question2.text6} notempty or {question2.text7} notempty or {question2.text8} notempty or {question2.text9} notempty",
            "title": "Indica quanti mezzi utilizzano ciascun carburante (se applicabile):",
            "requiredIf": "{question2.text1} notempty",
            "columns": [
              {
                "name": "Column 1",
                "title": "Numero mezzi",
                "cellType": "number",
                "isRequired": true,
                "minValue": 0, // Solo numeri positivi
                "validators": [
                  {
                    "type": "numeric",
                    "text": "Inserire un numero valido."
                  }
                ],
              },
              {
                "name": "Column 2",
                "title": "carburante",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  { "value": 4, "text": "Elettrico (Auto e Veicoli Motorizzati)" },
                  { "value": 10, "text": "Ibrido (Auto e Veicoli Motorizzati)" },
                  { "value": 1, "text": "Benzina (Auto e Veicoli Motorizzati)" },
                  { "value": 2, "text": "Diesel (Auto e Veicoli Motorizzati)" },
                  { "value": 3, "text": "Gas (Auto e Veicoli Motorizzati)" },
                  { "value": 7, "text": "Biciclette tradizionali" },
                  { "value": 11, "text": "Biciclette elettriche" },
                  { "value": 8, "text": "Scooter a miscela" },
                  { "value": 9, "text": "Auto servizio carpool" },
                  { "value": 12, "text": "Barche elettriche" },
                  { "value": 5, "text": "Barche a vela" },
                  { "value": 6, "text": "Barche a remi" }
                ],
                "storeOthersAsComment": true
              }
            ],
            "choices": [
              4,
              10,
              1,
              2,
              3,
              7,
              11,
              8,
              9,
              12,
              5,
              6
            ],
            "rowCount": 1
          },
          {
            "type": "panel",
            "name": "question16",
            "visibleIf": "{question2.text9} notempty ",
            "requiredIf": "{question2.text9} notempty ",
            "title": "Aerotrasporti:",
            "elements": [
              {
                "type": "text",
                "name": "question17",
                "visibleIf": "{question2.text9} notempty ",
                "title": "Specifichi il tipo di mezzo",
                "requiredIf": "{question2.text9} notempty "
              },
              {
                "type": "text",
                "name": "question18",
                "visibleIf": "{question2.text9} notempty ",
                "title": "Specifichi il tipo di alimentazione:",
                "requiredIf": "{question2.text9} notempty "
              }
            ]
          },
          {
            "type": "matrixdynamic",
            "name": "question29",
            "title": "Sulla base dei veicoli termici che utilizzi inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione del veicolo)\n",
            "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati. Non incide sul foto finale",
            "columns": [
              {
                "name": "Marca",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Mercedes"
              },
              {
                "name": "Modello",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Classe A"
              },
              {
                "name": "Anno immatricolazione",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "2024"
              },
              {
                "name": "Carburante",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  {
                    "value": "Benzina",
                    "text": "Benzina"
                  },
                  {
                    "value": "Diesel",
                    "text": "Diesel"
                  },
                  {
                    "value": "GPL",
                    "text": "GPL"
                  },
                  {
                    "value": "Metano",
                    "text": "Metano"
                  },
                  {
                    "value": "Metano (monovalente)",
                    "text": "Metano (monovalente)"
                  },
                  {
                    "value": "Ibrido",
                    "text": "Ibrido"
                  },
                  {
                    "value": "Elettrico",
                    "text": "Elettrico"
                  }
                ],
                "placeholder": "Benzina"
              },
              {
                "name": "km annui",
                "title": "KM annui",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "10000"
              },
              {
                "name": "emissioni di CO2 WLTP",
                "title": "Emissioni di CO2 WLTP (g/km) - Carburante principale",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "137"
              },
              {
                "name": "emissioni di CO2 WLTP (GPL o metano)",
                "cellType": "text",
                "visibleIf": "{row.Carburante} = 'GPL' or {row.Carburante} = 'Metano'",
                "requiredIf": "{row.Carburante} = 'GPL' or {row.Carburante} = 'Metano'",
                "placeholder": "120"
              }
            ],
            "choices": [
              1,
              2,
              3,
              4,
              5
            ],
            "cellType": "text",
            "rowCount": 1
          },
          {
            "type": "radiogroup",
            "name": "question19",
            "title": "Nel calcolo dei percorsi nella vostra attività si fa uso di software o navigatori in modo da ottimizzare il viaggio e circolare in regime di risparmio e rispetto dell’ambiente?",
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
            ]
          },
          {
            "type": "radiogroup",
            "name": "question20",
            "title": "I mezzi che sta certificando utilizzano pneumatici con etichetta energetica in classe A con caratteristiche di elevato rotolamento?",
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
            "name": "question21",
            "title": "Il personale conducente è stato formato alle tecniche di guida volte alla riduzione dei consumi? (eco-drive)?",
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
            "name": "question22",
            "title": "Sarebbe interessato ad un corso di mobility manager*?",
            "description": "Il mobility manager è la figura che consente di dare risposte di breve periodo ai problemi della congestione del traffico e delle sue conseguenze sulla salute. Opera sul governo della domanda di trasporto, lavorando in particolare sugli spostamenti e sui comportamenti delle persone. Il mobility manager aziendale ha un’importante funzione poiché pianifica all’interno dell’attività e permette di ottimizzare i costi per gli spostamenti in armonia con le politiche di mobilità sostenibile del territorio in cui l’attività opera, migliorandone difatti l’immagine complessiva ed il rapporto con gli stakeholder.",
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
            "name": "question23",
            "title": "Sarebbe interessato ad una certificazione di 2° livello?",
            "description": "ATTENZIONE: se selezioni Si manderai una richiesta di approvazione",
            "isRequired": true,
            "choices": [
              {
                "value": "Item 1",
                "text": "Si",
                "score": 0
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
            "title": "Sarebbe interessato a portare avanti un’attività di auditing energetico* per la struttura (Vs. uffici direzionali) che ha appena certificato?",
            "description": "Per auditing Energetico si intende quell’attività che si pone l’obiettivo di capire in che modo l’energia viene utilizzata, quali sono le cause degli eventuali sprechi ed eventualmente quali interventi possono essere suggeriti all’utente. La proposta all’utente si traduce in un piano energetico che valuti non solo la fattibilità tecnica ma anche e soprattutto quella economica degli interventi migliorativi proposti",
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

  /*
  {
          "type": "matrixdynamic",
          "name": "question29",
          "title": "Sulla base dei veicoli termici che utilizzi inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione del veicolo)\n",
          "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati. Non incide sul foto finale",
          "columns": [
            {
              "name": "Marca",
              "cellType": "text",
              "isRequired": true,
              "placeholder": "Mercedes"
            },
            {
              "name": "Modello",
              "cellType": "text",
              "isRequired": true,
              "placeholder": "Classe A"
            },
            {
              "name": "Anno immatricolazione",
              "cellType": "text",
              "isRequired": true,
              "placeholder": "2024"
            },
            {
              "name": "Carburante",
              "cellType": "dropdown",
              "isRequired": true,
              "choices": [
                {
                  "value": "item1",
                  "text": "Benzina"
                },
                {
                  "value": "item2",
                  "text": "Diesel"
                },
                {
                  "value": "item5",
                  "text": "GPL"
                },
                {
                  "value": "item6",
                  "text": "Metano"
                },
                {
                  "value": "item7",
                  "text": "Metano (monovalente)"
                },
                {
                  "value": "item3",
                  "text": "Ibrido"
                },
                {
                  "value": "item4",
                  "text": "Elettrico"
                }
              ],
              "placeholder": "Benzina"
            },
            {
              "name": "consumi annui",
              "title": "KM annui",
              "cellType": "text",
              "isRequired": true,
              "placeholder": "10000"
            },
            {
              "name": "emissioni di CO2 WLTP",
              "title": "Emissioni di CO2 WLTP (g/km) - Carburante principale",
              "cellType": "text",
              "isRequired": true,
              "placeholder": "137"
            },
            {
              "name": "emissioni di CO2 WLTP (GPL o metano)",
              "cellType": "text",
              "visibleIf": "{row.Carburante} = 'item6' or {row.Carburante} = 'item5'",
              "requiredIf": "{row.Carburante} = 'item6' or {row.Carburante} = 'item5'",
              "placeholder": "120"
            }
          ],
          "choices": [
            1,
            2,
            3,
            4,
            5
          ],
          "cellType": "text",
          "rowCount": 1
        }
  */

  const survey = new Model(json);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/user-info`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.status === 200) {
          setUserInfo(response.data.id);
          setUserData(response.data);
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
    //console.log("Restoring survey data for survey ID:", surveyId);
    const token = localStorage.getItem('token');
    //console.log("certification_id:", certification_id);
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses-fetch`, {
        headers: { "Authorization": `Bearer ${token}` },
        params: {
          certification_id: certification_id
        }
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

    survey.addNavigationItem({
      id: "pdf-export",
      title: "Salva come PDF",
      action: () => {
        const updatedData = survey.data;  // Recupera i dati aggiornati
        let totalScore = calcolaPunteggio(survey.data);
        generatePDF(updatedData, "Questionario Trasporti", userData, totalScore, json)();  // Genera il PDF con i dati aggiornati
      },
    });

    // Cleanup
    return () => {
      survey.onValueChanged.remove(saveSurveyData);
      survey.onComplete.remove(handleSurveyComplete);
    };
  }, [survey]);



  function handleSurveyComplete() {
    let results = calcolaPunteggio(survey.data);
    saveSurveyDataComplete(survey, results.punteggioTotale, results.CO2emissions);
    //scroll to top of page
    window.scrollTo(0, 0);

    //console.log("Answers:", survey.data);
  }


  async function submitSurveyData(data) {
    const token = localStorage.getItem('token');
    //console.log("Submitting survey data:", data);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses`, data, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      //console.log("Survey data saved successfully");
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
      completed: false
    };
    submitSurveyData(data);
  }

  function saveSurveyDataComplete(survey, totalScore, CO2emissions) {
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
      CO2emissions,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: true
    };
    submitSurveyData(data);
  }

  const secondLevelCertification = async (userInfo, certification_id) => {

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/second-level-certification`, { userInfo, certification_id }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      //console.log("Second Level Certification completed successfully");
    } catch (error) {
      console.error("Error completing Second Level Certification:", error);
    }
  }

  // Funzione per calcolare il punteggio totale
  function calcolaPunteggio(formData) {
    let punteggioTotale = 0;
    let CO2emissions = 0

    // Itera attraverso le pagine
    json.pages.forEach(page => {
      page.elements.forEach(element => {
        // Controlla il tipo di elemento e calcola il punteggio
        //console.log(`Elemento: ${element.name}, tipo: ${element.type}`);
        switch (element.type) {
          case 'radiogroup':
            const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
            punteggioTotale += punteggioRadiogroup;
            //console.log(`Domanda: ${element.title}, Risposta: ${formData[element.name]}, Punteggio: ${punteggioRadiogroup}`);
            break;
          case 'multipletext':
            const punteggioMultipletext = calcolaPunteggioMultipletext(formData[element.name], element);
            punteggioTotale += punteggioMultipletext;
            //console.log(`Domanda: ${element.title}, Risposte: ${JSON.stringify(formData[element.name])}, Punteggio: ${punteggioMultipletext}`);
            break;
          case 'matrixdynamic':
            if (element.name === 'question29') {
              CO2emissions = CO2EmissionsCalculator(formData[element.name], element);
            } else {
              const punteggioMatrixdynamic = calcolaPunteggioMatrixdynamic(formData[element.name], element);
              punteggioTotale += punteggioMatrixdynamic;
              //console.log(`Domanda: ${element.title}, Risposte: ${JSON.stringify(formData[element.name])}, Punteggio: ${punteggioMatrixdynamic}`);
            }
            break;
          case 'panel':
            //console.log('Dati passati alla funzione calcolaPunteggioPanel:', formData[element.name], element);

            const punteggioPanel = calcolaPunteggioPanel(formData[element.name], element);
            punteggioTotale += punteggioPanel;
            //console.log(`Pannello: ${element.title}, Punteggio: ${punteggioPanel}`);
            break;
          case 'html':
            break;
          default:
            console.warn(`Tipo di domanda non gestito: ${element.type}`);
        }
      });
    });

    //console.log(`Punteggio totale: ${punteggioTotale}`);

    const punteggioMassimo = 1115; //punteggio massimo possibile
    return {
      CO2emissions, punteggioTotale: Math.round((punteggioTotale / punteggioMassimo) * 100)
    };
  }

  function CO2EmissionsCalculator(responses) {
    let currentCO2Emissions = 0; //espresso in grammi
    let totalCO2Emissions = 0; //espresso in grammi

    if (responses === undefined) {
      return;
    }

    responses.forEach(row => {
      currentCO2Emissions = 0;
      //console.log(`Marca: ${row["Marca"]}, Modello: ${row["Modello"]}, Anno: ${row["Anno immatricolazione"]}, Carburante: ${row["Carburante"]}, km annui: ${row["km annui"]}, emissioni: ${row["emissioni di CO2 WLTP"]}, emissioni GPl o metano: : ${row["emissioni di CO2 WLTP (GPL o metano)"]}`);
      if (row["Carburante"] === "GPL" || row["Carburante"] === "Metano") {
        currentCO2Emissions = parseInt(row["km annui"]) * ((parseInt(row["emissioni di CO2 WLTP"]) + parseInt(row["emissioni di CO2 WLTP (GPL o metano)"])) / 2); //Media tra le emissioni di due carburanti
        //console.log(currentCO2Emissions)
        totalCO2Emissions += currentCO2Emissions;
      } else {
        currentCO2Emissions = parseInt(row["km annui"]) * parseInt(row["emissioni di CO2 WLTP"]);
        //console.log(currentCO2Emissions)
        totalCO2Emissions += currentCO2Emissions;
      }
    }
    );
    //console.log("total co2 emisisons in tons", totalCO2Emissions / 1000000);
    return totalCO2Emissions / 1000000;
  }

  // Funzione per calcolare il punteggio per le domande di tipo radiogroup
  function calcolaPunteggioRadiogroup(response, element) {

    ////console.log(`parametri radiogroup:`, response, element);
    let punteggio = 0;
    if (response && element.choices) {
      const scelta = element.choices.find(choice => choice.value === response);
      if (scelta) {
        punteggio = scelta.score || 0;
        if (element.name === 'question23' && scelta.text === 'Si') {
          //console.log("Sei interessato ad una certificazione di secondo livello");
          secondLevelCertification(userInfo, certification_id);
          //console.log("UserInfo:", userInfo, "CertificationId:", certification_id);
        } else if (element.name === 'question23' && scelta.text === 'No') {
          //console.log("Non sei interessato ad una certificazione di secondo livello");
        }
      }
    }
    return punteggio;
  }


  // Funzione per calcolare il punteggio per le domande di tipo multipletext
  function calcolaPunteggioMultipletext(response, element) {
    let punteggio = 0;
    element.items.forEach(item => {
      //console.log(`Item: ${item.name}, Risposta: ${response[item.name]}`);
      if (response[item.name]) {
        punteggio += item.score || 0;
        ////console.log(`Punteggio multiple text: ${punteggio}`);
      }
    });
    return punteggio;
  }


  const yearScores = {
    1: 100, // 2024
    2: 95,  // 2023
    3: 90,  // 2022
    4: 85,  // 2021
    5: 80,  // 2020
    6: 50,  // prima 2020
    7: 25   // prima 2010
  };

  const euroScores = {
    1: 100, // euro 6
    2: 75,  // euro 5
    3: 50,  // euro 4 
    4: 0,   // euro 3
    5: 0    // euro 2
  };

  const fuelScores = {
    1: 65,  // benzina
    2: 35,  // diesel
    3: 75,  // gas
    4: 100, // elettrico
    5: 100, // vela
    6: 100, // remi
    7: 100, // tradizionale (per biciclette)
    8: 5,   // miscela (per scooter e moto)
    9: 85,  // servizio carpool
    10: 80, // ibrido
    11: 75, // elettrico biciclette
    12: 85  // elettrico barca
  };

  const penalitaPerAnno = {
    1: 0,   // 2024
    2: 5,   // 2023
    3: 10,  // 2022
    4: 15,  // 2021
    5: 20,  // 2020
    6: 30,  // prima 2020
    7: 50   // molto vecchi (prima 2010)
  };

  const penalitaPerEuro = {
    1: 0,   // euro 6
    2: 10,  // euro 5
    3: 20,  // euro 4
    4: 30,  // euro 3
    5: 40   // euro 2
  };

  const penalitaPerCarburante = {
    1: 15,  // benzina
    2: 30,  // diesel
    3: 10,  // gas
    4: 0,   // elettrico
    5: 0,   // vela (nessuna penalità)
    6: 0,   // remi (nessuna penalità)
    7: 0,   // tradizionale (nessuna penalità)
    8: 20,  // miscela (aumentata per essere più significativa)
    9: 10,  // servizio carpool
    10: 5,  // ibrido
    11: 5,  // elettrico biciclette
    12: 85  // elettrico barca
  };



  // Funzione per calcolare il punteggio per le domande di tipo matrixdynamic
  function calcolaPunteggioMatrixdynamic(responses, element) {
    let punteggioTotale = 0;
    let mezziTotali = 0;
    let mean = 0;

    // Funzione per calcolare il punteggio in base all'anno
    const calcolaPunteggioAnno = (response) => {
      const penalitaAnno = penalitaPerAnno[response["Column 2"]] || 0;
      const punteggio = (yearScores[response["Column 2"]] - penalitaAnno) * parseInt(response["Column 1"]) || 0; //calcolo punteggio per ogni riga = numero mezzi * punteggio anno
      mezziTotali += parseInt(response["Column 1"]);
      return punteggio;
    };

    // Funzione per calcolare il punteggio in base all'Euro
    const calcolaPunteggioEuro = (response) => {
      const penalitaEuro = penalitaPerEuro[response["Column 2"]] || 0;
      const punteggio = (euroScores[response["Column 2"]] - penalitaEuro) * parseInt(response["Column 1"]) || 0; //calcolo punteggio per ogni riga = numero mezzi * punteggio Euro
      mezziTotali += parseInt(response["Column 1"]);
      return punteggio;
    };

    // Funzione per calcolare il punteggio in base al carburante
    const calcolaPunteggioCarburante = (response) => {
      //console.log(`Column 2: ${response["Column 2"]}`);
      //console.log(`carburante: ${fuelScores[response["Column 2"]]}`);
      const penalitaCarburante = penalitaPerCarburante[response["Column 2"]] || 0;
      const punteggio = ((fuelScores[response["Column 2"]] - penalitaCarburante) * parseInt(response["Column 1"])) || 0; //calcolo punteggio per ogni riga = numero mezzi * punteggio Euro
      //console.log(`punteggio con penalita: ${punteggio}`);
      mezziTotali += parseInt(response["Column 1"]);
      return punteggio;
    };

    if (responses === undefined) {
      return punteggioTotale;
    }

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
        if (row["Column 2"] === 1) { // 1 = si
          //console.log("Column2 bollino valore", row["Column 2"]);
          // Se la risposta è "Si", calcola il punteggio basato sull'anno
          mezziTotali += parseInt(row["Column 1"]);
          const punteggioAnno = yearScores[row["Column 3"]] * parseInt(row["Column 1"]) || 0;
          punteggioTotale += punteggioAnno;
          //console.log(`Domanda: ${element.name}, Risposta: Si, Anno: ${row["Column 3"]}, Punteggio: ${punteggioAnno}`);
        } else if (row["Column 2"] === 0) {
          // Se la risposta è "No", il punteggio è 0
          mezziTotali += parseInt(row["Column 1"]);
          punteggioTotale += 0;
          //console.log(`Domanda: ${element.name}, Risposta: No, Punteggio: 0`);
        }
      } else if (element.name === 'question15' || element.name === 'question14' || element.name === 'question13' || element.name === 'question12' || element.name === 'question11' || element.name === 'question10') {
        const punteggioCarburante = calcolaPunteggioCarburante(row);
        punteggioTotale += punteggioCarburante;
      }

    });



    mean = Math.round(punteggioTotale / mezziTotali);
    if (isNaN(mean)) {
      mean = 0;
    }
    //console.log("punteggio totale", punteggioTotale);
    //console.log("media punteggio", mean);
    return mean;
  }

  // Funzione per calcolare il punteggio per i pannelli
  function calcolaPunteggioPanel(formData, panel) {
    let punteggio = 0;

    //console.log(`parametri pannello:`, formData, panel);

    if (formData && panel.elements) {
      panel.elements.forEach(element => {
        if (element.type === 'radiogroup') {
          const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
          punteggio += punteggioRadiogroup;
          //console.log(`Domanda nel pannello: ${element.name}, Risposta: ${formData[element.name]}, Punteggio: ${punteggioRadiogroup}`);
        } else if (element.type === 'text') {
          // Puoi aggiungere logica specifica per i campi di testo se necessario
        }
      });
    }

    return punteggio;
  }



  return (
    <div className="overflow-hidden">
      <Survey model={survey} />
    </div>
  );
}

export default TransportQuestionnaire;