//FILE PER IL CALCOLO DELLE EMSSIONI DI UN EDIFICIO
import axios from "axios";

export async function EmissionsCalculator(buildingID) {
    let buildingData = {};
    let plantData = {};
    let solarData = {};
    let photoData = {};
    let consumptionsData = {};

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
    const token = localStorage.getItem("token");
    console.log("Token:", token);
    console.log("Building ID:", buildingID);

    try {
        const response = await axios.get(`http://localhost:8080/api/${buildingID}/fetch-emissions-data`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            buildingData = response.data.buildingData;
            plantData = response.data.plants;
            solarData = response.data.solaData;
            photoData = response.data.photoData;
            consumptionsData = response.data.consumptionsData;
            console.log("BuildingData:", buildingData);
            console.log("PlantData:", plantData);
            console.log("SolaData:", solarData);
            console.log("PhotoData:", photoData);
            console.log("ConsumptionsData:", consumptionsData);
        }

    } catch (error) {
        console.log(error);
    }

    const region = buildingData.location.trim().toLowerCase();

    for (const [category, regions] of Object.entries(regionCategories)) {
        if (regions.map(r => r.toLowerCase()).includes(region)) {
            buildingLocation = category;
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

    console.log("ifSolar:", ifSolar);
    console.log("ifPhotovoltaic:", ifPhotovoltaic);

    //calculation for solars
    const solarCalculation = Math.round(ifSolar * solarData.totalIstalledArea * solarsEmissionFactors[buildingLocation]);
    console.log(solarData.totalIstalledArea);
    console.log("solarCalculation:", solarCalculation);

    const photoCalculation = Math.round(ifPhotovoltaic * photoData.totalPower * photoEmissionFactors[buildingLocation]);
    console.log(photoData.totalPower);
    console.log("photoCalculation:", photoCalculation);

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
        "elettricitaRete": 0.00025, // kWh
        "elettricitaFotovoltaico": 0.00025, // kWh
        "Teleriscaldamento": 0.000187, // kWh TELERISCALDAMENTO E' ENERGIA TERMICA?
        "pannelliSolariTermici": 0.000187 // kWh
    };

    // Emissioni in tonnellate di CO2 per tep
    const emissionsCO2 = {
        "Gas Naturale (Metano)": 2.35885, // tons CO2 eq/tep
        "GPL": 2.74909,         // tons CO2 eq/tep
        "Gasolio": 2.92593,     // tons CO2 eq/tep
        "Olio combustibile": 3.20816, // tons CO2 eq/tep
        "Pellet": 0.0,          // tons CO2 eq/tep
        "Cippato di legna": 0.0,           // tons CO2 eq/tep
        "Biogas": 0.0,          // tons CO2 eq/tep
        "elettricitaRete": 1.06, // tons CO2 eq/tep (no % rinnovabili)
        "elettricitaRinnovabile": 0.0, // tons CO2 eq/tep (100% rinnovabili)
        "Teleriscaldamento": 1.52406, // tons CO2 eq/tep
        "pannelliSolariTermici": 0.0, // tons CO2 eq/tep
        "elettricitaFotovoltaico": 0.0  // tons CO2 eq/tep
    };

    //conversione TEP per le fonti non rinnovabili ed elettricità generica + calcolo emissioni CO2 per ogni fonte
    const electrcityType = buildingData.electricity_forniture; //elettrico mix generico oppure elettrico 100% rinnovabili
    console.log("electricity forniture:", electrcityType);



    let CO2SourceEmissions = [];
    console.log("consumptionsData:", consumptionsData[1].energy_source);
    for (let i = 0; i < consumptionsData.length; i++) {
        if (consumptionsData[i].energy_source === "Elettricità") {
            console.log("Energy source at index", i, ":", consumptionsData[i].energy_source);

            if (electrcityType === "elettrico - 100% rinnovabili") {
                CO2SourceEmissions.push(consumptionsData[i].consumption * conversionFactors["elettricitaFotovoltaico"] * emissionsCO2["elettricitaRinnovabile"]);
            } else if (electrcityType === "elettrico - mix generico") {
                CO2SourceEmissions.push(consumptionsData[i].consumption * conversionFactors["elettricitaRete"] * emissionsCO2["elettricitaRete"]);
            }
        } else {
            CO2SourceEmissions.push(consumptionsData[i].consumption * conversionFactors[consumptionsData[i].energy_source] * emissionsCO2[consumptionsData[i].energy_source]);
        }
    }

    console.log("Source CO2 emissions:", CO2SourceEmissions);


    //conversione TEP per le fonti rinnovabili + calcolo emissioni CO2 per ogni fonte rinnovabile
    const solarEmissions = solarCalculation * conversionFactors["pannelliSolariTermici"] * emissionsCO2["pannelliSolariTermici"];
    const photoEmissions = photoCalculation * conversionFactors["elettricitaFotovoltaico"] * emissionsCO2["elettricitaFotovoltaico"]; //devono essere arrotondati?
    console.log("solar CO2 emissions:", solarEmissions);
    console.log("photo CO2 emissions:", photoEmissions);

    //total CO2 emissions
    const totalCO2Emissions = solarEmissions + photoEmissions + CO2SourceEmissions.reduce((a, b) => a + b, 0);
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
        "elettricitaRete": 7,
        "elettricitaFotovoltaico": 10,
        "Teleriscaldamento": 6,
        "pannelliSolariTermici": 10
    };

    let marks = [];

    for (let i = 0; i < consumptionsData.length; i++) {
        if (consumptionsData[i].energy_source === "Elettricità") {
            if (electrcityType === "elettrico - 100% rinnovabili") {
                marks.push(sourceMarks["elettricitaFotovoltaico"]);
            } else if (electrcityType === "elettrico - mix generico") {
                marks.push(sourceMarks["elettricitaRete"]);
            }
        } else {
            marks.push(sourceMarks[consumptionsData[i].energy_source]);

        }
    }
    marks.push(sourceMarks["pannelliSolariTermici"]);
    marks.push(sourceMarks["elettricitaFotovoltaico"]);
    console.log("marks:", marks);

    //PAHSE4: correction factors

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
        "electricKettle": 1.1, // bollitore elettrico
    }

    // oggetto per i fattori di correzione associati ai combustibili su VMC
    let correctionFactorToSourcesVMC = {};

    if (buildingData.ventilation === "Si, con recupero calore") {
        for (let i = 0; i < plantData.length; i++) {
            if (plantData[i].service_type === "Riscaldamento") {
                let energySource = plantData[i].fuel_type; // recupera il combustibile
                console.log("energySource:", energySource);
                if (energySource === "Elettrico") {
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
                }
            }
        }
    }

    console.log("correctionFactorToSourcesVMC:", correctionFactorToSourcesVMC);


    // Oggetto per i fattori di correzione associati alla manutenzione dei combustibili settimanale o mensile
    let correctionFactorToSourcesMaintenance = {};

    // Loop attraverso gli impianti
    for (let i = 0; i < plantData.length; i++) {
        // Controlla la frequenza della manutenzione dell'edificio
        if (plantData[i].service_type === "Riscaldamento" || plantData[i].service_type === "Acqua calda sanitaria") {
            let energySource = plantData[i].fuel_type; // Recupera il combustibile
            if (energySource === "Elettrico") {
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
                }
            }
        }
    }

    console.log("correctionFactorToSourcesMaintenance:", correctionFactorToSourcesMaintenance);


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

    console.log("numIncandescents:", numIncandescents);
    console.log("numLed:", numLed);
    console.log("numGasLamp:", numGasLamp);
    console.log("totalFractedLamps:", totalFractedLamps);

    // numero di lampadine a incandescenza in percentuale (arrotondato)
    const percentIncandescents = Math.round(numIncandescents * 100);

    // numero di lampadine a led in percentuale (arrotondato)
    const percentLed = Math.round(numLed * 100);

    // numero di lampadine a gas in percentuale (arrotondato)
    const percentGasLamp = Math.round(numGasLamp * 100);

    // somma delle percentuali delle lampadine
    const totalFractedLampsPercentage = percentIncandescents + percentLed + percentGasLamp;

    console.log("percentIncandescents:", percentIncandescents);
    console.log("percentLed:", percentLed);
    console.log("percentGasLamp:", percentGasLamp);
    console.log("totalLampsPercentage:", totalFractedLampsPercentage);


    // applicazione dei fattori di correzione per ogni tipo di lampadina (arrotondati)

    // lampadine a incandescenza
    const incandescentCorrection = Math.round((totalFractedLamps * numIncandescents) * correctionFactors["incandescent"] * 100);

    // lampadine a led
    const ledCorrection = Math.round((totalFractedLamps * numLed) * correctionFactors["led"] * 100);

    // lampadine a gas  
    const gasLampCorrection = Math.round((totalFractedLamps * numGasLamp) * correctionFactors["gasLamp"] * 100);

    // somma dei fattori di correzione (arrotondato)
    const totalLightingCorrection = Math.round(incandescentCorrection + ledCorrection + gasLampCorrection);

    console.log("incandescentCorrection:", incandescentCorrection);
    console.log("ledCorrection:", ledCorrection);
    console.log("gasLampCorrection:", gasLampCorrection);
    console.log("totalCorrection:", totalLightingCorrection);



    // applicazione del fattore correttivo al tipo di elettricita e al fotovoltaico
    let sourceToApplyLightCorrection = {};

    sourceToApplyLightCorrection[electrcityType] = totalLightingCorrection; //o per rinovabili che per mix energetico
    if (photoData) {
        sourceToApplyLightCorrection["fotovoltaico"] = totalLightingCorrection;
    }

    console.log("sourceToApplyLightCorrection:", sourceToApplyLightCorrection);

    // fattori di correzione sistemi di regolazione e controllo automatici dei corpi illuminanti
    let sourceToApplyAutoCorrection = {};

    if (buildingData.autolightingcontrolsystem === "Si") {
        sourceToApplyAutoCorrection[electrcityType] = correctionFactors["autoLightingControlSystem"]; //o per rinovabili che per mix energetico
        if (photoData) {
            sourceToApplyAutoCorrection["fotovoltaico"] = correctionFactors["autoLightingControlSystem"];
        }
    }

    console.log("sourceToApplyAutoCorrection:", sourceToApplyAutoCorrection);

    // fattori di correzione analizzatori di rete per controllo dei consumi elettrici generali
    let sourceToApplyAnalyzerCorrection = {};
    if (buildingData.analyzers === "Si") {
        sourceToApplyAnalyzerCorrection[electrcityType] = correctionFactors["analyzers"]; //o per rinovabili che per mix energetico
        if (photoData) {
            sourceToApplyAnalyzerCorrection["fotovoltaico"] = correctionFactors["analyzers"];
        }
    }

    console.log("sourceToApplyAnalyzerCorrection:", sourceToApplyAnalyzerCorrection);

    // fattori di correzione corgeneratore/trigeneratore (se presente un impianto centralizzato)
    let cogenTrigenCorrectionFactor = {};
    for (let i = 0; i < plantData.length; i++) { //si possono avere piu impianti centralizzati? se si bisogna fare una media tra i fattori di correzione applicati
        if (plantData[i].plant_type === "Centralizzato" && plantData[i].generator_type.includes("Cogeneratore o Trigenerazione")) {
            if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Motore endotermico") {
                if (plantData[i].fuel_type === "Elettrico") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenTermic"];
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenTermic"];

                }
            } else if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Microturbina") {
                if (plantData[i].fuel_type === "Elettrico") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenMicro"];
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenMicro"];
                }
            } else if (plantData[i].generator_type === "Cogeneratore o Trigenerazione con Fuel Cell") {
                if (plantData[i].fuel_type === "Elettrico") {
                    cogenTrigenCorrectionFactor[electrcityType] = correctionFactors["cogen/trigenFuelCell"];
                } else {
                    cogenTrigenCorrectionFactor[plantData[i].fuel_type] = correctionFactors["cogen/trigenFuelCell"];
                }
            }
        }
    }

    console.log("cogenTrigenCorrectionFactor:", cogenTrigenCorrectionFactor);

    return (
        console.log("Emissioni calcolate")
    );
}





