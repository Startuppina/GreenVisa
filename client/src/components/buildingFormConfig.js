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
  return [lineOne, lineTwo, lineThree].filter(Boolean).join(" - ").trim();
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

export function isBuildingPayloadComplete(payload) {
  const areaNumber = Number(payload.area);
  const capValue = String(payload.cap || "").trim();

  return Boolean(
    String(payload.name || "").trim()
    && String(payload.usage || "").trim()
    && payload.year
    && Number.isFinite(areaNumber)
    && areaNumber > 0
    && String(payload.location || "").trim()
    && String(payload.renovation || "").trim()
    && String(payload.heating || "").trim()
    && String(payload.energyControl || "").trim()
    && String(payload.maintenance || "").trim()
    && String(payload.waterRecovery || "").trim()
    && String(payload.contractPowerClass || payload.electricityCounter || "").trim()
    && String(payload.electricityAnalyzer || "").trim()
    && String(payload.electricForniture || "").trim()
    && /^\d{5}$/.test(capValue)
    && String(payload.municipality || "").trim()
    && String(payload.street || "").trim()
  );
}
