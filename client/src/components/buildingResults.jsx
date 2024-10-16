import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRecoveryContext } from "../provider/provider";
import MessagePopUp from "./messagePopUp";

function BuildingResults() {
    const [results, setResults] = useState([{ emissionmark: 0, emissionco2: 0, results_visible: false }]);
    const [progress, setProgress] = useState(0);
    const { buildingID, refreshResults } = useRecoveryContext();
    const [buttonPopUp, setButtonPopUp] = useState(false);
    const [messagePopUp, setMessagePopUp] = useState("");

    useEffect(() => {
        setResults([{ emissionmark: 0, emissionco2: 0 }]);

        // fetch results from server
        const fetchResults = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-results/${buildingID}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.status === 200) {
                    setResults(response.data); // Aggiorna lo stato
                    //console.log("Results:", results);


                    // Smooth scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (error) {
                console.error("Error fetching results:", error);
                setMessagePopUp(error.response?.data?.msg || error.message);
                setButtonPopUp(true);
            }
        };
        fetchResults();
    }, [refreshResults, buildingID]); // Dipendenze corrette

    useEffect(() => {
        // Aspetta che "results" sia disponibile prima di eseguire

        const targetProgress = scoreIndicator(results[0].emissionmark);
        const animationDuration = 1000;

        let currentProgress = 0;
        const step = targetProgress / (animationDuration / 5);
        const interval = setInterval(() => {
            currentProgress += step;
            if (currentProgress >= targetProgress) {
                clearInterval(interval);
                setProgress(targetProgress);
            } else {
                setProgress(currentProgress);
            }
        }, 5);

    }, [results]); // Aggiornamento progress quando results cambia

    const scoreIndicator = (score) => {
        const maxScore = 10;
        const normalizedScore = Math.max(0, Math.min(score, maxScore));
        return (normalizedScore / maxScore) * 100;
    };

    const getDetailedVoteColor = (finalVote) => {
        if (finalVote >= 9) return "#1b5e20";
        else if (finalVote >= 8) return "#4caf50";
        else if (finalVote >= 7) return "#8bc34a";
        else if (finalVote >= 6) return "#cddc39";
        else if (finalVote >= 5) return "#ffeb3b";
        else if (finalVote >= 4) return "#ffc107";
        else if (finalVote >= 3) return "#ff9800";
        else if (finalVote >= 2) return "#ff5722";
        else if (finalVote >= 1) return "#f44336";
        else return "#b71c1c";
    };

    const getOverallEvaluation = (finalVote) => {
        if (finalVote >= 9) return "Eccellente";
        else if (finalVote >= 8) return "Buono";
        else if (finalVote >= 7) return "Discreto";
        else if (finalVote >= 6) return "Sufficiente";
        else return "Non Sufficiente";
    };

    return (
        results[0].results_visible && (
            <div>
                <div className="flex flex-col justify-center bg-gray-100 mt-10 mx-2 md:mx-14 rounded-xl shadow-lg p-6 text-arial text-xl">
                    <MessagePopUp trigger={buttonPopUp} setTrigger={setButtonPopUp}>
                        {messagePopUp}
                    </MessagePopUp>
                    <h1 className="text-4xl text-center font-bold text-gray-800 mb-4">Risultato</h1>
                    <div className="flex flex-col items-start gap-6 mt-6">
                        <div className="flex flex-col items-center mx-auto justify-between w-full md:w-[500px]">
                            <div className="font-bold text-lg md:text-xl text-gray-700">Voto</div>
                            <div className="w-full h-[30px] bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner">
                                <div
                                    className="h-full rounded-lg transition-all duration-300 ease-in-out"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundColor: `${getDetailedVoteColor(results[0].emissionmark)}`,
                                    }}
                                />
                            </div>
                            <div className="text-right w-full text-lg md:text-xl text-gray-600 mt-2">
                                <strong>{results[0].emissionmark > 10 ? '10+' : results[0].emissionmark}</strong>/10
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center mx-auto justify-center w-full md:w-[500px] gap-2">
                            <div className="text-lg md:text-xl text-blue-600 font-extrabold">
                                {getOverallEvaluation(results[0].emissionmark)}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center mx-auto justify-between w-full md:w-[500px] gap-2 mt-4">
                            <div className="font-bold text-lg md:text-xl text-gray-700">Emissioni CO2</div>
                            <div className="text-lg md:text-xl text-gray-600 flex gap-2">
                                <strong>{results[0].emissionco2}</strong> <div>tons CO<sub>2</sub>e</div>

                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center mx-auto justify-between w-full md:w-[500px] gap-2">
                            <div className="font-bold text-lg md:text-xl text-gray-700">Emissioni CO2 per superficie</div>
                            <div className="text-lg md:text-xl text-gray-600 flex gap-2">
                                <strong>{results[0].areaemissionco2}</strong> <div>tons CO<sub>2</sub>/m²</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
}

export default BuildingResults;
