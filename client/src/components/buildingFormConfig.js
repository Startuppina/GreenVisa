export const REGION_OPTIONS = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
];

export const BUILDING_FORM_OPTIONS = {
  renovation: ["Edile", "Impiantistico", "No"],
  heatDistribution: [
    "Radiatori",
    "Ventilconvettori",
    "Impianto ad aria canalizzato",
    "Pavimento radiante",
  ],
  ventilation: ["Si", "Si, con recupero calore", "No"],
  energyControl: ["Settimanale", "Mensile", "Annuale", "No"],
  maintenance: ["Settimanale", "Mensile", "Annuale", "No"],
  waterRecovery: ["Per l'irrigazione", "Per la cassette di scarico", "Altro", "No"],
  electricityMeter: [
    "Da 0 a 10 kW",
    "Da 10 a 20 kW",
    "Da 20 a 50 kW",
    "Da 50 a 100 kW",
    "Oltre i 100 kW",
  ],
  analyzers: ["Si", "No", "Non so"],
  electricForniture: [
    "Elettrico - mix generico",
    "Elettrico - 100% rinnovabili",
  ],
  automaticLightingControlSystems: ["Si", "No", "Non so"],
};

export function getConstructionYearBucket(constructionYearValue, fallbackYear = "") {
  const yearNumber = Number(constructionYearValue);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) {
    return fallbackYear || "";
  }
  if (yearNumber < 1976) {
    return "Prima del 1976";
  }
  if (yearNumber <= 1991) {
    return "Tra 1976 e 1991";
  }
  if (yearNumber <= 2004) {
    return "Tra 1991 e 2004";
  }
  return "Dopo il 2004";
}

export function composeLegacyAddress({
  address = "",
  street = "",
  streetNumber = "",
  municipality = "",
  cap = "",
  region = "",
  country = "",
}) {
  const lineOne = [street, streetNumber].filter(Boolean).join(", ");
  const lineTwo = [cap, municipality].filter(Boolean).join(" ");
  const lineThree = [region, country].filter(Boolean).join(", ");
  const composed = [lineOne, lineTwo, lineThree].filter(Boolean).join(" - ").trim();
  return composed || address || "";
}

export function normalizeIntegerOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function createBuildingPayload({
  buildingID,
  name,
  address,
  usage,
  location,
  year,
  area,
  renovation,
  heating,
  ventilation,
  energyControl,
  maintenance,
  waterRecovery,
  electricityCounter,
  electricityAnalyzer,
  autoLightingControlSystem,
  electricForniture,
  lighting,
  led,
  gasLamp,
  ateco,
  activityDescription,
  annualTurnover,
  employees,
  prodProcessDescription,
  country,
  cap,
  municipality,
  street,
  streetNumber,
  climateZone,
  constructionYearValue,
  contractPowerClass,
}) {
  return {
    id: buildingID,
    name,
    address: composeLegacyAddress({
      address,
      street,
      streetNumber,
      municipality,
      cap,
      region: location,
      country,
    }),
    usage,
    location,
    year: getConstructionYearBucket(constructionYearValue, year),
    area,
    renovation,
    heating,
    ventilation,
    energyControl,
    maintenance,
    waterRecovery,
    electricityCounter: contractPowerClass || electricityCounter,
    electricityAnalyzer,
    autoLightingControlSystem,
    electricForniture,
    lighting,
    led,
    gasLamp,
    ateco: ateco || null,
    activityDescription: activityDescription || null,
    annualTurnover: annualTurnover ?? 0,
    employees: employees ?? 0,
    prodProcessDescription: prodProcessDescription || null,
    country: country || null,
    region: location || null,
    cap: cap || null,
    municipality: municipality || null,
    street: street || null,
    streetNumber: streetNumber || null,
    climateZone: climateZone || null,
    constructionYearValue: normalizeIntegerOrNull(constructionYearValue),
    contractPowerClass: contractPowerClass || electricityCounter || null,
  };
}
