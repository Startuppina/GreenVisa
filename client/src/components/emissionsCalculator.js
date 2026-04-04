//FILE PER IL CALCOLO DELLE EMSSIONI DI UN EDIFICIO
import axios from "axios";

export async function EmissionsCalculator(buildingID) {
    let buildingData = {};
    let plantData = {};
    let solarData = {};
    let photoData = {};
    let consumptionsData = {};
    let climateAlteringGases = {};

    let buildingLocation = "";

    const regionCategories = {
        nord: [
            "Emilia-Romagna",
            "Friuli-Venezia Giulia",
            "Lombardia",
            "Liguria",
            "Piemonte",
            "Trentino-Alto Adige",
            "Valle d'Aosta",
            "Veneto"
        ],
        centro: [
            "Lazio",
            "Marche",
            "Toscana",
            "Umbria"
        ],
        sud: [
            "Abruzzo",
            "Basilicata",
            "Campania",
            "Calabria",
            "Molise",
            "Puglia"
        ],
        sicilia: [
            "Sicilia"
        ],
        sardegna: [
            "Sardegna"
        ]
    };


    //PHASE 1: FETCH DATA FROM THE SERVER
    //console.log("Building ID:", buildingID);

    try {
        const response = await axios.get(`/api/${buildingID}/fetch-emissions-data`, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        });

        if (response.status === 200) {
            buildingData = response.data.buildingData;
            plantData = response.data.plants;
            solarData = response.data.solaData;
            photoData = response.data.photoData;
            consumptionsData = response.data.consumptionsData;
            climateAlteringGases = response.data.refrigerantGases;
            //console.log("BuildingData:", buildingData);
            //console.log("PlantData:", plantData);
            //console.log("SolaData:", solarData);
            //console.log("PhotoData:", photoData);
            //console.log("ConsumptionsData:", consumptionsData);
            //console.log("ClimateAlteringGases:", climateAlteringGases);
        } else if (response.status === 400) {
            const message = response.data.error || "Errore sconosciuto.";
            return { success: false, message };  // Ritorna l'errore specifico
        }

    } catch (error) {
        if (error.response) {
            const statusCode = error.response.status;
            const message = error.response.data.error || `Errore codice ${statusCode}`;
            return { success: false, message };
        } else if (error.request) {
            console.error("Errore di rete o nessuna risposta ricevuta:", error.request);
            return { success: false, message: "Errore di rete. Nessuna risposta dal server." };
        } else {
            console.error("Errore durante il calcolo delle emissioni:", error.message);
            return { success: false, message: "Errore durante il calcolo delle emissioni." };
        }
    }

    const region = buildingData.location.trim().toLowerCase();

    for (const [regionLocation, regions] of Object.entries(regionCategories)) {
        if (regions.map(r => r.toLowerCase()).includes(region)) {
            buildingLocation = regionLocation;
            break;
        }
    }

    //PHASE 2: CALCULATE SOLAR AND PHOTO POTENTIALS

    const photoEmissionFactors = {
        "nord": 1004.48,
        "centro": 1125.66,
        "sud": 1172.38,
        "sicilia": 1248.30,
        "sardegna": 1213.26
    };

    const solarsEmissionFactors = {
        "nord": 569.9475,
        "centro": 653.715,
        "sud": 699.705,
        "sicilia": 770.3325,
        "sardegna": 748.15875
    };

    let ifSolar = 0; //check if the building has solar panels
    let ifPhotovoltaic = 0; //check if the building has photovoltaic panels
    if (solarData.count2 > 0) {
        ifSolar = 1;
    }

    if (photoData.count > 0) {
        ifPhotovoltaic = 1;
    }

    //console.log("ifSolar:", ifSolar);
    //console.log("ifPhotovoltaic:", ifPhotovoltaic);

    //calculation for solars
    const solarCalculation = Math.round(ifSolar * solarData.totalIstalledArea * solarsEmissionFactors[buildingLocation]);
    //console.log(solarData.totalIstalledArea);
    //console.log("solarCalculation:", solarCalculation);

    const photoCalculation = Math.round(ifPhotovoltaic * photoData.totalPower * photoEmissionFactors[buildingLocation]);
    //console.log(photoData.totalPower);
    //console.log("photoCalculation:", photoCalculation);

    //PHASE 3: CONVERSIONE IN TEP DI OGNI FONTE O VETTORE ENERGETICO. TEP CONVERSION
    // Fattori di conversione [tep/x]
    const conversionFactors = {
        "Gas Naturale (Metano)": 0.000836, // Sm³
        "GPL": 0.616,            // mc
        "Gasolio": 0.860,        // mc
        "Olio combustibile": 0.980, // t
        "Pellet": 0.40,          // t
        "Cippato di legna": 0.20, // t
        "Biogas": 0.00052,       // Sm³
        "elettricitaRete": 0.000187, // kWh
        "fotovoltaico": 0.000187, // kWh
        "Teleriscaldamento": 0.000103, // kWh TELERISCALDAMENTO E' ENERGIA TERMICA?
        "pannelliSolariTermici": 0.000103 // kWh
    };

    // Emissioni in tonnellate di CO2 per tep
    const emissionsCO2 = {
        "Gas Naturale (Metano)": 2.35885167464115, // tons CO2 eq/tep
        "GPL": 2.74909090909091,         // tons CO2 eq/tep
        "Gasolio": 2.92592592592593,     // tons CO2 eq/tep
        "Olio combustibile": 3.20816326530612, // tons CO2 eq/tep
        "Pellet": 0.0,          // tons CO2 eq/tep
        "Cippato di legna": 0.0,           // tons CO2 eq/tep
        "Biogas": 0.0,          // tons CO2 eq/tep
        "elettricitaReteNoRinnovabile": 1.41711229946524, // tons CO2 eq/tep (no % rinnovabili)
        "elettricitaRinnovabile": 0.0, // tons CO2 eq/tep (100% rinnovabili)
        "Teleriscaldamento": 2.75097087378641, // tons CO2 eq/tep
        "pannelliSolariTermici": 0.0, // tons CO2 eq/tep
        "fotovoltaico": 0.0  // tons CO2 eq/tep
    };

    //conversione TEP per le fonti non rinnovabili ed elettricità generica + calcolo emissioni CO2 per ogni fonte
    const electrcityType = buildingData.electricity_forniture; //elettrico mix generico oppure elettrico 100% rinnovabili
    //console.log("electricity forniture:", electrcityType);



    let CO2SourceEmissions = {};
    let sourceTEP = {};
    //console.log("consumptionsData:", consumptionsData[1].energy_source);
    for (let i = 0; i < consumptionsData.length; i++) {
        if (consumptionsData[i].energy_source === "Elettricità") {
            //console.log("Energy source at index", i, ":", consumptionsData[i].energy_source);

            if (electrcityType === "Elettrico - 100% rinnovabili") {
                sourceTEP[electrcityType] = (consumptionsData[i].consumption * conversionFactors["elettricitaRete"]);
                CO2SourceEmissions[electrcityType] = (sourceTEP[electrcityType] * emissionsCO2["elettricitaRinnovabile"]);
            } else if (electrcityType === "Elettrico - mix generico") {
                sourceTEP[electrcityType] = (consumptionsData[i].consumption * conversionFactors["elettricitaRete"]);
                CO2SourceEmissions[electrcityType] = (sourceTEP[electrcityType] * emissionsCO2["elettricitaReteNoRinnovabile"]);
            }
        } else {
            sourceTEP[consumptionsData[i].energy_source] = (consumptionsData[i].consumption * conversionFactors[consumptionsData[i].energy_source]);
            CO2SourceEmissions[consumptionsData[i].energy_source] = (sourceTEP[consumptionsData[i].energy_source] * emissionsCO2[consumptionsData[i].energy_source]);
        }
    }

    //conversione TEP per le fonti rinnovabili + calcolo emissioni CO2 per ogni fonte rinnovabile
    if (solarData) {
        sourceTEP["pannelliSolariTermici"] = (solarCalculation * conversionFactors["pannelliSolariTermici"]);
        CO2SourceEmissions["pannelliSolariTermici"] = (sourceTEP["pannelliSolariTermici"] * emissionsCO2["pannelliSolariTermici"]);
    }
    if (photoData) {
        sourceTEP["fotovoltaico"] = (photoCalculation * conversionFactors["fotovoltaico"]);
        CO2SourceEmissions["fotovoltaico"] = (sourceTEP["fotovoltaico"] * emissionsCO2["fotovoltaico"]);
    }

    //--------------- Calcolo delle emissioni di co2 per i gas refrigeranti ----------------

    const refrigerantGasesGWPS = {
        "Idrogeno verde - zero emissioni": 0.0,
        "R1233ZD": 3.88,
        "R1234YF": 0.5,
        "R1234ZE": 1.37,
        "R125A": 3500,
        "R134A": 1430,
        "R23": 14800,
        "R236FA": 9810,
        "R245FA": 1030,
        "R290": 0.02,
        "R32": 675,
        "R404A": 3922,
        "R407A": 2107,
        "R407C": 1774,
        "R407F": 1825,
        "R407H": 1495,
        "R408A": 3152,
        "R409A": 1909,
        "R410A": 2088,
        "R413A": 2095,
        "R417A": 2346,
        "R422A": 3143,
        "R422B": 2526,
        "R422D": 2729,
        "R427A": 2138,
        "R434A": 3234,
        "R437A": 1805,
        "R438A": 2264,
        "R448A": 1386,
        "R449A": 1396,
        "R450A": 601,
        "R452A": 2139,
        "R452B": 697,
        "R454A": 237,
        "R454B": 465,
        "R454C": 146,
        "R455A": 146,
        "R456A": 685,
        "R507": 3985,
        "R508B": 13396,
        "R513A": 629,
        "R515B": 288,
        "R600a": 0,
        "R744": 1
    }

    let climateAlteringGasesCO2 = {};
    for (let i = 0; i < climateAlteringGases.length; i++) {
        climateAlteringGasesCO2[climateAlteringGases[i].gas_type] = (climateAlteringGases[i].quantity_kg * refrigerantGasesGWPS[climateAlteringGases[i].gas_type]) / 1000;
    }
    console.log("climateAlteringGases:", climateAlteringGases);
    console.log("refrigerantCO2:", climateAlteringGasesCO2);
    const totalClimateAlteringGasesCO2 = Object.values(climateAlteringGasesCO2).reduce((a, b) => a + b, 0);
    console.log("totalRefCO2:", totalClimateAlteringGasesCO2);


    //total CO2 emissions
    const totalCO2Emissions = Object.values(CO2SourceEmissions).reduce((a, b) => a + b, 0) + totalClimateAlteringGasesCO2;
    //console.log("sourceTEP:", sourceTEP);
    //console.log("CO2 emissions:", CO2SourceEmissions);
    console.log("totalCO2Emissions:", totalCO2Emissions);

    //PHASE3: source marks 
    const sourceMarks = {
        "Gas Naturale (Metano)": 3,
        "GPL": 2,
        "Gasolio": 1,
        "Olio combustibile": 0,
        "Pellet": 8,
        "Cippato di legna": 9,
        "Biogas": 8,
        "elettricitaRete": 6,
        "elettricitaRinnovabile": 10,
        "fotovoltaico": 10,
        "Teleriscaldamento": 5,
        "pannelliSolariTermici": 10
    };

    let marks = {};

    for (let i = 0; i < consumptionsData.length; i++) {
        if (consumptionsData[i].energy_source === "Elettricità") {
            if (electrcityType === "Elettrico - 100% rinnovabili") {
                marks[electrcityType] = sourceMarks["elettricitaRinnovabile"];
            } else if (electrcityType === "Elettrico - mix generico") {
                marks[electrcityType] = sourceMarks["elettricitaRete"];
            }
        } else {
            marks[consumptionsData[i].energy_source] = sourceMarks[consumptionsData[i].energy_source];
        }
    }
    if (solarData) {
        marks["pannelliSolariTermici"] = sourceMarks["pannelliSolariTermici"];
    }
    if (photoData) {
        marks["fotovoltaico"] = sourceMarks["fotovoltaico"];
    }
    //console.log("marks:", marks);

    //PAHSE4: correction factors
    const totalCorrectionFactors = {} //ogni volta che viene generato un nuovo fattore di correzione per una fonte la aggiungiamo per la somma

    const correctionFactors = { //sfasamento?
        "VMCheatRecovery": 1.01, // nel caso in cui VMC con recuper calore
        "plantMaintenanceWeekly": 1.02, // manutenzione periodica dell'impianto settimanale
        "plantMaintenanceMonthly": 1.01, // manutenzione periodica dell'impianto mensile
        "incandescent": 0.95, // luminosità incandescente
        "led": 1.02, // luminosità LED
        "gasLamp": 1.01, // luminosità gas lamp
        "autoLightingControlSystem": 1.01, // sistema di controllo di illuminazione automatica
        "analyzers": 1.01, // analizzatori di elettricità
        "cogen/trigenTermic": 1.1, // cogen/trigen termico
        "cogen/trigenMicro": 1.15, // cogen/trigen microturbina
        "cogen/trigenFuelCell": 1.2,    // cogen/trigen fotovoltaico
        "heatPumpHydronic": 1.1, // pompa di calore idronica
        "electricKettle": 0.9, // bollitore elettrico
    }

    // oggetto per i fattori di correzione associati ai combustibili su VMC
    let correctionFactorToSourcesVMC = {};

    if (buildingData.ventilation === "Si, con recupero calore") {
        for (let i = 0; i < plantData.length; i++) {
            if (plantData[i].service_type === "Riscaldamento") {
                let energySource = plantData[i].fuel_type; // recupera il combustibile
                //console.log("energySource:", energySource);
                if (energySource === "Elettricità") {
                    energySource = electrcityType;
                } else {
                    energySource = plantData[i].fuel_type;
                }
                const correctionFactor = correctionFactors["VMCheatRecovery"]; // fattore di correzione VMC

                // Associa il fattore di correzione al combustibile specifico
                // Se esiste già, non aggiunge il nuovo fattore
                if (correctionFactorToSourcesVMC[energySource]) {
                    continue;
                } else {
                    correctionFactorToSourcesVMC[energySource] = correctionFactor;
                    totalCorrectionFactors[energySource] = correctionFactor;
                }
            }
        }
    }
    //console.log("correctionFactorToSourcesVMC:", correctionFactorToSourcesVMC);


    // Oggetto per i fattori di correzione associati alla manutenzi     settimanale o mensile
    let correctionFactorToSourcesMaintenance = {};

    // Loop attraverso gli impianti
    for (let i = 0; i < plantData.length; i++) {
        // Controlla la frequenza della manutenzione dell'edificio
        if (plantData[i].service_type === "Riscaldamento" || plantData[i].service_type === "Acqua calda sanitaria") {
            let energySource = plantData[i].fuel_type; // Recupera il combustibile
            if (energySource === "Elettricità") {
                energySource = electrcityType;
            } else {
                energySource = plantData[i].fuel_type;
            }

            let correctionFactor; // Definisce il fattore di correzione in base alla manutenzione

            // Verifica la frequenza della manutenzione
            if (buildingData.maintenance === "Mensile") {
                correctionFactor = correctionFactors["plantMaintenanceMonthly"];
            } else if (buildingData.maintenance === "Settimanale") {
                correctionFactor = correctionFactors["plantMaintenanceWeekly"];
            }

            // Se il fattore di correzione è definito, associa il combustibile al fattore di correzione
            if (correctionFactor) {
                if (correctionFactorToSourcesMaintenance[energySource]) {
                    continue;
                } else {
                    correctionFactorToSourcesMaintenance[energySource] = correctionFactor;
                    if (totalCorrectionFactors[energySource]) {
                        totalCorrectionFactors[energySource] *= correctionFactor; // se esiste, somma il fattore alla fonte esistente
                    } else {
                        totalCorrectionFactors[energySource] = correctionFactor; // se non esiste, crea la fonte con il primo fattore
                    }
                }
            }
        }
    }
    //console.log("correctionFactorToSourcesMaintenance:", correctionFactorToSourcesMaintenance);


    // Fattori di correzione corpi illuminanti

    // totale lampadine
    const totalLamps = buildingData.incandescent + buildingData.led + buildingData.gas_lamp;

    // numero di lampadine a incandescenza frazionate
    const numIncandescents = (buildingData.incandescent / totalLamps) * 100 / 100;

    // numero di lampadine a led frazionate
    const numLed = (buildingData.led / totalLamps) * 100 / 100;

    // numero di lampadine a gas frazionate
    const numGasLamp = (buildingData.gas_lamp / totalLamps) * 100 / 100;

    // somma delle lampadine frazionate (arrotondata a due decimali)
    const totalFractedLamps = (numIncandescents + numLed + numGasLamp) * 100 / 100;

    //console.log("numIncandescents:", numIncandescents);
    //console.log("numLed:", numLed);
    //console.log("numGasLamp:", numGasLamp);
    //console.log("totalFractedLamps:", totalFractedLamps);

    // numero di lampadine a incandescenza in percentuale (arrotondato)
    const percentIncandescents = Math.round(numIncandescents * 100);

    // numero di lampadine a led in percentuale (arrotondato)
    const percentLed = Math.round(numLed * 100);

    // numero di lampadine a gas in percentuale (arrotondato)
    const percentGasLamp = Math.round(numGasLamp * 100);

    // somma delle percentuali delle lampadine
    const totalFractedLampsPercentage = percentIncandescents + percentLed + percentGasLamp;

    //console.log("percentIncandescents:", percentIncandescents);
    //console.log("percentLed:", percentLed);
    //console.log("percentGasLamp:", percentGasLamp);
    //console.log("totalLampsPercentage:", totalFractedLampsPercentage);


    // applicazione dei fattori di correzione per ogni tipo di lampadina (arrotondati)

    // lampadine a incandescenza
    const incandescentCorrection = Math.round((totalFractedLamps * numIncandescents) * correctionFactors["incandescent"] * 100);

    // lampadine a led
    const ledCorrection = Math.round((totalFractedLamps * numLed) * correctionFactors["led"] * 100);

    // lampadine a gas  
    const gasLampCorrection = Math.round((totalFractedLamps * numGasLamp) * correctionFactors["gasLamp"] * 100);

    // somma dei fattori di correzione (arrotondato)
    const totalLightingCorrection = Math.round(incandescentCorrection + ledCorrection + gasLampCorrection);

    //console.log("incandescentCorrection:", incandescentCorrection);
    //console.log("ledCorrection:", ledCorrection);
    //console.log("gasLampCorrection:", gasLampCorrection);
    //console.log("totalCorrection:", totalLightingCorrection);



    // applicazione del fattore correttivo al tipo di elettricita e al fotovoltaico
    let sourceToApplyLightCorrection = {};

    sourceToApplyLightCorrection[electrcityType] = totalLightingCorrection / 100; //o per rinovabili che per mix energetico
    if (totalCorrectionFactors[electrcityType]) {
        totalCorrectionFactors[electrcityType] *= totalLightingCorrection / 100;
    } else {
        totalCorrectionFactors[electrcityType] = totalLightingCorrection / 100;
    }
    if (photoData) {
        sourceToApplyLightCorrection["fotovoltaico"] = totalLightingCorrection / 100;
        if (totalCorrectionFactors["fotovoltaico"]) {
            totalCorrectionFactors["fotovoltaico"] *= totalLightingCorrection / 100;
        } else {
            totalCorrectionFactors["fotovoltaico"] = totalLightingCorrection / 100;
        }
    }
    //console.log("sourceToApplyLightCorrection:", sourceToApplyLightCorrection);

    // fattori di correzione sistemi di regolazione e controllo automatici dei corpi illuminanti
    let sourceToApplyAutoCorrection = {};

    if (buildingData.autolightingcontrolsystem === "Si") {
        sourceToApplyAutoCorrection[electrcityType] = correctionFactors["autoLightingControlSystem"]; //o per rinovabili che per mix energetico
        if (totalCorrectionFactors[electrcityType]) {
            totalCorrectionFactors[electrcityType] *= correctionFactors["autoLightingControlSystem"];
        } else {
            totalCorrectionFactors[electrcityType] = correctionFactors["autoLightingControlSystem"];
        }
        if (photoData) {
            sourceToApplyAutoCorrection["fotovoltaico"] = correctionFactors["autoLightingControlSystem"];
            if (totalCorrectionFactors["fotovoltaico"]) {
                totalCorrectionFactors["fotovoltaico"] *= correctionFactors["autoLightingControlSystem"];
            } else {
                totalCorrectionFactors["fotovoltaico"] = correctionFactors["autoLightingControlSystem"];
            }
        }
    }
    //console.log("sourceToApplyAutoCorrection:", sourceToApplyAutoCorrection);

    // fattori di correzione analizzatori di rete per controllo dei consumi elettrici generali
    let sourceToApplyAnalyzerCorrection = {};
    if (buildingData.analyzers === "Si") {
        sourceToApplyAnalyzerCorrection[electrcityType] = correctionFactors["analyzers"]; //o per rinovabili che per mix energetico
        if (totalCorrectionFactors[electrcityType]) {
            totalCorrectionFactors[electrcityType] *= correctionFactors["analyzers"];
        } else {
            totalCorrectionFactors[electrcityType] = correctionFactors["analyzers"];
        }
        if (photoData) {
            sourceToApplyAnalyzerCorrection["fotovoltaico"] = correctionFactors["analyzers"];
            if (totalCorrectionFactors["fotovoltaico"]) {
                totalCorrectionFactors["fotovoltaico"] *= correctionFactors["analyzers"];
            } else {
                totalCorrectionFactors["fotovoltaico"] = correctionFactors["analyzers"];
            }
        }
    }
    //console.log("sourceToApplyAnalyzerCorrection:", sourceToApplyAnalyzerCorrection);

    // fattori di correzione corgeneratore/trigeneratore (se presente un impianto centralizzato)
    let cogenTrigenCorrectionFactor = {};
    for (let i = 0; i < plantData.length; i++) { //si possono avere piu impianti centralizzati? se si bisogna fare una media tra i fattori di correzione applicati
        if (plantData[i].plant_type === "Centralizzato" && plantData[i].generator_type.includes("Cogeneratore o Trigenerazione")) {
            if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Motore endotermico") {
                if (plantData[i].fuel_type === "Elettricità") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenTermic"];
                    if (totalCorrectionFactors[electrcityType]) {
                        totalCorrectionFactors[electrcityType] *= correctionFactors["cogen/trigenTermic"];
                    } else {
                        totalCorrectionFactors[electrcityType] = correctionFactors["cogen/trigenTermic"];
                    }
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenTermic"];
                    if (totalCorrectionFactors[plantData[i].fuel_type]) {
                        totalCorrectionFactors[plantData[i].fuel_type] *= correctionFactors["cogen/trigenTermic"];
                    } else {
                        totalCorrectionFactors[plantData[i].fuel_type] = correctionFactors["cogen/trigenTermic"];
                    }
                }
            } else if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Microturbina") {
                if (plantData[i].fuel_type === "Elettricità") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenMicro"];
                    if (totalCorrectionFactors[electrcityType]) {
                        totalCorrectionFactors[electrcityType] *= correctionFactors["cogen/trigenMicro"];
                    } else {
                        totalCorrectionFactors[electrcityType] = correctionFactors["cogen/trigenMicro"];
                    }
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenMicro"];
                    if (totalCorrectionFactors[plantData[i].fuel_type]) {
                        totalCorrectionFactors[plantData[i].fuel_type] *= correctionFactors["cogen/trigenMicro"];
                    } else {
                        totalCorrectionFactors[plantData[i].fuel_type] = correctionFactors["cogen/trigenMicro"];
                    }
                }
            } else if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Fuel Cell") {
                if (plantData[i].fuel_type === "Elettricità") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenFuelCell"];
                    if (totalCorrectionFactors[electrcityType]) {
                        totalCorrectionFactors[electrcityType] *= correctionFactors["cogen/trigenFuelCell"];
                    } else {
                        totalCorrectionFactors[electrcityType] = correctionFactors["cogen/trigenFuelCell"];
                    }
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenFuelCell"];
                    if (totalCorrectionFactors[plantData[i].fuel_type]) {
                        totalCorrectionFactors[plantData[i].fuel_type] *= correctionFactors["cogen/trigenFuelCell"];
                    } else {
                        totalCorrectionFactors[plantData[i].fuel_type] = correctionFactors["cogen/trigenFuelCell"];
                    }
                }
            }
        }
    }
    //console.log("cogenTrigenCorrectionFactor:", cogenTrigenCorrectionFactor);

    //PHASE5: correction factors total for each energy source

    //correzione dei voti per ogni fonte di elettricita'
    //console.log("marks:", marks);
    //console.log("totalCorrectionFactors:", totalCorrectionFactors);

    for (let key in marks) {
        // Controlla se esiste un fattore di correzione per questa fonte di energia
        if (totalCorrectionFactors[key]) {
            // Somma il valore del mark con il corrispondente fattore di correzione
            marks[key] *= totalCorrectionFactors[key];
        }
    }

    // Visualizza i valori corretti
    //console.log("Corrected marks:", marks);

    //total TEP
    const totalTEP = Object.values(sourceTEP).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    //console.log("Total TEP:", totalTEP);

    //tep frazionato per ogni fonte di elettricita'
    const tepPercentage = {};
    for (let key in sourceTEP) {
        let percentage = (sourceTEP[key] / totalTEP);
        tepPercentage[key] = percentage;
    }
    //console.log("tepPercentage:", tepPercentage);

    //totale frazioni
    const totalPercentage = Object.values(tepPercentage).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    //console.log("Total percentage:", totalPercentage);

    //voti frazionati per ogni fonte di elettricita'
    const votesPercentage = {};
    for (let key in marks) {
        votesPercentage[key] = marks[key] * tepPercentage[key];
    }
    //console.log("votesPercentage:", votesPercentage);

    //il voto finale e' dato dalla somma dei voti frazionati
    const finalVote = Math.ceil(Object.values(votesPercentage).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    //console.log("Final vote:", finalVote);

    //EMISSIONE PER SUPERFICIE [tonsCO2/mq]
    const areaCO2Emissions = totalCO2Emissions / buildingData.area;
    //console.log("Area CO2 emissions:", areaCO2Emissions);

    //aggiornamento dell'edificio per aggiungere il voto finale e le emissioni calcolate
    try {
        const response = await axios.put(`/api/insert-results/${buildingID}`, { finalVote, totalCO2Emissions, areaCO2Emissions }, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        });
        if (response.status === 200) {
            return {
                success: true,
            }
        }
    } catch (error) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.msg,
            };
        }
        return {
            success: false,
            message: error.message || "Errore durante il calcolo delle emissioni.",
        };
    }

}





