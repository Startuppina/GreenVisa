import React, { useState, useEffect } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import generatePDF from "../pdfGeneratorQuestionnaires";
import { set } from "jodit/esm/core/helpers";

function TransportQuestionnaire({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const [userData, setUserData] = useState({});
  const [initialData, setInitialData] = useState({}); // Stato per i dati iniziali
  const [completedData, setCompletedData] = useState(null); // Stato per i dati completati

  //          <p>Hai totalizzato un punteggio di: <span class="score">${totalScore}</span> punti.</p>
  const json = {
    //"title": "Certificazione trasporti",
    "completeText": "Termina",
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "html",
            "name": "question28",
            "html": "<div style=\"font-family: Arial, sans-serif; font-size: 1.25rem; padding: 2rem; line-height: 1.75; background-color: #f9fafb; border-radius: 1.5rem; border: 0.1px solid #A3A3A3;\">\n  <h1 style=\"font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #2d7044;\">\n    Questionario trasporti\n  </h1>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    Regolamento per la Compilazione del Questionario\n  </h2>\n\n  <p style=\"margin-bottom: 0.25rem;\">\n    Benvenuto nel questionario sui trasporti! Ti chiediamo di leggere attentamente le seguenti istruzioni per compilare\n    correttamente tutte le sezioni. Il questionario è progettato per raccogliere informazioni più accurate possibili per <strong>calcolare le emissioni di CO2 e il voto di sostenibilità</strong>, quindi è\n    fondamentale seguire queste linee guida. \n    <strong style=\"font-weight: 600;\">\n      Tutte le domande sono obbligatorie (hanno un asterisco rosso \n      <span style=\"color: #f56565;\">*</span>)\n    </strong>.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    1. Guida alla compilazione\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Rispondi in modo sincero e accurato, fornendo informazioni che riflettano la tua situazione attuale. È obbligatorio rispondere a tutte le domande prima di completare il questionario. È però possibile interrompere il questionario e riprenderlo da dove si ha interrotto in quanto il sistema è dotato di <strong>AUTOSALVATAGGIO</strong>.\n    In alcune domande non è necessario selezionare tutte le voci (ad esempio, se non hai veicoli immatricolati nel 2023, non selezionare\n    2023 come anno. \n    <strong>La stessa cosa vale per tutte le altre domande che hanno menu a discesa</strong>). <strong style='color: red'>Al completamento del questionario, ogni volta che modifichi una risposta, premi il tasto TERMINA per aggiornare il risultato altrimenti i risultati non sarebbero coerenti con i dati inseriti</strong>.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    2. Esattezza delle Risposte\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Assicurati che tutte le risposte fornite siano corrette e coerenti. Non inserire \"0\" se non possiedi veicoli immatricolati\n    in un certo anno: semplicemente non rispondere per quell'anno.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    3. Attenzione ai Dettagli\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Presta attenzione ai dettagli numerici. Se una domanda richiede un numero, assicurati di inserire il valore\n    corretto.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    4. Rispetto dei Tempi\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Completa il questionario con calma. Una compilazione attenta e precisa è preferibile a una rapida e incompleta.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    5. Assistenza\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Se hai dubbi o difficoltà nella compilazione, contattaci per chiarimenti. È importante comprendere bene ogni\n    domanda prima di rispondere.\n  </p>\n\n  <p style=\"margin-bottom: 0.25rem;\">Grazie per la tua collaborazione!</p>\n</div>\n"
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
            "title": "Sulla base dei veicoli termici su gomma adibiti al trasporto di persone che utilizzi, inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione nel punto V.7)\n",
            "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati e fornire il voto complessivo al questionario.",
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
                    "value": "Mild hybrid",
                    "text": "Mild hybrid"
                  },
                  {
                    "value": "Full hybrid",
                    "text": "Full hybrid"
                  },
                  {
                    "value": "Plug-in hybrid",
                    "text": "Plug-in hybrid"
                  },
                  {
                    "value": "Elettrico",
                    "text": "Elettrico"
                  }
                ],
                "placeholder": "Benzina"
              },
              {
                "name": "KM annui",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "10000"
              },
              {
                "name": "Il veicolo viaggia",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  {
                    "value": 1,
                    "text": "Per 2/3 del tempo con una sola persona a bordo"
                  },
                  {
                    "value": 2,
                    "text": "Per il 50% con una persona a bordo"
                  },
                  {
                    "value": 3,
                    "text": "Per oltre 2/3 del tempo con almeno 2 persone a bordo"
                  },
                  {
                    "value": 4,
                    "text": "Per oltre il 50% con almeno 2 persone a bordo"
                  },
                  {
                    "value": 5,
                    "text": "Per oltre 2/3 del tempo con almeno 3 o più persone a bordo"
                  },
                  {
                    "value": 6,
                    "text": "Per oltre il 50% con almeno 3 persone a bordo"
                  }
                ],
                "placeholder": "2/3 del tempo con una sola persona a bordo"
              },
              {
                "name": "emissioni di CO2 WLTP",
                "title": "emissioni di CO2 WLTP",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "137",
              },
              {
                "name": "emissioni di CO2 WLTP (GPL o metano)",
                "title": "emissioni di CO2 WLTP (GPL o metano)",
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
            "type": "matrixdynamic",
            "name": "question30",
            "title": "Sulla base dei veicoli termici su gomma adibiti al trasporto di merci che utilizzi, inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione del veicolo nel punto V.7)\n",
            "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati e fornire il voto complessivo al questionario.",
            "columns": [
              {
                "name": "Marca",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Iveco"
              },
              {
                "name": "Modello",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Daily"
              },
              {
                "name": "Anno immatricolazione",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "2014"
              },
              {
                "name": "Peso-veicolo",
                "cellType": "dropdown",
                "placeholder": "Sotto 3.5 tonnellate",
                "choices": [
                  {
                    "value": "leggero",
                    "text": "Sotto 3.5 tonnellate"
                  },
                  {
                    "value": "pesante",
                    "text": "Uguale o maggiore di 3.5 tonnellate"
                  }
                ],
                "storeOthersAsComment": true
              },
              {
                "name": "Carburante",
                "title": "Carburante",
                "cellType": "dropdown",
                "choices": []
              },
              {
                "name": "KM annui",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "10000"
              },
              {
                "name": "Il veicolo viaggia",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  {
                    "value": 1,
                    "text": "Meno del 10% dei km con basso carico (<50%)"
                  },
                  {
                    "value": 2,
                    "text": "10-30% dei km con basso carico (<50%)"
                  },
                  {
                    "value": 3,
                    "text": "30-50% dei km con carico medio (50-80%)"
                  },
                  {
                    "value": 4,
                    "text": "50-60% dei km con carico medio-alto (50-80%)"
                  },
                  {
                    "value": 5,
                    "text": "60-80% dei km con alto carico (>80%)"
                  },
                  {
                    "value": 6,
                    "text": "Almeno l’80% dei km con alto carico (>80%)"
                  }
                ],
                "placeholder": "Meno del 10% dei km con basso carico (<50%)"
              },
              {
                "name": "emissioni di CO2 WLTP",
                "title": "emissioni di CO2 WLTP",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "200"
              },
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
            "title": "Sarebbe interessato ad una certificazione di 2° livello? (ATTENZIONE: se selezioni Si manderai una richiesta di approvazione)",
            "description": "La certificazione di 2° livello è comprensiva di attività di auditing energetico* per la struttura (Vs. uffici direzionali) che ha appena certificato che pone l’obiettivo di capire in che modo l’energia viene utilizzata, quali sono le cause degli eventuali sprechi ed eventualmente quali interventi possono essere suggeriti all’utente. La proposta all’utente si traduce in un piano energetico che valuti non solo la fattibilità tecnica ma anche e soprattutto quella economica degli interventi migliorativi proposti.",
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
        ]
      }
    ]
  }

  /*
   {
            "type": "matrixdynamic",
            "name": "question29",
            "title": "Sulla base dei veicoli termici che utilizzi inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione del veicolo)\n",
            "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati e fornire il voto complessivo al questionario.",
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
                    "value": "item3",
                    "text": "GPL"
                  },
                  {
                    "value": "item4",
                    "text": "Metano"
                  },
                  {
                    "value": "item5",
                    "text": "Metano (monovalente)"
                  },
                  {
                    "value": "item6",
                    "text": "Mild hybrid"
                  },
                  {
                    "value": "item7",
                    "text": "Full hybrid "
                  },
                  {
                    "value": "item8",
                    "text": "Plug-in hybrid"
                  },
                  {
                    "value": "item9",
                    "text": "Elettrico"
                  }
                ],
                "placeholder": "Benzina"
              },
              {
                "name": "KM annui",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "10000"
              },
              {
                "name": "Il veicolo viaggia",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  "2/3 del tempo con una sola persona a bordo",
                  "Per il 50% con una persona a bordo",
                  "Per oltre 2/3 del tempo con almeno 2 persone a bordo",
                  "Per oltre il 50% con almeno 2 persone a bordo",
                  "Per oltre 2/3 del tempo con almeno 3 o più persone a bordo",
                  "Per oltre il 50% con almeno 3 persone a bordo"
                ],
                "placeholder": "2/3 del tempo con una sola persona a bordo"
              },
              {
                "name": "emissioni di CO2 WLTP",
                "title": "emissioni di CO2 WLTP - (alimentazione principale)",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "137"
              },
              {
                "name": "emissioni di CO3 WLTP (GPL o metano)",
                "title": "emissioni di CO2 WLTP (GPL o metano)",
                "cellType": "text",
                "visibleIf": "{row.Carburante} = 'item3' or {row.Carburante} = 'item4'",
                "requiredIf": "{row.Carburante} = 'item3' or {row.Carburante} = 'item4'",
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
            "type": "matrixdynamic",
            "name": "question30",
            "title": "Sulla base dei veicoli termici adibiti al trasporto di merci che utilizzi, inserisci i dati specificati sotto, in particolare i chilometri percorsi in un anno e le emissioni di CO2 considerando l'omologazione WLTP (visibile sulla carta di circolazione del veicolo nel terzo riquadro)\n",
            "description": "Domanda utile per calcolare le emissioni di CO2 dai veicoli utilizzati e fornire il voto complessivo al questionario.",
            "columns": [
              {
                "name": "Marca",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Iveco"
              },
              {
                "name": "Modello",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "Daily"
              },
              {
                "name": "Anno immatricolazione",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "2014"
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
                    "value": "Mild hybrid",
                    "text": "Mild hybrid"
                  },
                  {
                    "value": "Full hybrid",
                    "text": "Full hybrid"
                  },
                  {
                    "value": "Plug-in hybrid",
                    "text": "Plug-in hybrid"
                  },
                  {
                    "value": "Elettrico",
                    "text": "Elettrico"
                  }
                ],
                "placeholder": "Benzina"
              },
              {
                "name": "KM annui",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "10000"
              },
              {
                "name": "Il veicolo viaggia",
                "cellType": "dropdown",
                "isRequired": true,
                "choices": [
                  {
                    "value": 1,
                    "text": "Meno del 10% dei km con basso carico (<50%)"
                  },
                  {
                    "value": 2,
                    "text": "10-30% dei km con basso carico (<50%)"
                  },
                  {
                    "value": 3,
                    "text": "30-50% dei km con carico medio (50-80%)"
                  },
                  {
                    "value": 4,
                    "text": "50-60% dei km con carico medio-alto (50-80%)"
                  },
                  {
                    "value": 5,
                    "text": "60-80% dei km con alto carico (>80%)"
                  },
                  {
                    "value": 6,
                    "text": "Almeno l’80% dei km con alto carico (>80%)"
                  }
                ],
                "placeholder": "Meno del 10% dei km con basso carico (<50%)"
              },
              {
                "name": "emissioni di CO2 WLTP",
                "title": "emissioni di CO2 WLTP",
                "cellType": "text",
                "isRequired": true,
                "placeholder": "190",
              },
              {
                "name": "emissioni di CO2 WLTP (GPL o metano)",
                "title": "emissioni di CO2 WLTP (GPL o metano)",
                "cellType": "text",
                "visibleIf": "{row.Carburante} = 'GPL' or {row.Carburante} = 'Metano'",
                "requiredIf": "{row.Carburante} = 'GPL' or {row.Carburante} = 'Metano'",
                "placeholder": "150"
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
  */

  const survey = new Model(json);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/user-info`, {
          withCredentials: true,
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

    //console.log("certification_id:", certification_id);
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses-fetch`, {
        withCredentials: true,
        params: {
          certification_id: certification_id
        }
      });


      if (response.data) {
        const surveyData = typeof response.data.survey_data === 'string'
          ? JSON.parse(response.data.survey_data)
          : response.data.survey_data;

        setInitialData({ surveyData, pageNo: response.data.pageNo, completed: response.data.completed, previousCO2emissions: response.data.co2emissions, previousScore: response.data.total_score });
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


    // Logica per aggiornare dinamicamente il dropdown "Carburante" nella domanda 30
    // solo la domanda 30 sfruttera la logica perche e' l'unica che ha la colonna "Peso-veicolo" e "Carburante"
    survey.onMatrixCellValueChanged.add((sender, options) => {
      // Controlla se il valore modificato appartiene alla colonna "Peso-veicolo"
      if (options.columnName === "Peso-veicolo") {
        const selectedCategory = options.value; // Valore selezionato nella colonna "Categoria"

        // Definisce le opzioni disponibili per il dropdown "Carburante"
        const vehicleChoices = {
          leggero: [
            { value: 1, text: "Elettrico" },
            { value: 2, text: "Ibrido plug-in (PHEV)" },
            { value: 3, text: "Gas naturale compresso (CNG)" },
            { value: 4, text: "Diesel Euro VI o superiori" },
            { value: 5, text: "Biodiesel/Biogas" }
          ],
          pesante: [
            { value: 6, text: "Elettrico" },
            { value: 7, text: "Idrogeno (Fuel Cell)" },
            { value: 8, text: "Gas naturale liquefatto (LNG)" },
            { value: 9, text: "Diesel Euro VI o superiori" },
            { value: 10, text: "Diesel Euro V o precedenti" },
            { value: 11, text: "Biodiesel/Biogas" }
          ]
        };

        // Accede alla riga corrente della matrice dinamica e alla domanda "Carburante"
        const carburanteQuestion = options.row.getQuestionByName("Carburante");

        // Aggiorna dinamicamente le opzioni del dropdown "Carburante" in base al peso del veicolo selezionata
        carburanteQuestion.choices = vehicleChoices[selectedCategory] || [];

        // Resetta il valore della cella "Carburane" per evitare incoerenze
        options.row.setValue("Carburante", null);
      }
    });


    survey.onComplete.add(handleSurveyComplete);

    //bottone che renderizza in pdf le risposte del questionario
    survey.addNavigationItem({
      id: "pdf-export",
      title: "Salva come PDF",
      action: () => {
        const updatedData = survey.data;  // Recupera i dati aggiornati
        let resultsData = calcolaRisultati(survey.data);
        generatePDF(updatedData, "Questionario Trasporti", userData, resultsData.punteggioTotale, json)();  // Genera il PDF con i dati aggiornati
      },
    });

    // Cleanup
    return () => {
      survey.onValueChanged.remove(saveSurveyData); // Rimuovi l'evento quando il componente viene dismontato
      survey.onComplete.remove(handleSurveyComplete);
    };
  }, [survey]);



  function handleSurveyComplete() {
    let results = calcolaRisultati(survey.data);
    setCompletedData({
      totalScore: results.punteggioTotale,
      emissions: results.CO2emissions.toFixed(2),
    });
    saveSurveyDataComplete(survey, results.punteggioTotale, results.CO2emissions);
    //scroll to top of page
    window.scrollTo(0, 0);

    //console.log("Answers:", survey.data);
  }


  async function submitSurveyData(data) {

    //console.log("Submitting survey data:", data);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses`, data, {
        withCredentials: true,
      });
      //console.log("Survey data saved successfully");
    } catch (error) {
      console.error("Error saving survey data:", error);
    }
  }

  function saveSurveyData(survey) { //Utilizzato per salvare le risposte del questionario ad ogni risposta data o modificata
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore: initialData.completed ? initialData.previousScore : 0,
      CO2emissions: initialData.completed ? initialData.previousCO2emissions : 0,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: initialData.completed ? true : false
    };
    submitSurveyData(data);
  }

  function saveSurveyDataComplete(survey, totalScore, CO2emissions) { //Utilizzato per salvare le risposte del questionario quando il questionario viene completato
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


    try {
      await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/second-level-certification`, { userInfo, certification_id }, {
        withCredentials: true,
      });
      //console.log("Second Level Certification completed successfully");
    } catch (error) {
      console.error("Error completing Second Level Certification:", error);
    }
  }

  // Funzione per calcolare il punteggio totale
  function calcolaRisultati(formData) {
    let punteggioTotale = 0;
    let results = 0;
    let totalCO2Emissions = 0;
    let totalScore = 0;

    // Itera attraverso le pagine
    json.pages.forEach(page => {
      page.elements.forEach(element => {
        // Controlla il tipo di elemento e calcola il punteggio
        //console.log(`Elemento: ${ element.name }, tipo: ${ element.type } `);
        switch (element.type) {
          case 'radiogroup':
            //const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
            //punteggioTotale += punteggioRadiogroup;
            //console.log(`Domanda: ${ element.title }, Risposta: ${ formData[element.name] }, Punteggio: ${ punteggioRadiogroup } `);
            break;
          case 'multipletext':
            //const punteggioMultipletext = calcolaPunteggioMultipletext(formData[element.name], element);
            //punteggioTotale += punteggioMultipletext;
            //console.log(`Domanda: ${ element.title }, Risposte: ${ JSON.stringify(formData[element.name]) }, Punteggio: ${ punteggioMultipletext } `);
            break;
          case 'matrixdynamic':
            if (element.name === 'question29' || element.name === 'question30') {
              results = CO2EmissionsCalculator(formData[element.name], element, element.name);
              totalCO2Emissions += results.CO2emissions;
              totalScore += results.vehiclesScore;
            } else {
              //const punteggioMatrixdynamic = calcolaPunteggioMatrixdynamic(formData[element.name], element);
              //punteggioTotale += punteggioMatrixdynamic;
              //console.log(`Domanda: ${ element.title }, Risposte: ${ JSON.stringify(formData[element.name]) }, Punteggio: ${ punteggioMatrixdynamic } `);
            }
            break;
          case 'panel':
            //console.log('Dati passati alla funzione calcolaPunteggioPanel:', formData[element.name], element);
            //const punteggioPanel = calcolaPunteggioPanel(formData[element.name], element);
            //punteggioTotale += punteggioPanel;
            //console.log(`Pannello: ${ element.title }, Punteggio: ${ punteggioPanel } `);
            break;
          case 'html':
            break;
          default:
            console.warn(`Tipo di domanda non gestito: ${element.type} `);
        }
      });
    });

    //console.log(`Punteggio totale: ${ punteggioTotale } `);

    //const punteggioMassimo = 1115; //punteggio massimo possibile

    console.log("punteggio", totalScore / 2);
    console.log("CO2Emissions", totalCO2Emissions);

    return {
      CO2emissions: totalCO2Emissions, punteggioTotale: totalScore / 2
    };
  }

  function CO2EmissionsCalculator(responses, question) {

    console.log('questionName', question.name);
    let currentCO2Emissions = 0; //espresso in grammi
    let totalCO2Emissions = 0; //espresso in grammi
    let currentVehicleScore = 0;
    let totalVehiclesScore = 0;
    let totalVehicles = 0;

    const emissionClassesPeopleTransport = [
      { class: "A", minEmissions: 0, maxEmissions: 0, maxScore: 100 },
      { class: "B", minEmissions: 1, maxEmissions: 50, maxScore: 90 },
      { class: "C", minEmissions: 51, maxEmissions: 80, maxScore: 80 },
      { class: "D", minEmissions: 81, maxEmissions: 100, maxScore: 70 },
      { class: "E", minEmissions: 101, maxEmissions: 130, maxScore: 60 },
      { class: "F", minEmissions: 131, maxEmissions: 160, maxScore: 50 },
      { class: "G", minEmissions: 161, maxEmissions: 200, maxScore: 40 },
      { class: "H", minEmissions: 201, maxEmissions: 250, maxScore: 30 },
      { class: "I", minEmissions: 251, maxEmissions: 300, maxScore: 20 },
      { class: "J", minEmissions: 301, maxEmissions: Infinity, maxScore: 10 }
    ];

    const emissionClassesFreightTransport = [ //Trasporto merci
      { class: "A", minEmissions: 0, maxEmissions: 0, maxScore: 100 },      // veicoli elettrici - idrogeno
      { class: "B", minEmissions: 1, maxEmissions: 50, maxScore: 90 },      // Classe aggiuntiva per semplicita di implementazione (molto probabilmente non verra usato)
      { class: "C", minEmissions: 50, maxEmissions: 100, maxScore: 80 },    // ibridi plug-in (sicuramente furgoni)
      { class: "D", minEmissions: 101, maxEmissions: 150, maxScore: 70 },   // furgoni con biocarbruanti o biogas 
      { class: "E", minEmissions: 151, maxEmissions: 200, maxScore: 60 },   // furgoni diesel euro VI o alcuni camion con biogas
      { class: "F", minEmissions: 201, maxEmissions: 250, maxScore: 50 },   // Camion a gas naturale liquefatto, alcuni camion con biogas oppure alcuni furgoni molto inquinanti
      { class: "G", minEmissions: 251, maxEmissions: 300, maxScore: 40 },   // Camion diesel euro VI 
      { class: "H", minEmissions: 301, maxEmissions: 400, maxScore: 30 },   // Camion diesel euro VI o precedenti
      { class: "I", minEmissions: 401, maxEmissions: 500, maxScore: 20 },   //  Classe aggiuntiva per semplicita di implementazione (molto probabilmente non verra usato)
      { class: "J", minEmissions: 501, maxEmissions: Infinity, maxScore: 10 },   //  Classe aggiuntiva per semplicita di implementazione (molto probabilmente non verra usato)
    ];

    const penalities = {
      1: 9, //2/3 del tempo con una sola persona a bordo - Meno del 10% dei km con basso carico (<50%)
      2: 8, //Per il 50% con una persona a bordo - 10-30% dei km con basso carico (<50%)
      3: 5, //Per oltre 2/3 del tempo con almeno 2 persone a bordo - 30-50% dei km con carico medio (50-80%) 
      4: 4, //Per oltre il 50% con almeno 2 persone a bordo - 50-60% dei km con carico medio-alto (50-80%)
      5: 2, //Per oltre 2/3 del tempo con almeno 3 o più persone a bordo - 60-80% dei km con alto carico (>80%)
      6: 0 //Per oltre il 50% con almeno 3 persone a bordo - Almeno l’80% dei km con alto carico (>80%)
    };

    responses.forEach(row => {
      currentCO2Emissions = 0;
      totalVehicles++;
      let averageCO2Emissions = 0 // Solo se GPL o metano

      //console.log(`Marca: ${ row["Marca"] }, Modello: ${ row["Modello"] }, Anno: ${ row["Anno immatricolazione"] }, Carburante: ${ row["Carburante"] }, km annui: ${ row["km annui"] }, emissioni: ${ row["emissioni di CO2 WLTP"] }, emissioni GPl o metano: : ${ row["emissioni di CO2 WLTP (GPL o metano)"] } `);
      if (row["Carburante"] === "GPL" || row["Carburante"] === "Metano") {
        currentCO2Emissions = parseInt(row["KM annui"]) * ((parseInt(row["emissioni di CO2 WLTP"]) + parseInt(row["emissioni di CO2 WLTP (GPL o metano)"])) / 2); //Media tra le emissioni di due carburanti in quanto il veicolo è bifuel
        //console.log(currentCO2Emissions)
        totalCO2Emissions += currentCO2Emissions;
        console.log("currentCO2Emissions", currentCO2Emissions);

        averageCO2Emissions = (parseInt(row["emissioni di CO2 WLTP"]) + parseInt(row["emissioni di CO2 WLTP (GPL o metano)"])) / 2;
        console.log("averageCO2Emissions", averageCO2Emissions);

      } else {
        currentCO2Emissions = parseInt(row["KM annui"]) * parseInt(row["emissioni di CO2 WLTP"] || 0);
        //console.log(currentCO2Emissions)
        totalCO2Emissions += currentCO2Emissions;
        console.log("currentCO2Emissions", currentCO2Emissions);
      }

      let emissionClass = 0;

      // Determina la classe di emissione applicabile
      const emissionClasses = question.name === 'question29' //la domanda 29 è relativa al trasporto persone
        ? emissionClassesPeopleTransport
        : emissionClassesFreightTransport;

      console.log('emission value GPl Metano', (parseInt(row["emissioni di CO2 WLTP"]) + parseInt(row["emissioni di CO2 WLTP (GPL o metano)"])) / 2);
      console.log('emission value other', parseInt(row["emissioni di CO2 WLTP"]));

      const emissionsValue = (row["Carburante"] === "GPL" || row["Carburante"] === "Metano")
        ? ((parseInt(row["emissioni di CO2 WLTP"]) + parseInt(row["emissioni di CO2 WLTP (GPL o metano)"])) / 2)
        : parseInt(row["emissioni di CO2 WLTP"]);

      // Trova la classe di emissione corrispondente
      emissionClass = emissionClasses.find((entry) =>
        emissionsValue >= entry.minEmissions && emissionsValue <= entry.maxEmissions);


      console.log("emissionClass", emissionClass);

      console.log("Il veicolo viaggia", row["Il veicolo viaggia"]);
      console.log("Penalita applicata", penalities[row["Il veicolo viaggia"]]);

      //penalità sulla base della capienza dei veicoli
      currentVehicleScore = emissionClass.maxScore - parseInt(penalities[row["Il veicolo viaggia"]]);
      console.log("currentVehicleScore", currentVehicleScore);

      totalVehiclesScore += currentVehicleScore;

    });

    console.log("total co2 emisisons in tons", totalCO2Emissions / 1000000);
    console.log("total veichles", totalVehicles)
    console.log("total veichle score in decimal", totalVehiclesScore / totalVehicles / 10)

    totalCO2Emissions = totalCO2Emissions / 1000000;
    return {
      CO2emissions: totalCO2Emissions,
      vehiclesScore: totalVehiclesScore / totalVehicles / 10
    }
  }

  // Funzione per calcolare il punteggio per le domande di tipo radiogroup
  function calcolaPunteggioRadiogroup(response, element) {

    ////console.log(`parametri radiogroup: `, response, element);
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
      //console.log(`Item: ${ item.name }, Risposta: ${ response[item.name] } `);
      if (response[item.name]) {
        punteggio += item.score || 0;
        ////console.log(`Punteggio multiple text: ${ punteggio } `);
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
      //console.log(`Column 2: ${ response["Column 2"] } `);
      //console.log(`carburante: ${ fuelScores[response["Column 2"]] } `);
      const penalitaCarburante = penalitaPerCarburante[response["Column 2"]] || 0;
      const punteggio = ((fuelScores[response["Column 2"]] - penalitaCarburante) * parseInt(response["Column 1"])) || 0; //calcolo punteggio per ogni riga = numero mezzi * punteggio Euro
      //console.log(`punteggio con penalita: ${ punteggio } `);
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
          //console.log(`Domanda: ${ element.name }, Risposta: Si, Anno: ${ row["Column 3"] }, Punteggio: ${ punteggioAnno } `);
        } else if (row["Column 2"] === 0) {
          // Se la risposta è "No", il punteggio è 0
          mezziTotali += parseInt(row["Column 1"]);
          punteggioTotale += 0;
          //console.log(`Domanda: ${ element.name }, Risposta: No, Punteggio: 0`);
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

    //console.log(`parametri pannello: `, formData, panel);

    if (formData && panel.elements) {
      panel.elements.forEach(element => {
        if (element.type === 'radiogroup') {
          const punteggioRadiogroup = calcolaPunteggioRadiogroup(formData[element.name], element);
          punteggio += punteggioRadiogroup;
          //console.log(`Domanda nel pannello: ${ element.name }, Risposta: ${ formData[element.name] }, Punteggio: ${ punteggioRadiogroup } `);
        } else if (element.type === 'text') {
          // Puoi aggiungere logica specifica per i campi di testo se necessario
        }
      });
    }

    return punteggio;
  }

  return (
    <div className="flex pt-20 items-center justify-center p-4">
      {completedData ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Questionario completato!
          </h2>
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-gray-700">
              Hai totalizzato un punteggio di:
              <span className="block text-4xl md:text-5xl font-extrabold text-red-600 mt-2">
                {completedData.totalScore} / 10
              </span>
            </p>
            <p className="text-lg md:text-xl text-gray-700">
              Emissioni totali:
              <span className="block text-3xl md:text-4xl font-bold text-blue-600 mt-2">
                {completedData.emissions} kg CO₂e
              </span>
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/User"}
            className="mt-6 px-6 py-3 text-white bg-[#2d7044] hover:bg-white hover:text-[#2d7044] border-2 border-[#2d7044] hover:bg-[#2d7044] font-semibold rounded-lg transition-colors duration-300"
          >
            Torna alla pagina utente
          </button>
        </div>
      ) : (
        <Survey model={survey} />
      )}
    </div>

  );
}

export default TransportQuestionnaire;