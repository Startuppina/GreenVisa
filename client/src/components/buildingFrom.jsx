import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";

function BuildingFrom() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [year, setYear] = useState("");
    const [renovation, setRenovation] = useState("");
    const [heating, setHeating] = useState("");
    const [ventilation, setVentilation] = useState("");
    const [energyControl, setEnergyControl] = useState("");
    const [maintenance, setMaintenance] = useState("");
    const [waterRecovery, setWaterRecovery] = useState("");
    const [electricityCounter, setElectricityCounter] = useState("");
    const [electricityAnalyzer, setElectricityAnalyzer] = useState("");
    const [lighting, setLighting] = useState("");
    const [led, setLed] = useState("");
    const [gasLamp, setGasLamp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [years, setYears] = useState([]);
    const [renovations, setRenovations] = useState([]);
    const [heatings, setHeatings] = useState([]);
    const [ventilations, setVentilations] = useState([]);
    const [energies, setEnergies] = useState([]);
    const [maintinances, setMaintinances] = useState([]);
    const [recoveries, setRecoveries] = useState([]);
    const [electricityCounters, setElectricityCounters] = useState([]);
    const [analyzers, setAnalyzers] = useState([]);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { addBuildingTrigger, setAddBuildingTrigger } = useRecoveryContext();


    const navigate = useNavigate();

    useEffect(() => {
        const fetchSelectOptions = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/building-options');
                setYears(response.data.construction_years);
                setRenovations(response.data.renovations);
                setHeatings(response.data.heat_distributions);
                setVentilations(response.data.ventilations);
                setEnergies(response.data.energy_controls);
                setMaintinances(response.data.maintenances);
                setRecoveries(response.data.water_recoveries);
                setElectricityCounters(response.data.electricity_meters);
                setAnalyzers(response.data.analyzers);
            } catch (error) {
                console.log(error);
            }
        };

        fetchSelectOptions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('year', year);
        formData.append('renovation', renovation);
        formData.append('heating', heating);
        formData.append('ventilation', ventilation);
        formData.append('energyControl', energyControl);
        formData.append('maintenance', maintenance);
        formData.append('waterRecovery', waterRecovery);
        formData.append('electricityCounter', electricityCounter);
        formData.append('electricityAnalyzer', electricityAnalyzer);
        formData.append('lighting', lighting);
        formData.append('led', led);
        formData.append('gasLamp', gasLamp);


        const totalScore = calculateTotalScore(formData);
        formData.append('buildingScore', totalScore);

        console.log('Form data:', formData);

        try {
            const response = await axios.post('http://localhost:8080/api/upload-building', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopup(response.data.msg);
                    setButtonPopup(true);
                    setIsLoading(false);
                    setName("");
                    setDescription("");
                    setYear("");
                    setRenovation("");
                    setHeating("");
                    setVentilation("");
                    setEnergyControl("");
                    setMaintenance("");
                    setWaterRecovery("");
                    setElectricityCounter("");
                    setElectricityAnalyzer("");
                    setLighting("");
                    setLed("");
                    setGasLamp("");
                    setAddBuildingTrigger(!addBuildingTrigger);

                    setMessagePopup("edificio aggiunto con successo");
                    setButtonPopup(true);
                }, 3000); // Caricamento finto di 2 secondi

                navigate('/buildings');
            } else if (response.status === 400) {
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
            }
        } catch (error) {
            setIsLoading(false);
            setMessagePopup(error.response?.data?.msg || error.message);
            setButtonPopup(true);
        }
    };

    // Funzioni handleChange per aggiornare gli stati
    const handleNameChange = (e) => setName(e.target.value);
    const handleDescriptionChange = (e) => setDescription(e.target.value);
    const handleYearChange = (e) => setYear(e.target.value);
    const handleRenovationChange = (e) => setRenovation(e.target.value);
    const handleHeatingChange = (e) => setHeating(e.target.value);
    const handleVentilationChange = (e) => setVentilation(e.target.value);
    const handleEnergyChange = (e) => setEnergyControl(e.target.value);
    const handleMaintenanceChange = (e) => setMaintenance(e.target.value);
    const handleWaterChange = (e) => setWaterRecovery(e.target.value);
    const handleElectricChange = (e) => setElectricityCounter(e.target.value);
    const handleElectricAnalyzerChange = (e) => setElectricityAnalyzer(e.target.value);
    const handleLightingChange = (e) => setLighting(e.target.value);
    const handleLedChange = (e) => setLed(e.target.value);
    const handleGasChange = (e) => setGasLamp(e.target.value);

    const scoring = {
        year: {
            'Prima del 1976': 10,
            'Tra 1976 e 1991': 13,
            'Tra 1991 e 2004': 16,
            'dopo il 2004': 19
        },
        renovation: {
            'Edile': 19,
            'Impiantistico': 16,
            'No': 13
        },
        heating: {
            'Radiatori': 10,
            'Ventilconvettori': 13,
            'Impianto ad aria canalizzato': 16,
            'Pavimento radiante': 19
        },
        ventilation: {
            'Si': 13,
            'Si, con recupero calore': 16,
            'No': 10
        },
        energyControl: {
            'Settimanale': 16,
            'Mensile': 13,
            'Annuale': 10,
            'No': 7
        },
        maintenance: {
            'Settimanale': 16,
            'Mensile': 13,
            'Annuale': 10,
            'No': 7
        },
        waterRecovery: {
            'per l irrigazione': 13,
            'per la cassette di scarico': 10,
            'altro': 7,
            'No': 0
        },
        electricityCounter: {
            'da 0 a 10 kW': 25,
            'da 10 a 20 kW': 22,
            'da 20 a 50 kW': 19,
            'da 50 a 100 kW': 16,
            'oltre i 100 kW': 13
        },
        electricityAnalyzer: {
            'Si': 16,
            'Non so': 13,
            'No': 10
        },
        percentageScore: {
            'lighting': (percentage) => {
                return Math.round((percentage / 100) * 12);  // scala il punteggio fino a 12 punti
            },
            'led': (percentage) => {
                return Math.round((percentage / 100) * 36);  // scala il punteggio fino a 36 punti
            },
            'gas_lamp': (percentage) => {
                return Math.round((percentage / 100) * 24);  // scala il punteggio fino a 24 punti
            }
        }
    };

    const calculateTotalScore = (formData) => {
        let totalScore = 0;

        // Estrai i dati dal formData
        const name = formData.get('name');  // Nome non usato per il punteggio
        const description = formData.get('description');  // Descrizione non usata per il punteggio
        const year = formData.get('year');
        const renovation = formData.get('renovation');
        const heating = formData.get('heating');
        const ventilation = formData.get('ventilation');
        const energyControl = formData.get('energyControl');
        const maintenance = formData.get('maintenance');
        const waterRecovery = formData.get('waterRecovery');
        const electricityCounter = formData.get('electricityCounter');
        const electricityAnalyzer = formData.get('electricityAnalyzer');
        const lightingPercentage = parseFloat(formData.get('lighting')) || 0;
        const ledPercentage = parseFloat(formData.get('led')) || 0;
        const gasLampPercentage = parseFloat(formData.get('gasLamp')) || 0;

        // Calcola il punteggio totale con un peso maggiore per i LED
        totalScore += scoring.year[year] || 0;
        totalScore += scoring.renovation[renovation] || 0;
        totalScore += scoring.heating[heating] || 0;
        totalScore += scoring.ventilation[ventilation] || 0;
        totalScore += scoring.energyControl[energyControl] || 0;
        totalScore += scoring.maintenance[maintenance] || 0;
        totalScore += scoring.waterRecovery[waterRecovery] || 0;
        totalScore += scoring.electricityCounter[electricityCounter] || 0;
        totalScore += scoring.electricityAnalyzer[electricityAnalyzer] || 0;
        totalScore += scoring.percentageScore.lighting(lightingPercentage);
        totalScore += scoring.percentageScore.gas_lamp(gasLampPercentage);

        // Aumenta l'impatto del punteggio dei LED
        const ledScore = scoring.percentageScore.led(ledPercentage);
        const weightedLedScore = ledScore * 1.5; // Fattore di moltiplicazione per dare maggiore peso ai LED
        totalScore += weightedLedScore;

        return totalScore;
    };

    return (
        <div className="mt-4">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-[98.5%] mx-auto my-10 md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border border-gray-300 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">Inserisci un nuovo edificio</h2>
                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Sezione Informazioni Generali */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Nome</span>
                            <input
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Descrizione</span>
                            <input
                                type="text"
                                value={description}
                                onChange={handleDescriptionChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                    </div>

                    {/* Sezione Anno di Costruzione */}
                    <div className="mb-6">
                        <label className="flex flex-col w-full">
                            <span className="block mb-2">Anno di costruzione</span>
                            <select
                                value={year}
                                onChange={handleYearChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona anno</option>
                                {years.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Ristrutturazioni e Altri Parametri */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Ristrutturazioni (M)</span>
                            <select
                                value={renovation}
                                onChange={handleRenovationChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di ristrutturazione</option>
                                {renovations.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Diffusione calore (M)</span>
                            <select
                                value={heating}
                                onChange={handleHeatingChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di riscaldamento</option>
                                {heatings.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Ventilazione e Controlli */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Ventilazione meccanica controllata</span>
                            <select
                                value={ventilation}
                                onChange={handleVentilationChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {ventilations.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Controllo dei consumi</span>
                            <select
                                value={energyControl}
                                onChange={handleEnergyChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {energies.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Manutenzioni e Recupero Acqua */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Manutenzione periodica dell'impianto</span>
                            <select
                                value={maintenance}
                                onChange={handleMaintenanceChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {maintinances.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Sistema di recupero acqua piovana (M)</span>
                            <select
                                value={waterRecovery}
                                onChange={handleWaterChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {recoveries.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Contatori e Analizzatori */}
                    <div className="flex flex-col md:flex-row items-center md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Contatore elettrico per l'utente</span>
                            <select
                                value={electricityCounter}
                                onChange={handleElectricChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {electricityCounters.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Analizzatori di rete per il controllo dei consumi elettrici</span>
                            <select
                                value={electricityAnalyzer}
                                onChange={handleElectricAnalyzerChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {analyzers.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Corpi Illuminanti */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-center mb-4">Corpi illuminanti</h3>
                        <div className="flex flex-col md:flex-row items-center md:gap-4">
                            <label className="flex flex-col w-full md:w-1/3">
                                <span className="block mb-2">Incandescenza (%)</span>
                                <select
                                    value={lighting}
                                    onChange={handleLightingChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    <option value="0">0%</option>
                                    <option value="10">10%</option>
                                    <option value="20">20%</option>
                                    <option value="30">30%</option>
                                    <option value="40">40%</option>
                                    <option value="50">50%</option>
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                    <option value="100">100%</option>
                                </select>
                            </label>
                            <label className="flex flex-col w-full md:w-1/3">
                                <span className="block mb-2">Led (%)</span>
                                <select
                                    value={led}
                                    onChange={handleLedChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    <option value="0">0%</option>
                                    <option value="10">10%</option>
                                    <option value="20">20%</option>
                                    <option value="30">30%</option>
                                    <option value="40">40%</option>
                                    <option value="50">50%</option>
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                    <option value="100">100%</option>
                                </select>
                            </label>
                            <label className="flex flex-col w-full md:w-1/3">
                                <span className="block mb-2">Lampada a scarica di gas (%)</span>
                                <select
                                    value={gasLamp}
                                    onChange={handleGasChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                >
                                    <option value="" disabled>Seleziona</option>
                                    <option value="0">0%</option>
                                    <option value="10">10%</option>
                                    <option value="20">20%</option>
                                    <option value="30">30%</option>
                                    <option value="40">40%</option>
                                    <option value="50">50%</option>
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                    <option value="100">100%</option>
                                </select>
                            </label>
                        </div>
                    </div>


                    {/* Bottone di Invio */}
                    <div className="flex justify-center">
                        {isLoading ? (
                            <div className="flex justify-center items-center mt-5">
                                <MutatingDots
                                    height="100"
                                    width="100"
                                    color="#2d7044"
                                    secondaryColor='#2d7044'
                                    radius='12.5'
                                    ariaLabel="mutating-dots-loading"
                                    visible={true}
                                />
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="mt-7 font-arial text-xl w-[30%] md:text-2xl md:w-[30%] lg:text-2xl lg:w-[20%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                            >
                                Carica
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );


}

export default BuildingFrom;