import { useState, useEffect, useRef } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import axios from "axios";
import generatePDF from "../pdfGeneratorQuestionnaires";
import AutosavePopup from "./autosavePopup";
import { fetchInfo, restoreSurveyData, submitSurveyData } from "./questionnairesBaseFunctions";
import { json } from "../questionnaires/transportQuestionnaire";
import MessagePopUp from "./messagePopUp";

function TransportQuestionnaire({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const [userData, setUserData] = useState({});
  const [initialData, setInitialData] = useState({}); // Stato per i dati iniziali
  const [completedData, setCompletedData] = useState(null); // Stato per i dati completati
  const [buttonPopup, setbuttonPopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState(false);
  const [triggerAutosavePopup, setTriggerAutosavePopup] = useState(false);


  const surveyRef = useRef(null);
  if (!surveyRef.current) {
    surveyRef.current = new Model(json);
  }
  const survey = surveyRef.current;

  useEffect(() => {

    const fetchData = async () => {
      const result = await fetchInfo();

      if (result.success) {
        setUserInfo(result.data.id);
        setUserData(result.data);
        const data = await restoreSurveyData(certification_id);
        if (data.success) {
          setInitialData({ surveyData: data.surveyData, pageNo: data.pageNo, completed: data.completed, previousCO2emissions: data.co2emissions, previousScore: data.total_score });
        } else {
          // setMessagePopup(data.error.response?.data?.msg || data.error.message);
          // setbuttonPopup(true);
        }
      } else {
        setMessagePopup(result.error.response?.data?.msg || result.error.message);
        setbuttonPopup(true);
      }

    };

    fetchData();

  }, []);

  useEffect(() => {

    if (initialData) {
      survey.data = initialData.surveyData;
      survey.currentPageNo = initialData.pageNo;
    }
    survey.applyTheme(themeJson);

  }, [initialData]);


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
  }, []);



  function handleSurveyComplete() {
    let results = calcolaRisultati(survey.data);
    setCompletedData({
      totalScore: results.punteggioTotale,
      emissions: results.CO2emissions.toFixed(2),
    });
    saveSurveyDataComplete(survey, results.punteggioTotale, results.CO2emissions);
    //scroll to top of page
    window.scrollTo(0, 0);
  }

  async function saveSurveyData(survey) { //Utilizzato per salvare le risposte del questionario ad ogni risposta data o modificata
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore: initialData.completed ? initialData.previousScore : 0,
      CO2emissions: initialData.completed ? initialData.previousCO2emissions : 0,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: initialData.completed ? true : false
    };
    const actionSubmit = await submitSurveyData(data);
    console.log("risultato", actionSubmit.success);
    if (actionSubmit.success) {
      setTriggerAutosavePopup(true);
      setTimeout(() => {
        setTriggerAutosavePopup(false);
      }, 3000);
    } else {
      setMessagePopup(actionSubmit.error.response?.data?.msg || actionSubmit.error.message);
      setbuttonPopup(true);
    }
  }

  async function saveSurveyDataComplete(survey, totalScore, CO2emissions) { //Utilizzato per salvare le risposte del questionario quando il questionario viene completato
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
      CO2emissions,
      pageNo: survey.currentPageNo,
      surveyData: survey.data,
      completed: true
    };
    const actionSubmit = await submitSurveyData(data);
    if (actionSubmit.success) {
      setTriggerAutosavePopup(true);
      setTimeout(() => {
        setTriggerAutosavePopup(false);
      }, 3000);
    } else {
      setMessagePopup(actionSubmit.error.response?.data?.msg || actionSubmit.error.message);
      setbuttonPopup(true);
    }
  }

  const secondLevelCertification = async (userInfo, certification_id) => {
    try {
      await axios.post(`/api/second-level-certification`, { userInfo, certification_id }, {
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
            onClick={() => window.location.href = "/user"}
            className="mt-6 px-6 py-3 text-white bg-[#2d7044] hover:bg-white hover:text-[#2d7044] border-2 border-[#2d7044] font-semibold rounded-lg transition-colors duration-300"
          >
            Torna alla pagina utente
          </button>
        </div>
      ) : (
        <>
          <MessagePopUp trigger={buttonPopup} setTrigger={setbuttonPopup}>
            {messagePopup}
          </MessagePopUp>
          <AutosavePopup trigger={triggerAutosavePopup} setTrigger={setTriggerAutosavePopup} />
          <Survey model={survey} />
        </>
      )}
    </div>

  );
}

export default TransportQuestionnaire;