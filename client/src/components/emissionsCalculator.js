//FILE PER IL CALCOLO DELLE EMSSIONI DI UN EDIFICIO
import axios from "axios";

export async function EmissionsCalculator(buildingID) {
    let buildingData = {};
    let solarData = {};
    let photoData = {};

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
            solarData = response.data.solaData;
            photoData = response.data.photoData;
            console.log("BuildingData:", buildingData);
            console.log("SolaData:", solarData);
            console.log("PhotoData:", photoData);
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
        "Cippato di legna": 0.20,           // t
        "Biogas": 0.00052,       // Sm³
        "elettricitaRete": 0.00025, // kWh
        "elettricitaFotovoltaico": 0.00025, // kWh
        "Teleriscaldamento": 0.000187, // kWh
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





    return (
        console.log("Emissioni calcolate")


    );
}
