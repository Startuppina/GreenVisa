import { useState, useEffect, useRef } from "react";
import { Survey } from "survey-react-ui";
import { Model } from 'survey-react-ui';
import "survey-core/defaultV2.min.css";
import { themeJson } from "../surveyTheme";
import generatePDF from "../pdfGeneratorQuestionnaires";
import AutosavePopup from "./autosavePopup";
import { fetchInfo, restoreSurveyData, submitSurveyData } from "./questionnairesBaseFunctions";
import { json } from "../questionnaires/wellnessQuestionnaire";
import MessagePopUp from "./messagePopUp";


function WellnessQuestionnaire({ certification_id }) {
  const [userInfo, setUserInfo] = useState();
  const [userData, setUserData] = useState({});
  const [initialData, setInitialData] = useState({}); // Stato per i dati iniziali
  const [mark, setMark] = useState(null); // Stato per i dati completati
  const [buttonPopup, setButtonPopup] = useState(false);
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
          setMessagePopup(data.error.response?.data?.msg || data.error.message);
          setButtonPopup(true);
        }
      } else {
        setMessagePopup(result.error.response?.data?.msg || result.error.message);
        setButtonPopup(true);
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
  }, []);


  function handleSurveyComplete() {
    let totalScore = calcolaPunteggio(survey.data);
    console.log("totalScore:", totalScore);
    setMark(totalScore);
    saveSurveyDataComplete(survey, totalScore);
    //scroll to top of page
    window.scrollTo(0, 0);

    console.log("Answers:", survey.data);
  }

  async function saveSurveyData(survey) {
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore: initialData.completed ? initialData.previousScore : 0,
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
      setButtonPopup(true);
    }
  }

  async function saveSurveyDataComplete(survey, totalScore) {
    const data = {
      surveyId: userInfo,
      certification_id,
      totalScore,
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
      setButtonPopup(true);
    }
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

    const punteggioMassimo = 323; //punteggio massimo possibile
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
        {mark ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Questionario completato!
            </h2>
            <div className="space-y-4">
              <p className="text-lg md:text-xl text-gray-700">
                Hai totalizzato un punteggio di:
                <span className="block text-4xl md:text-5xl font-extrabold text-red-600 mt-2">
                  {mark} / 10
                </span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/User"}
              className="mt-6 px-6 py-3 text-white bg-[#2d7044] hover:bg-white hover:text-[#2d7044] border-2 border-[#2d7044] font-semibold rounded-lg transition-colors duration-300"
            >
              Torna alla pagina utente
            </button>
          </div>
        ) : (
          <>
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
              {messagePopup}
            </MessagePopUp>
            <AutosavePopup trigger={triggerAutosavePopup} setTrigger={setTriggerAutosavePopup} />
            <Survey model={survey} />
          </>
        )}
      </div>
    </div>
  );
}

export default WellnessQuestionnaire;