import React, { useState, useEffect } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import generatePDF from "../pdfGeneratorQuestionnaires";
import { set } from "jodit/esm/core/helpers";


function WellnessQuestionnaire({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const [userData, setUserData] = useState({});
  const [initialData, setInitialData] = useState({}); // Stato per i dati iniziali
  const [completedData, setCompletedData] = useState(null); // Stato per i dati completati

  const json = {
    "completeText": "Termina",
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "html",
            "name": "question28",
            "html": "<div style=\"font-family: Arial, sans-serif; font-size: 1.25rem; padding: 2rem; line-height: 1.75; background-color: #f9fafb; border-radius: 1.5rem; border: 0.1px solid #A3A3A3;\">\n  <h1 style=\"font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #2d7044;\">\n    Questionario spa e resorts\n  </h1>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    Regolamento per la Compilazione del Questionario\n  </h2>\n\n  <p style=\"margin-bottom: 0.25rem;\">\n    Benvenuto nel questionario su spa e resort! Ti chiediamo di leggere attentamente le seguenti istruzioni per compilare\n    correttamente tutte le sezioni. Il questionario è progettato per raccogliere informazioni più accurate possibili, quindi è\n    fondamentale seguire queste linee guida. \n    <strong style=\"font-weight: 600;\">\n      Tutte le domande sono obbligatorie (hanno un asterisco rosso \n      <span style=\"color: #f56565;\">*</span>)\n    </strong>.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    1. Compilazione Onesta e Rilevante\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Rispondi in modo sincero e accurato, fornendo informazioni che riflettano la tua situazione attuale. È obbligatorio rispondere a tutte le domande.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    2. Esattezza delle Risposte\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Assicurati che tutte le risposte fornite siano corrette e coerenti.</p>\n\n   <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    4. Rispetto dei Tempi\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Completa il questionario con calma. Una compilazione attenta e precisa è preferibile a una rapida e incompleta.\n  </p>\n\n  <h2 style=\"font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;\">\n    4. Assistenza\n  </h2>\n  <p style=\"margin-bottom: 0.25rem;\">\n    Se hai dubbi o difficoltà nella compilazione, contattaci per chiarimenti. È importante comprendere bene ogni\n    domanda prima di rispondere.\n  </p>\n\n  <p style=\"margin-bottom: 0.25rem;\">Grazie per la tua collaborazione!</p>\n</div>\n"
          },
          {
            "type": "radiogroup",
            "name": "question1",
            "title": "I criteri individuati mirano a limitare i principali impatti ambientali connessi alle caratteristiche fondamentali dell’attività che si svolge nella struttura pocanzi descritta. Per quest’area d’analisi le tematiche analizzate saranno quelle relative a:",
            "choices": [
              {
                "value": "Item 1",
                "text": "Efficienza e risparmio energetico",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "Gestione e produzione di rifiuti",
                "score": 5
              },
              {
                "value": "Item 3",
                "text": "Comunicazione ed educazione ambientale rivolta a clienti e dipendenti",
                "score": 4
              },
              {
                "value": "Item 4",
                "text": "Utilizzo di abbigliamento e prodotti di consumo green"
              },
              {
                "value": "Item 5",
                "text": "Vendita di prodotti certificati bio",
                "score": 4
              },
              {
                "value": "Item 6",
                "text": "Programmi Fitness green",
                "score": 3
              },
              {
                "value": "Item 7",
                "text": "Programmi Beauty green",
                "score": 3
              },
              {
                "value": "Item 8",
                "text": "Programmi Relax green",
                "score": 3
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question2",
            "title": "L’impresa è operativa e registrata conformemente alla legislazione nazionale o locale e il personale è assunto e assicurato a norma di legge ?",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question3",
            "title": "Nella struttura si effettua regolarmente la raccolta differenziata secondo quanto previsto dal Regolamento Comunale vigente ?",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question4",
            "title": "Le stanze da bagno degli Ospiti/clienti sono dotate di rubinetti e docce a flusso d’acqua medio non superiore a 8,5 litri/minuto ?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question5",
            "title": "L’attività porta avanti attività volte alla promozione dell’utilizzo dei mezzi pubblici o inerenti l’affitto di mezzi, preferibili sotto il profilo ambientale, quali ad esempio le biciclette, le biciclette elettriche e le automobili elettriche?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question6",
            "title": "Il personale effettua corsi di formazione sulla tutela ambientale e la lotta agli sprechi energetici ed ambientali all’interno dell’attività?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question7",
            "title": "Il personale effettua corsi di formazione sull’ EPIGENETICA con particolare riferimento all’impatto scientifico che il contesto ambientale ha sul DNA e quindi sul benessere della persona?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 2
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question8",
            "title": "Gli abiti da lavoro, comprese le divise per il personale che opera in cabina o in sala, prevede un abbigliamento privo di sostanze tossiche con tessuti certificati OEKO-TEST®?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question9",
            "title": "Nell’attività vengono utilizzati prodotti detergenti e/o per l’igiene del corpo (riferimento: prodotti per la pulizia, detersivi per lavare piatti/bucato/lavastoviglie, detergenti sanitari, saponi e shampoo) che hanno ottenuto il marchio Ecolabel EU o hanno ottenuto altri marchi ISO di tipo I ?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question10",
            "title": "Nell’attività vengono utilizzati e venduti solo cosmetici green, privi di materie prime di sintesi, come i derivati del petrolio, siliconi e tensioattivi, e prodotti a base di ingredienti naturali o di origine naturale come fitoestratti con Certificazione Cosmos Organic del disciplinare Cosmos Standard (unico standard riconosciuto a livello internazionale)?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question11",
            "title": "Nel caso siano presenti Bar e/o attività di Ristorazione, vengono proposti agli ospiti prodotti alimentari di provenienza locale, di stagione, biologici e a Km zero (per le verdure fresche e la frutta) ?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question35",
            "title": "Non viene permesso di fumare nei locali del centro, compresi gli spogliatoi, e sono presenti appositi cartelli?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question12",
            "title": "Viene effettuato periodicamente (almeno bimensilmente) il monitoraggio dei consumi di energia elettrica, gas e acqua ?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question13",
            "title": "Nei bagni sono installati water (vasi sanitari) con doppio scarico o con sistemi volti alla riduzione del contenuto di acqua nella cassetta di scarico con un flusso di risciacquo non superiore ai 8,5 litri?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question14",
            "title": "Nelle toilette è presente un cestino per i rifiuti ed uno per gli assorbenti?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question15",
            "title": "Nella vostra attività si presta attenzione alla riduzione degli imballaggi e alla limitazione dell’utilizzo delle confezioni monodose?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question16",
            "title": "Le iniziative volte al risparmio energetico e al rispetto dell’ambiente promosse e portate avanti dalla struttura vengono adeguatamente comunicate agli ospiti / clienti?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question17",
            "title": "La vostra attività porta avanti politiche volte all’incentivazione della riduzione dell’utilizzo dei mezzi privati da parte del personale dipendente?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question18",
            "title": "Nella vostra attività è stato creato e promosso un “programma fitness green”?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question19",
            "title": "Nella vostra attività è stato creato e promosso un “programma beauty green”?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question20",
            "title": "Nella vostra attività è stato creato e promosso un “programma relax green”?",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question21",
            "title": "Gli articoli usa e getta che utilizza sono in linea con la norma EN 13432 e quindi biodegradabili?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question22",
            "title": "La lavastoviglie è dotata di un dosatore automatico per il detersivo?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question23",
            "title": "Più in generale vengono utilizzati i dosatori per i prodotti per le pulizie?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question24",
            "title": "La cabine sono attrezzate con dispenser per rotoli di carta, asciugamani ecc.?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question25",
            "title": "I bagni sono attrezzati con dispenser?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 2
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question26",
            "title": "Nei bagni sono presenti sensori di movimento con timer di spegnimento per la gestione dell’illuminazione?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question27",
            "title": "Gli elettrodomestici di cui è dotata la sua attività hanno un’efficienza di classe A ai sensi della direttiva 94/2/CE?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question28",
            "title": "Le lavastoviglie presentano un’efficienza energetica di classe A ai sensi della direttiva 97/17/CE?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question29",
            "title": "Le lavatrici presentano un’efficienza energetica di classe A ai sensi della direttiva 95/12/CE?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question30",
            "title": "Almeno l’80% delle apparecchiature da ufficio hanno i requisiti per l’attribuzione dell’etichetta “Energy Star”* ( spiegare) ai sensi del regolamento (CE n° 2442/2001)?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 3
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              },
              {
                "value": "Item 3",
                "text": "NON SO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question31",
            "title": "Parte dell’energia e del calore utilizzato proviene da fonti rinnovabili?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question32",
            "title": "I rubinetti sono dotati di riduttori di flusso e di sistemi di controllo automatizzati?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 5
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question33",
            "title": "La vostra raccolta differenziata viene ulteriormente frazionata ( alluminio, sughero, tappi, ecc)?\n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 4
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          },
          {
            "type": "radiogroup",
            "name": "question34",
            "title": "Il compostaggio degli scarti alimentari (riferimento: scarti alimentari provenienti dai servizi di ristorazione) avviene all’interno del proprio giardino o nelle aree verdi di pertinenza della struttura ? \n",
            "choices": [
              {
                "value": "Item 1",
                "text": "SI",
                "score": 100
              },
              {
                "value": "Item 2",
                "text": "NO",
                "score": 0
              }
            ]
          }
        ]
      }
    ],
    "widthMode": "responsive"
  }


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
    console.log("Restoring survey data for survey ID:", surveyId);

    console.log("certification_id:", certification_id);
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
    survey.onComplete.add(handleSurveyComplete);

    survey.addNavigationItem({
      id: "pdf-export",
      title: "Salva come PDF",
      action: () => {
        const updatedData = survey.data;  // Recupera i dati aggiornati
        let totalScore = calcolaPunteggio(survey.data);
        generatePDF(updatedData, "Questionario di SPA e Resorts", userData, totalScore, json)();  // Genera il PDF con i dati aggiornati
      },
    });

    // Cleanup
    return () => {
      survey.onValueChanged.remove(saveSurveyData);
      survey.onComplete.remove(handleSurveyComplete);
    };
  }, [survey]);


  function handleSurveyComplete() {
    let totalScore = calcolaPunteggio(survey.data);
    console.log("totalScore:", totalScore);
    setCompletedData(totalScore);
    saveSurveyDataComplete(survey, totalScore);
    //scroll to top of page
    window.scrollTo(0, 0);

    console.log("Answers:", survey.data);
  }


  async function submitSurveyData(data) {

    console.log("Submitting survey data:", data);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses`, data, {
        withCredentials: true,
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
      totalScore: initialData.completed ? initialData.previousScore : 0,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: initialData.completed ? true : false
    };
    submitSurveyData(data);
  }

  function saveSurveyDataComplete(survey, totalScore) {
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: true
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
          default:
            console.warn(`Tipo di domanda non gestito: ${element.type}`);
        }
      });
    });

    const punteggioMassimo = 3400; //punteggio massimo possibile
    return Math.round((punteggioTotale / punteggioMassimo) * 10);
  }

  // Funzione per calcolare il punteggio per le domande di tipo radiogroup
  function calcolaPunteggioRadiogroup(response, element) {

    //console.log(`parametri radiogroup:`, response, element);
    let punteggio = 0;
    if (response && element.choices) {
      const scelta = element.choices.find(choice => choice.value === response);
      if (scelta) {
        punteggio = scelta.score || 0;
      }
    }
    return punteggio;
  }

  return (
    <div className="overflow-hidden">
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
                  {completedData} / 10
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
    </div>
  );
}

export default WellnessQuestionnaire;