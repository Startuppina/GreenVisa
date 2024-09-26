import React, { useState, useEffect } from "react";
import axios from "axios";
import MessagePopUp from "./messagePopUp";
import { MutatingDots } from "react-loader-spinner";
import { useNavigate } from "react-router-dom";
import { useRecoveryContext } from "../provider/provider";

function BuildingFrom({ buildingData = 'empty', isEdit }) {
    const [buildingID, setBuildingID] = useState(buildingData.id || 0);
    const [name, setName] = useState(buildingData.name || "");
    const [address, setAddress] = useState(buildingData.address || "");
    const [usage, setUsage] = useState(buildingData.usage || "");
    const [year, setYear] = useState(buildingData.construction_year || "");
    const [location, setLocation] = useState(buildingData.location || "");
    const [renovation, setRenovation] = useState(buildingData.renovation || "");
    const [heating, setHeating] = useState(buildingData.heat_distribution || "");
    const [ventilation, setVentilation] = useState(buildingData.ventilation || "");
    const [energyControl, setEnergyControl] = useState(buildingData.energy_control || "");
    const [maintenance, setMaintenance] = useState(buildingData.maintenance || "");
    const [waterRecovery, setWaterRecovery] = useState(buildingData.water_recovery || "");
    const [electricityCounter, setElectricityCounter] = useState(buildingData.electricity_meter || "");
    const [electricityAnalyzer, setElectricityAnalyzer] = useState(buildingData.analyzers || "");
    const [lighting, setLighting] = useState(parseInt(buildingData.incandescent) || "");
    const [led, setLed] = useState(parseInt(buildingData.led) || "");
    const [gasLamp, setGasLamp] = useState(parseInt(buildingData.gas_lamp) || "");
    const [electricForniture, setElectricForniture] = useState(buildingData.electricity_forniture || "");
    const [autoLightingControlSystem, setAutoLightingControlSystem] = useState(buildingData.autolightingcontrolsystem || "");
    const [isLoading, setIsLoading] = useState(false);

    const [buttonPopup, setButtonPopup] = useState(false);
    const [messagePopup, setMessagePopup] = useState('');

    const { addBuildingTrigger, setAddBuildingTrigger, triggerRefresh } = useRecoveryContext();


    const navigate = useNavigate();

    const handleUpdateBuilding = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append('id', buildingID);
        formData.append('name', name);
        //formData.append('description', description);
        formData.append('address', address);
        formData.append('usage', usage);
        formData.append('location', location);
        formData.append('year', year);
        formData.append('renovation', renovation);
        formData.append('heating', heating);
        formData.append('ventilation', ventilation);
        formData.append('energyControl', energyControl);
        formData.append('maintenance', maintenance);
        formData.append('waterRecovery', waterRecovery);
        formData.append('electricityCounter', electricityCounter);
        formData.append('electricityAnalyzer', electricityAnalyzer);
        formData.append('autoLightingControlSystem', autoLightingControlSystem);
        formData.append('electricForniture', electricForniture);
        formData.append('lighting', lighting);
        formData.append('led', led);
        formData.append('gasLamp', gasLamp);
        //const totalScore = calculateTotalScore(formData);
        //formData.append('buildingScore', totalScore);

        console.log('Form data:', formData);

        try {
            const response = await axios.put('http://localhost:8080/api/edit-building', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                setTimeout(() => {
                    setMessagePopup(response.data.msg);
                    setButtonPopup(true);
                    setIsLoading(false);
                    // Reset dei campi e aggiornamento dello stato
                    triggerRefresh();

                    setMessagePopup("Edificio aggiornato con successo");
                    setButtonPopup(true);
                }, 3000); // Caricamento finto di 3 secondi

                return;
            } else {
                console.log('Error:', response.data.msg);
                setMessagePopup(response.data.msg);
                setButtonPopup(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.log('Error:', error);
            setMessagePopup(error.response?.data?.msg || "Errore durante l'aggiornamento");
            setButtonPopup(true);
            setIsLoading(false);
        }
    };


    const handleSubmit = async (e) => {

        if (isEdit) {
            handleUpdateBuilding(e);
            return;
        }
        e.preventDefault();

        setIsLoading(true);

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append('id', buildingID);
        formData.append('name', name);
        //formData.append('description', description);
        formData.append('address', address);
        formData.append('usage', usage);
        formData.append('location', location);
        formData.append('year', year);
        formData.append('renovation', renovation);
        formData.append('heating', heating);
        formData.append('ventilation', ventilation);
        formData.append('energyControl', energyControl);
        formData.append('maintenance', maintenance);
        formData.append('waterRecovery', waterRecovery);
        formData.append('electricityCounter', electricityCounter);
        formData.append('electricityAnalyzer', electricityAnalyzer);
        formData.append('autoLightingControlSystem', autoLightingControlSystem);
        formData.append('electricForniture', electricForniture);
        formData.append('lighting', lighting);
        formData.append('led', led);
        formData.append('gasLamp', gasLamp);


        //const totalScore = calculateTotalScore(formData);
        //formData.append('buildingScore', totalScore);

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
                    //setDescription("");
                    setAddress("");
                    setUsage("");
                    setYear("");
                    setLocation("");
                    setRenovation("");
                    setHeating("");
                    setVentilation("");
                    setEnergyControl("");
                    setMaintenance("");
                    setWaterRecovery("");
                    setElectricityCounter("");
                    setElectricityAnalyzer("");
                    setAutoLightingControlSystem("");
                    setElectricForniture("");
                    setLighting("");
                    setLed("");
                    setGasLamp("");
                    setAddBuildingTrigger(!addBuildingTrigger);

                    setMessagePopup("edificio aggiunto con successo");
                    setButtonPopup(true);
                }, 3000); // Caricamento finto di 3 secondi

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
    //const handleDescriptionChange = (e) => setDescription(e.target.value);
    const handleAddressChange = (e) => setAddress(e.target.value);
    const handleUsageChange = (e) => setUsage(e.target.value);
    const handleYearChange = (e) => setYear(e.target.value);
    const handleLocationChange = (e) => setLocation(e.target.value);
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
    const handleElectricFornitureChange = (e) => setElectricForniture(e.target.value);
    const handleAutoLightingControlSystemChange = (e) => setAutoLightingControlSystem(e.target.value);

    /*const scoring = {
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
    };*/


    const options = [
        {
            location: [
                "Emilia-Romagna",
                "Friuli-Venezia Giulia",
                "Lombardia",
                "Liguria",
                "Piemonte",
                "Trentino-Alto Adige",
                "Valle d'Aosta",
                "Veneto",
                "Lazio",
                "Marche",
                "Toscana",
                "Umbria",
                "Abruzzo",
                "Basilicata",
                "Campania",
                "Calabria",
                "Molise",
                "Puglia",
                "Sicilia",
                "Sardegna"
            ],
            construction_year: [
                "Prima del 1976",
                "Tra 1976 e 1991",
                "Tra 1991 e 2004",
                "dopo il 2004"
            ],
            renovation: [
                "Edile",
                "Impiantistico",
                "No"
            ],
            heat_distribution: [
                "Radiatori",
                "Ventilconvettori",
                "Impianto ad aria canalizzato",
                "Pavimento radiante"
            ],
            ventilation: [
                "Si",
                "Si, con recupero calore",
                "No"
            ],
            energy_control: [
                "Settimanale",
                "Mensile",
                "Annuale",
                "No"
            ],
            maintenance: [
                "Settimanale",
                "Mensile",
                "Annuale",
                "No"
            ],
            water_recovery: [
                "per l'irrigazione",
                "per la cassette di scarico",
                "altro",
                "No"
            ],
            electricity_meter: [
                "da 0 a 10 kW",
                "da 10 a 20 kW",
                "da 20 a 50 kW",
                "da 50 a 100 kW",
                "oltre i 100 kW"
            ],
            analyzers: [
                "Si",
                "No",
                "Non so"
            ],
            electric_forniture: [
                "elettrico - mix generico",
                "elettrico - 100% rinnovabili",
            ],
            automaticLightingControlSystems: [
                "Si",
                "No",
                "Non so"
            ]
        }
    ];


    return (
        <div className="flex justify-center">
            <MessagePopUp trigger={buttonPopup} setTrigger={setButtonPopup}>
                {messagePopup}
            </MessagePopUp>
            <div className="w-[98.5%] mx-auto md:m-4 rounded-2xl font-arial text-xl px-10 py-6 border bg-white border-gray-300 shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-6">{isEdit ? 'Modifica Edificio' : 'Aggiungi un nuovo Edificio'}</h2>
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
                            <span className="block mb-2">Locazione della struttura</span>
                            <select
                                value={location}
                                onChange={handleLocationChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona anno</option>
                                {options[0].location.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Anno di Costruzione */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Indirizzo</span>
                            <input
                                type="text"
                                value={address || ''}
                                onChange={handleAddressChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Destinazione d'uso</span>
                            <input
                                type="text"
                                value={usage || ''}
                                onChange={handleUsageChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            />
                        </label>
                    </div>

                    {/* Sezione Anno di Costruzione e Ristrutturazioni */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Anno di costruzione</span>
                            <select
                                value={year}
                                onChange={handleYearChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona anno</option>
                                {options[0].construction_year.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Ristrutturazioni (M)</span>
                            <select
                                value={renovation}
                                onChange={handleRenovationChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di ristrutturazione</option>
                                {options[0].renovation.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Riscaldamento e Ventilazione */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Diffusione calore (M)</span>
                            <select
                                value={heating}
                                onChange={handleHeatingChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona tipo di riscaldamento</option>
                                {options[0].heat_distribution.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Ventilazione meccanica controllata</span>
                            <select
                                value={ventilation}
                                onChange={handleVentilationChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].ventilation.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Controllo dei Consumie e Manutenzioni */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Controllo dei consumi</span>
                            <select
                                value={energyControl}
                                onChange={handleEnergyChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].energy_control.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Manutenzione periodica dell'impianto</span>
                            <select
                                value={maintenance}
                                onChange={handleMaintenanceChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].maintenance.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Recupero Acqua e Contatori */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Sistema di recupero acqua piovana (M)</span>
                            <select
                                value={waterRecovery}
                                onChange={handleWaterChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].water_recovery.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Contatore elettrico per l'utente</span>
                            <select
                                value={electricityCounter}
                                onChange={handleElectricChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].electricity_meter.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sezione Fornitura Elettrica e Corpi Illuminanti */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Fornitura elettrica dell'edificio</span>
                            <select
                                value={electricForniture}
                                onChange={handleElectricFornitureChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].electric_forniture.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-center mb-4">Corpi illuminanti (inserisci il numero di lampadine)</h3>
                        <div className="flex flex-col md:flex-row md:gap-4">
                            <label className="flex flex-col w-full md:w-1/3">
                                <div className="flex flex-col items-center space-y-4 mb-2">
                                    <div className="text-xl text-gray-900">Lampadine a incandescenza</div>
                                    <input
                                        type="text"
                                        value={lighting}
                                        onChange={handleLightingChange}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col w-full md:w-1/3">
                                <div className="flex flex-col items-center space-y-4 mb-2">
                                    <div className="text-xl text-gray-900">Lampadine a led</div>
                                    <input
                                        type="text"
                                        value={led}
                                        onChange={handleLedChange}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col w-full md:w-1/3">
                                <div className="flex flex-col items-center space-y-4 mb-2">
                                    <div className="text-xl text-gray-900">Lampadine a scarica di gas</div>
                                    <input
                                        type="text"
                                        value={gasLamp}
                                        onChange={handleGasChange}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Sezione Sistemi di Controllo */}
                    <div className="flex flex-col md:flex-row md:gap-4 mb-6">
                        <label className="flex flex-col w-full md:w-1/2">
                            <span className="block mb-2">Sistemi di regolazione e controllo automatici dei corpi illuminanti</span>
                            <select
                                value={autoLightingControlSystem}
                                onChange={handleAutoLightingControlSystemChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-xl rounded-lg block w-full p-2.5"
                            >
                                <option value="" disabled>Seleziona</option>
                                {options[0].automaticLightingControlSystems.map((cat, index) => (
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
                                {options[0].analyzers.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Bottone di Invio */}
                    <div className="flex justify-center gap-2">
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