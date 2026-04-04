const express = require("express");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("./db"); // Your database connection pool
const rootLogger = require("./logger");
const { createRequestLoggingMiddleware } = require("./middleware/httpLogger");
const { authenticateJWT, authenticateRecoveryToken, authenticateAdmin } = require("./middleware/auth");
const {
  logAuthEvent,
  logQuestionnaireEvent,
  logPaymentEvent,
  logAdminEvent,
  logBuildingEvent,
  logCronEvent,
  logUnexpectedError,
} = require("./lib/businessEvents");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
require("dotenv").config();

const requestLoggingMiddleware = createRequestLoggingMiddleware();
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const cron = require('node-cron');
const pricingFunctions = require('./priceCalculator');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { disconnect } = require("process");
const { v4: uuidv4 } = require('uuid');
const { user } = require("pg/lib/defaults");
const validate = require('validate-vat');
const { isSpaCategory, sanitizeWellnessSurveyData } = require('./services/wellnessSurveyService');

const port = 8080;

const email_sender = process.env.EMAIL_SENDER;
const pass_sender = process.env.PASS_SENDER;

const app = express();

DOMPurify = createDOMPurify(new JSDOM().window);


app.use(express.static("img"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploaded_img');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});


const upload = multer({ storage: storage });

app.use('/uploaded_img', express.static(path.join(__dirname, 'uploaded_img')));

const secretKey = process.env.SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "Lax",
};
const accessTokenCookieOptions = {
  ...cookieBaseOptions,
  maxAge: 3 * 24 * 60 * 60 * 1000,
};
const sessionCookieOptions = {
  ...cookieBaseOptions,
  maxAge: 3 * 24 * 60 * 60 * 1000,
};
const recoveryTokenCookieOptions = {
  ...cookieBaseOptions,
  maxAge: 15 * 60 * 1000,
};
const passwordRecoveryChallenges = new Map();

function hashRecoveryCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function generateRecoveryCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function saveRecoveryChallenge(email, code) {
  const normalizedEmail = email.toLowerCase();
  passwordRecoveryChallenges.set(normalizedEmail, {
    hash: hashRecoveryCode(code),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function verifyRecoveryChallenge(email, code) {
  const normalizedEmail = email.toLowerCase();
  const challenge = passwordRecoveryChallenges.get(normalizedEmail);
  if (!challenge) {
    return false;
  }
  if (Date.now() > challenge.expiresAt) {
    passwordRecoveryChallenges.delete(normalizedEmail);
    return false;
  }
  if (challenge.hash !== hashRecoveryCode(code)) {
    return false;
  }
  passwordRecoveryChallenges.delete(normalizedEmail);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [email, challenge] of passwordRecoveryChallenges.entries()) {
    if (challenge.expiresAt <= now) {
      passwordRecoveryChallenges.delete(email);
    }
  }
}, 60 * 1000);

//const purify = DOMPurify(window);
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://vps-0fde778b.vps.ovh.net:5173'],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware per la gestione dei cookie per gli utenti non autenticati
app.use((req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = '_' + Math.random().toString(36).substr(2, 9);
      res.cookie('sessionId', sessionId, sessionCookieOptions);
    }
  }

  next();
});

app.use(requestLoggingMiddleware);

async function getBuildingLockState(userId, buildingId) {
  const result = await pool.query(
    "SELECT id, results_visible FROM buildings WHERE id = $1 AND user_id = $2",
    [buildingId, userId]
  );

  if (result.rows.length === 0) {
    return { found: false, locked: false };
  }

  return {
    found: true,
    locked: Boolean(result.rows[0].results_visible),
  };
}

async function assertBuildingEditable(res, userId, buildingId) {
  const state = await getBuildingLockState(userId, buildingId);

  if (!state.found) {
    res.status(404).json({ msg: "Edificio non trovato" });
    return false;
  }

  if (state.locked) {
    res.status(403).json({ msg: "Edificio finalizzato: modifiche non consentite" });
    return false;
  }

  return true;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function deriveConstructionYearLabel(constructionYearValue, fallbackYear = "") {
  const yearNumber = Number(constructionYearValue);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) {
    return fallbackYear || null;
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

function composeLegacyBuildingAddress({
  address,
  street,
  streetNumber,
  municipality,
  cap,
  location,
  country,
}) {
  const lineOne = [street, streetNumber].filter(Boolean).join(", ");
  const lineTwo = [cap, municipality].filter(Boolean).join(" ");
  const lineThree = [location, country].filter(Boolean).join(", ");
  const composed = [lineOne, lineTwo, lineThree].filter(Boolean).join(" - ").trim();
  return composed || address || "";
}

function getBuildingCompletionIssues({
  name,
  address,
  usage,
  year,
  area,
  location,
  renovation,
  heating,
  energyControl,
  maintenance,
  waterRecovery,
  contractPowerClass,
  electricityAnalyzer,
  electricForniture,
  cap,
  municipality,
  street,
}) {
  const issues = [];
  const areaNumber = Number(area);
  const capValue = String(cap || "").trim();

  if (!String(name || "").trim()) issues.push("name");
  if (!String(address || "").trim()) issues.push("address");
  if (!String(usage || "").trim()) issues.push("usage");
  if (!String(year || "").trim()) issues.push("year");
  if (!Number.isFinite(areaNumber) || areaNumber <= 0) issues.push("area");
  if (!String(location || "").trim()) issues.push("location");
  if (!String(renovation || "").trim()) issues.push("renovation");
  if (!String(heating || "").trim()) issues.push("heating");
  if (!String(energyControl || "").trim()) issues.push("energyControl");
  if (!String(maintenance || "").trim()) issues.push("maintenance");
  if (!String(waterRecovery || "").trim()) issues.push("waterRecovery");
  if (!String(contractPowerClass || "").trim()) issues.push("contractPowerClass");
  if (!String(electricityAnalyzer || "").trim()) issues.push("electricityAnalyzer");
  if (!String(electricForniture || "").trim()) issues.push("electricForniture");
  if (!/^\d{5}$/.test(capValue)) issues.push("cap");
  if (!String(municipality || "").trim()) issues.push("municipality");
  if (!String(street || "").trim()) issues.push("street");

  return issues;
}

function isBuildingComplete(building) {
  const location = firstNonEmpty(building?.region, building?.location) || "";
  const contractPowerClass = firstNonEmpty(
    building?.contract_power_class,
    building?.electricity_meter,
    building?.contractPowerClass,
    building?.electricityCounter
  ) || "";
  const electricityAnalyzer = firstNonEmpty(
    building?.analyzers,
    building?.electricityAnalyzer
  ) || "";
  const electricForniture = firstNonEmpty(
    building?.electricity_forniture,
    building?.electricForniture
  ) || "";
  const heating = firstNonEmpty(building?.heat_distribution, building?.heating) || "";
  const energyControl = firstNonEmpty(building?.energy_control, building?.energyControl) || "";
  const waterRecovery = firstNonEmpty(building?.water_recovery, building?.waterRecovery) || "";
  const year = firstNonEmpty(building?.construction_year, building?.year) || "";
  const address = composeLegacyBuildingAddress({
    address: firstNonEmpty(building?.address) || "",
    street: firstNonEmpty(building?.street) || "",
    streetNumber: firstNonEmpty(building?.street_number, building?.streetNumber) || "",
    municipality: firstNonEmpty(building?.municipality) || "",
    cap: firstNonEmpty(building?.cap) || "",
    location,
    country: firstNonEmpty(building?.country) || "Italia",
  });

  return getBuildingCompletionIssues({
    name: building?.name,
    address,
    usage: building?.usage,
    year,
    area: building?.area,
    location,
    renovation: building?.renovation,
    heating,
    energyControl,
    maintenance: building?.maintenance,
    waterRecovery,
    contractPowerClass,
    electricityAnalyzer,
    electricForniture,
    cap: building?.cap,
    municipality: building?.municipality,
    street: building?.street,
  }).length === 0;
}

async function ensureBuildingFormColumns() {
  await pool.query(`
    ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS region VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cap VARCHAR(5),
    ADD COLUMN IF NOT EXISTS municipality VARCHAR(255),
    ADD COLUMN IF NOT EXISTS street VARCHAR(255),
    ADD COLUMN IF NOT EXISTS street_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS climate_zone VARCHAR(10),
    ADD COLUMN IF NOT EXISTS construction_year_value INTEGER,
    ADD COLUMN IF NOT EXISTS contract_power_class VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE
  `);
}

async function ensurePlantManagementColumns() {
  await pool.query(`
    ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS system_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS fuel_consumption DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS fuel_unit VARCHAR(20),
    ADD COLUMN IF NOT EXISTS has_heat_recovery BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS incandescent_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS led_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gas_lamp_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS auto_lighting_control BOOLEAN DEFAULT FALSE
  `);

  await pool.query(`
    ALTER TABLE plants
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS service_type
  `);
}

function parseNullablePositiveNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  return numericValue;
}

function normalizePlantPayload(body) {
  const systemType = typeof body.systemType === "string" ? body.systemType.trim() : "";
  const plantType = typeof body.plantType === "string" ? body.plantType.trim() : "";
  const generatorType = typeof body.generatorType === "string" ? body.generatorType.trim() : "";
  const generatorDescription = typeof body.generatorDescription === "string" ? body.generatorDescription.trim() : "";
  let fuelType = typeof body.fuelType === "string" ? body.fuelType.trim() : "";
  let fuelUnit = typeof body.fuelUnit === "string" ? body.fuelUnit.trim() : "";
  let fuelConsumption = parseNullablePositiveNumber(body.fuelConsumption);
  const incandescentCount = Number(body.incandescentCount ?? 0);
  const ledCount = Number(body.ledCount ?? 0);
  const gasLampCount = Number(body.gasLampCount ?? 0);

  if (systemType === "Illuminazione") {
    fuelType = "";
    fuelUnit = "";
    fuelConsumption = null;
  }

  return {
    systemType,
    plantType,
    generatorType,
    generatorDescription,
    fuelType,
    fuelUnit,
    fuelConsumption,
    hasHeatRecovery: Boolean(body.hasHeatRecovery),
    hasGasLeak: Boolean(body.hasGasLeak),
    refrigerantGases: Array.isArray(body.refrigerantGases) ? body.refrigerantGases : [],
    incandescentCount,
    ledCount,
    gasLampCount,
    autoLightingControl: Boolean(body.autoLightingControl),
  };
}

function validatePlantPayload(payload) {
  const thermalTypes = new Set([
    "Riscaldamento",
    "Raffrescamento",
    "Acqua calda sanitaria",
    "Altra produzione termica",
  ]);
  const allowedTypes = new Set([...thermalTypes, "Ventilazione meccanica", "Illuminazione"]);
  if (!allowedTypes.has(payload.systemType)) {
    return "Tipo di impianto non valido";
  }

  if ((thermalTypes.has(payload.systemType) || payload.systemType === "Ventilazione meccanica") && !payload.plantType) {
    return "Il tipo di impianto è obbligatorio";
  }

  if (thermalTypes.has(payload.systemType) && !payload.generatorType) {
    return "Il tipo di generatore è obbligatorio";
  }

  if (thermalTypes.has(payload.systemType) && !payload.fuelType) {
    return "Il carburante è obbligatorio";
  }

  if (thermalTypes.has(payload.systemType) && payload.fuelConsumption === null) {
    return "La quantità consumata è obbligatoria";
  }

  if (payload.systemType === "Illuminazione") {
    if ([payload.incandescentCount, payload.ledCount, payload.gasLampCount].some((value) => !Number.isFinite(value) || value < 0)) {
      return "I campi illuminazione devono essere numerici e non negativi";
    }
    if ((payload.incandescentCount + payload.ledCount + payload.gasLampCount) <= 0) {
      return "Inserisci almeno un corpo illuminante";
    }
  }

  if (thermalTypes.has(payload.systemType) && payload.hasGasLeak) {
    const validGases = payload.refrigerantGases.filter(
      (gas) => gas.type?.trim() && gas.quantity !== "" && Number.isFinite(Number(gas.quantity)) && Number(gas.quantity) > 0,
    );
    if (validGases.length === 0) {
      return "Devi inserire almeno un gas refrigerante";
    }
  }

  return null;
}

function deriveLegacyBuildingFromPlants(building, plantRows) {
  const lightingPlants = plantRows.filter((plant) => plant.system_type === "Illuminazione");
  const ventilationPlants = plantRows.filter((plant) => plant.system_type === "Ventilazione meccanica");
  const lightingTotals = lightingPlants.reduce((accumulator, plant) => ({
    incandescent: accumulator.incandescent + Number(plant.incandescent_count || 0),
    led: accumulator.led + Number(plant.led_count || 0),
    gasLamp: accumulator.gasLamp + Number(plant.gas_lamp_count || 0),
    autoLightingControl: accumulator.autoLightingControl || Boolean(plant.auto_lighting_control),
  }), {
    incandescent: 0,
    led: 0,
    gasLamp: 0,
    autoLightingControl: false,
  });

  const ventilationValue = ventilationPlants.some((plant) => plant.has_heat_recovery)
    ? "Si, con recupero calore"
    : ventilationPlants.length > 0
      ? "Si"
      : building.ventilation;

  return {
    ...building,
    ventilation: ventilationValue,
    incandescent: lightingTotals.incandescent || Number(building.incandescent || 0),
    led: lightingTotals.led || Number(building.led || 0),
    gas_lamp: lightingTotals.gasLamp || Number(building.gas_lamp || 0),
    autolightingcontrolsystem: lightingPlants.length > 0
      ? (lightingTotals.autoLightingControl ? "Si" : "No")
      : building.autolightingcontrolsystem,
  };
}

function buildConsumptionsFromPlants(plantRows) {
  const consumptionsByFuel = new Map();
  plantRows.forEach((plant) => {
    if (!plant.fuel_type || plant.fuel_consumption === null || plant.fuel_consumption === undefined || plant.fuel_consumption === "") {
      return;
    }
    const previousValue = consumptionsByFuel.get(plant.fuel_type) || 0;
    consumptionsByFuel.set(plant.fuel_type, previousValue + Number(plant.fuel_consumption));
  });

  return Array.from(consumptionsByFuel.entries()).map(([energySource, consumption]) => ({
    energy_source: energySource,
    consumption,
  }));
}

function mapPlantsForCalculator(plantRows) {
  const thermalTypes = new Set([
    "Riscaldamento",
    "Raffrescamento",
    "Acqua calda sanitaria",
    "Altra produzione termica",
  ]);
  return plantRows
    .filter((plant) => thermalTypes.has(plant.system_type))
    .map((plant) => ({
      ...plant,
      service_type: plant.system_type,
    }));
}

const cleanUpCart = async () => {
  const job = "cart_session_cleanup";
  logCronEvent("cron_started", { job_name: job });
  try {
    await pool.query(`
      DELETE FROM cart
      WHERE session_id IS NOT NULL
      AND user_id IS NULL
    `);
    logCronEvent("cron_completed", { job_name: job });
  } catch (error) {
    logCronEvent(
      "cron_failed",
      { job_name: job, err: { message: error.message, code: error.code } },
      "error",
    );
    rootLogger.error({ event: "unexpected_error", err: error.message }, "cart cleanup failed");
  }
};

cron.schedule('0 0 */3 * *', cleanUpCart);

async function deleteExpiredPromoCodes() {
  const job = "promo_codes_expiry";
  logCronEvent("cron_started", { job_name: job });
  try {
    const currentDate = new Date();
    const isoDateString = currentDate.toISOString();

    const query = `
          DELETE FROM promocodes
          WHERE expiration <= NOW()
      `;

    const result = await pool.query(query);
    logCronEvent("cron_completed", { job_name: job, rows_affected: result.rowCount });
  } catch (error) {
    logCronEvent(
      "cron_failed",
      { job_name: job, err: { message: error.message, code: error.code } },
      "error",
    );
    rootLogger.error({ event: "unexpected_error", err: error.message }, "promo expiry job failed");
  }
}

// Cancel all expired promo codes every 1 hour
cron.schedule('0 * * * *', () => {
  //console.log('Running scheduled job to delete expired promo codes');
  deleteExpiredPromoCodes();
});

app.get('/api/authenticated', authenticateJWT, (req, res) => {
  return res.status(200).json({ msg: 'Utente autenticato', user: req.user }); // 200 OK
});

app.get("/api/admin-username", authenticateJWT, authenticateAdmin, async (req, res) => {

  try {
    const { role, user_id } = req.user;
    if (role !== "administrator") {
      return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    const query = "SELECT username FROM users WHERE id = $1";
    const values = [user_id];
    const result = await pool.query(query, values);
    const username = result.rows[0].username;
    res.status(200).json({ username });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Errore durante la richiesta" });
  }
})


app.post("/api/signup", async (req, res) => {
  const { username, company_name, email, confirmEmail, password, phone, company_website, pec, vat, noCompanyEmail, legal_headquarter } = req.body;
  const normalizedNoCompanyEmail = Boolean(noCompanyEmail);
  const resolvedEmail = normalizedNoCompanyEmail ? ((email || '').trim() || (pec || '').trim()) : (email || '').trim();
  const resolvedConfirmEmail = normalizedNoCompanyEmail ? ((confirmEmail || '').trim() || resolvedEmail) : (confirmEmail || '').trim();
  const normalizedVat = normalizeVatNumber(vat);

  // Check if all fields are filled
  if (!resolvedEmail || !resolvedConfirmEmail || !company_name || !password || !username || !phone || !company_website || !pec || !normalizedVat || !legal_headquarter) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "missing_fields" }, "warn");
    return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
  }
  if (!passwordCheck(password)) { //implement password check defined below
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "weak_password" }, "warn");
    return res
      .status(400)
      .json({ msg: "Password non corretta. Segui le info per ottenere una password sicura" });
  }
  if (!emailCheck(resolvedEmail)) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "invalid_email" }, "warn");
    return res.status(400).json({ msg: "Email non valida" });
  }
  if (!emailCheck(resolvedConfirmEmail)) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "invalid_confirm_email" }, "warn");
    return res.status(400).json({ msg: "Email non valida" });
  }
  if (resolvedEmail !== resolvedConfirmEmail) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "email_mismatch" }, "warn");
    return res.status(400).json({ msg: "Le email non corrispondono" });
  }
  if (!emailCheck(pec)) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "invalid_pec" }, "warn");
    return res.status(400).json({ msg: "PEC non valida" });
  }
  if (!phoneCheck(phone)) {
    logAuthEvent(req, "validation_failed", { flow: "signup", reason: "invalid_phone" }, "warn");
    return res.status(400).json({ msg: "Numero di telefono non valido" });
  }

  try {
    const result = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [resolvedEmail]
    );

    if (result.rows.length > 0) {
      logAuthEvent(req, "auth_signup_failed", { reason: "duplicate_email" }, "warn");
      return res.status(400).json({ msg: "Email già in uso" });
    }

    const existingVat = await pool.query(
      "SELECT id FROM users WHERE p_iva = $1",
      [normalizedVat]
    );

    if (existingVat.rows.length > 0) {
      logAuthEvent(req, "auth_signup_failed", { reason: "duplicate_vat" }, "warn");
      return res.status(400).json({ msg: "Partita IVA già registrata" });
    }

    const vatValidation = await vatCheck(normalizedVat);
    if (vatValidation.serviceUnavailable) {
      logUnexpectedError(req, new Error("vat_validation_service_unavailable"), { flow: "signup" });
      return res.status(503).json({ msg: "Servizio verifica partita IVA temporaneamente non disponibile" });
    }

    if (!vatValidation.valid) {
      logAuthEvent(req, "validation_failed", { flow: "signup", reason: "invalid_vat" }, "warn");
      return res.status(400).json({ msg: "Partita IVA non valida o non attiva" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const intPrefix = phone.slice(0, 2);
    const intSuffix = phone.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    const result2 = await pool.query(
      "INSERT INTO users (username, company_name, email, phone_number, p_iva, tax_code, legal_headquarter, turnover, administrator, password_digest) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [username, company_name, resolvedEmail, newPhone, normalizedVat, null, legal_headquarter, null, false, hashedPassword]
    );

    if (result2.rowCount > 0) {
      const userID = result2.rows[0].id;
      const userToken = uuidv4();

      const updateResult = await pool.query(
        "UPDATE users SET token = $1 WHERE id = $2",
        [userToken, userID]
      );

      if (updateResult.rowCount > 0) {
        // Tutto ok -> mando email di conferma
        sendConfirmationEmail({
          recipient_email: resolvedEmail,
          recipient_name: username,
          token: userToken,
        });
      }
      logAuthEvent(req, "auth_signup_success", { user_id: userID });
    }

    return res.status(200).json({ msg: "Utente registrato" });
  } catch (error) {
    if (error.code === "23505") {
      const constraint = error.constraint || "";
      if (constraint.includes("p_iva")) {
        logAuthEvent(req, "auth_signup_failed", { reason: "duplicate_vat" }, "warn");
        return res.status(400).json({ msg: "Partita IVA già registrata" });
      }
      if (constraint.includes("email")) {
        logAuthEvent(req, "auth_signup_failed", { reason: "duplicate_email" }, "warn");
        return res.status(400).json({ msg: "Email già in uso" });
      }
      logAuthEvent(req, "auth_signup_failed", { reason: "duplicate_field", constraint }, "warn");
      return res.status(400).json({ msg: "Dati già registrati" });
    }
    logUnexpectedError(req, error, { flow: "signup" });
    return res
      .status(500)
      .json({ msg: "Errore durante la registrazione dell'utente" });
  }
});

app.post('/api/check-vat', async (req, res) => {
  try {
    const normalizedVatNumber = normalizeVatNumber(req.body?.vatNumber);

    if (!normalizedVatNumber) {
      return res.status(400).json({ success: false, msg: "Partita IVA mancante" });
    }

    const isValid = await vatCheck(normalizedVatNumber);

    if (isValid.serviceUnavailable) {
      return res.status(503).json({ success: false, msg: "Servizio verifica partita IVA temporaneamente non disponibile" });
    }

    if (isValid.valid) {
      return res.status(200).json({
        success: true,
        vatNumber: normalizedVatNumber,
        companyName: isValid.companyName,
        address: isValid.address,
        msg: "Partita IVA valida",
      });
    } else {
      return res.status(400).json({ success: false, msg: "Partita IVA non valida o non attiva" });
    }
  } catch (error) {
    console.error("Errore durante il controllo della partita IVA:", error);
    return res.status(500).json({ success: false, msg: "Errore interno al server" });
  }
});

app.get('/api/verify', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    logAuthEvent(req, "validation_failed", { flow: "email_verify", reason: "missing_token" }, "warn");
    return res.status(400).json({ success: false, message: 'Token mancante' });
  }

  try {
    // Cerca l'utente con quel token
    const result = await pool.query(
      'SELECT * FROM users WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      logAuthEvent(req, "validation_failed", { flow: "email_verify", reason: "invalid_token" }, "warn");
      // Nessun utente trovato con quel token
      return res.status(404).json({ success: false, message: 'Token non valido o scaduto' });
    }

    const userId = result.rows[0].id;
    const email = result.rows[0].email;
    const username = result.rows[0].username;

    const updateResult = await pool.query(
      'UPDATE users SET isVerified = true, token = NULL WHERE id = $1',
      [userId]
    );

    if (updateResult.rowCount > 0) {
      // Invia email di benvenuto solo se l'UPDATE ha modificato qualcosa
      sendWelcomeEmail({
        recipient_email: email,
        recipient_name: username,
      });

      logAuthEvent(req, "auth_email_verified", { user_id: userId });
      return res.status(200).json({ success: true, message: 'Account verificato' });
    }

  } catch (error) {
    logUnexpectedError(req, error, { flow: "email_verify" });
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
});

app.post("/api/send-verify-email", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    //verify if the email exists in the database
    const { userID } = req.body;
    const result = await pool.query(
      "SELECT username, email FROM users WHERE id = $1",
      [userID]
    );
    if (result.rows.length === 0) {
      logAuthEvent(req, "validation_failed", { flow: "send_verify_email", reason: "user_not_found" }, "warn");
      return res.status(400).json({ msg: "Non esiste un utente con questo id" });
    }

    const userToken = uuidv4();

    const updateResult = await pool.query(
      "UPDATE users SET token = $1 WHERE id = $2",
      [userToken, userID]
    );

    if (updateResult.rowCount > 0) {
      sendConfirmationEmail({
        recipient_email: result.rows[0].email,
        recipient_name: result.rows[0].username,
        token: userToken,
      });
      logAuthEvent(req, "auth_verify_email_sent", { target_user_id: Number(userID) });
      return res.status(200).json({ msg: "Email di verifica inviata correttamente" });
    }
  } catch (error) {
    logUnexpectedError(req, error, { flow: "send_verify_email" });
    return res.status(500).json({ msg: "Errore durante l'invio dell'email di verifica" });
  }
})

app.post("/api/verify-user-manually", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { userID } = req.body;
    if (!userID) {
      logAuthEvent(req, "validation_failed", { flow: "verify_user_manually", reason: "missing_user_id" }, "warn");
      return res.status(400).json({ msg: "ID utente mancante" });
    }

    const userResult = await pool.query(
      "SELECT id, username, email, isVerified FROM users WHERE id = $1",
      [userID]
    );

    if (userResult.rows.length === 0) {
      logAuthEvent(req, "validation_failed", { flow: "verify_user_manually", reason: "user_not_found" }, "warn");
      return res.status(404).json({ msg: "Utente non trovato" });
    }

    const user = userResult.rows[0];

    if (user.isverified) {
      return res.status(200).json({ msg: "Utente gia verificato" });
    }

    const updateResult = await pool.query(
      "UPDATE users SET isVerified = true, token = NULL WHERE id = $1",
      [userID]
    );

    if (updateResult.rowCount > 0) {
      sendWelcomeEmail({
        recipient_email: user.email,
        recipient_name: user.username,
      });
      logAuthEvent(req, "auth_manual_verify_success", { user_id: Number(userID) });
      return res.status(200).json({ msg: "Account verificato manualmente" });
    }

    return res.status(500).json({ msg: "Impossibile verificare l'account" });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "verify_user_manually" });
    return res.status(500).json({ msg: "Errore durante la verifica manuale dell'account" });
  }
})

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const sessionID = req.cookies.sessionId;

  if (!email || !password) {
    logAuthEvent(req, "validation_failed", { flow: "login", reason: "missing_fields" }, "warn");
    return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      logAuthEvent(req, "auth_login_failed", { reason: "unknown_user" }, "warn");
      return res.status(400).json({ msg: "Email non valida" });
    }

    const user = result.rows[0]; // if we found a user
    const isMatch = await bcrypt.compare(password, user.password_digest);

    if (!isMatch) {
      logAuthEvent(req, "auth_login_failed", { reason: "bad_password", user_id: user.id }, "warn");
      return res.status(400).json({ msg: "Password errata" });
    }

    if (!user.isverified) {
      logAuthEvent(req, "auth_login_failed", { reason: "unverified_account", user_id: user.id }, "warn");
      return res.status(400).json({ msg: "Account non verificato" });
    }

    let token;
    //check if user is admin
    if (user.administrator) {
      token = jwt.sign({ user_id: user.id, role: "administrator" }, secretKey, { expiresIn: "3d" });
    } else {
      token = jwt.sign({ user_id: user.id, role: "user" }, secretKey, { expiresIn: "3d" });
    }

    const user_id = user.id;
    const first_login = user.first_login;
    if (first_login) {
      await pool.query("UPDATE users SET first_login = false WHERE id = $1", [user_id]);
    }

    if (sessionID) {
      // Update user_id and session_id in cart table if session_id is not null
      await pool.query("UPDATE cart SET user_id = $1, session_id = NULL  WHERE session_id = $2", [user_id, sessionID])
    }

    res.cookie('accessToken', token, accessTokenCookieOptions);

    res.clearCookie('sessionId', cookieBaseOptions);


    logAuthEvent(req, "auth_login_success", {
      user_id,
      is_admin: !!user.administrator,
    });

    return res
      .status(200)
      .json({ msg: "Login effettuato con successo!", first_login });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "login" });
    return res
      .status(500)
      .json({ msg: "Errore durante il login. Riprova" });
  }
});

app.post("/api/logout", authenticateJWT, (req, res) => {
  logAuthEvent(req, "auth_logout", { user_id: req.user?.user_id });
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('recoveryToken', cookieBaseOptions);
  res.status(200).json({ msg: "Logout effettuato con successo!" });
});

app.delete("/api/delete-account", authenticateJWT, async (req, res) => {
  try {

    const { user_id } = req.user;

    const result = await pool.query("DELETE FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Account non trovato" });
    }

    res.clearCookie('accessToken', cookieBaseOptions);
    res.clearCookie('recoveryToken', cookieBaseOptions);
    res.clearCookie('sessionId', cookieBaseOptions);

    res.status(200).json({ message: "Account eliminato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.get("/api/user-info", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (!result) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.put("/api/update-username", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { username } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [
      username,
      user_id,
    ]);

    res.status(200).json({ message: "Username aggiornato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.put("/api/update-phone", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { phone_number } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const intPrefix = phone_number.slice(0, 2);
    const intSuffix = phone_number.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    await pool.query("UPDATE users SET phone_number = $1 WHERE id = $2", [
      newPhone,
      user_id,
    ]);

    res
      .status(200)
      .json({ message: "Numero di telefono aggiornato con successo", newPhone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.put("/api/update-email", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { email } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (!emailCheck(email)) {
      return res.status(400).json({ message: "Email non valida" });
    }

    await pool.query("UPDATE users SET email = $1 WHERE id = $2", [
      email,
      user_id,
    ]);

    res.status(200).json({ message: "Email aggiornata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
})

// app.put("/api/update-company-name", authenticateJWT, async (req, res) => {
//   try {
//     const { user_id } = req.user;
//     const { company_name } = req.body;

//     const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Utente non trovato" });
//     }

//     await pool.query("UPDATE users SET company_name = $1 WHERE id = $2", [
//       company_name,
//       user_id,
//     ]);

//     res.status(200).json({ message: "Nome azienda aggiornato con successo" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Errore interno del server" });
//   }
// });

// app.put("/api/update-piva", authenticateJWT, async (req, res) => {
//   try {
//     const { user_id } = req.user;
//     const { piva } = req.body;

//     const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Utente non trovato" });
//     }

//     if (!vatCheck(piva)) {
//       return res.status(400).json({ message: "Partita IVA non valida" });
//     }

//     await pool.query("UPDATE users SET p_iva = $1 WHERE id = $2", [
//       piva,
//       user_id,
//     ]);

//     res.status(200).json({ message: "Partita IVA aggiornata con successo" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Errore interno del server" });
//   }
// });

app.put("/api/update-tax-code", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { tax_code } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (!cfCheck(tax_code)) {
      return res.status(400).json({ message: "Codice fiscale non valido" });
    }

    await pool.query("UPDATE users SET tax_code = $1 WHERE id = $2", [
      tax_code,
      user_id,
    ]);

    res.status(200).json({ message: "Codice fiscale aggiornato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

// app.put("/api/update-legal-headquarter", authenticateJWT, async (req, res) => {
//   try {
//     const { user_id } = req.user;
//     const { legal_headquarter } = req.body;

//     const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Utente non trovato" });
//     }

//     await pool.query("UPDATE users SET legal_headquarter = $1 WHERE id = $2", [
//       legal_headquarter,
//       user_id,
//     ]);

//     res.status(200).json({ message: "Sede legale aggiornata con successo" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Errore interno del server" });
//   }
// });

app.put("/api/update-turnover", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { turnover } = req.body;

    console.log("turnover:", turnover);

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    await pool.query("UPDATE users SET turnover = $1 WHERE id = $2", [
      turnover,
      user_id,
    ]);

    await pool.query("UPDATE buildings SET annual_turnover = $1 WHERE user_id = $2", [
      turnover,
      user_id,
    ]);

    res.status(200).json({ message: "Fatturato aggiornato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.get("/api/fetch-users", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {

    if (req.user.role !== "administrator") {
      return res.status(401).json({ message: "Non sei autorizzato" });
    }

    const result = await pool.query("SELECT * FROM users order by id ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
})

app.get("/api/fetch-not-verified-users", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {

    if (req.user.role !== "administrator") {
      return res.status(401).json({ message: "Non sei autorizzato" });
    }

    const result = await pool.query("SELECT * FROM users WHERE isVerified = false and administrator = false order by id ASC ");
    res.status(200).json({ rows: result.rows, count: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
})


app.post("/api/send_email", async (req, res) => {
  try {
    const email = req.body?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ msg: "Email non valida" });
    }

    //verifica se l'email esiste nel database
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) {
      const recoveryCode = generateRecoveryCode();
      saveRecoveryChallenge(email, recoveryCode);
      await sendEmail({ recipient_email: email, OTP: recoveryCode });
    }
    res.status(200).json({ msg: "Se l'email esiste, abbiamo inviato un codice di recupero." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.post("/api/send-email-message", async (req, res) => {
  try {
    //verify if the email exists in the database
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [req.body.email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Non esiste un utente con questa email" });
    }

    sendEmailMessage({
      recipient_email: req.body.email,
    });

    return res.status(200).json({ msg: "Email di presa in carico inviata correttamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

function sendConfirmationEmail({ recipient_email, recipient_name, token }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email_sender,
        pass: pass_sender,
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Green Visa - verifica account",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifica account Green Visa</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header img {
                    width: 150px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 1.8em;
                    color: #2d7044;
                    margin: 0;
                }
                .body {
                    padding: 20px 10px;
                    text-align: center;
                }
                .body h2 {
                    font-size: 1.4em;
                    color: #333333;
                    margin-bottom: 10px;
                }
                .body p {
                    font-size: 1.1em;
                    line-height: 1.6;
                    color: #555555;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #2d7044;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .footer {
                    padding-top: 20px;
                    text-align: center;
                    font-size: 0.9em;
                    color: #888888;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 15px;
                    }
                    .header h1 {
                        font-size: 1.6em;
                    }
                    .body h2 {
                        font-size: 1.2em;
                    }
                    .cta-button {
                        font-size: 1em;
                        padding: 10px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa Logo">
                    <h1>Verifica il tuo account</h1>
                </div>
                <div class="body">
                    <h2>Ciao ${recipient_name},</h2>
                    <p>Abbiamo ricevuto una richiesta di verifica per il tuo account Green Visa.</p>
                    <p>Per verificare il tuo account, clicca sul link sottostante:</p>
                    <a class="cta-button" href="${process.env.CLIENT_URL}/AccountVerified?token=${token}">Verifica il tuo account</a>
                </div>
                <div class="footer">
                  <p>Green Visa</p>
                  <p>La sostenibilità con un click!</p>
                </div>
            </div>
        </body>
        </html>`,
    };

    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Email inviata: " + info.response);
        resolve(info);
      }
    });
  });
}

function sendWelcomeEmail({ recipient_email, recipient_name }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email_sender,
        pass: pass_sender,
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Benvenuto in Green Visa!",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Benvenuto in Green Visa</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header img {
                    width: 150px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 1.8em;
                    color: #2d7044;
                    margin: 0;
                }
                .body {
                    padding: 20px 10px;
                    text-align: center;
                }
                .body h2 {
                    font-size: 1.4em;
                    color: #333333;
                    margin-bottom: 10px;
                }
                .body p {
                    font-size: 1.1em;
                    line-height: 1.6;
                    color: #555555;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #2d7044;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .footer {
                    padding-top: 20px;
                    text-align: center;
                    font-size: 0.9em;
                    color: #888888;
                }
                .footer p {
                    margin: 5px 0;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 15px;
                    }
                    .header h1 {
                        font-size: 1.6em;
                    }
                    .body h2 {
                        font-size: 1.2em;
                    }
                    .cta-button {
                        font-size: 1em;
                        padding: 10px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa Logo">
                    <h1>Benvenuto in Green Visa!</h1>
                </div>
                <div class="body">
                    <h2>Ciao ${recipient_name},</h2>
                    <p>Siamo entusiasti di darti il benvenuto nella nostra comunità di utenti che scelgono la sostenibilità.</p>
                    <p>Green Visa ti offre strumenti innovativi per supportare il tuo viaggio verso un futuro più verde e consapevole.</p>
                    <p>Inizia subito il tuo percorso esplorando tutte le funzionalità disponibili sul nostro portale.</p>
                    <a href="${process.env.CLIENT_URL}" class="cta-button">Esplora Green Visa</a>
                </div>
                <div class="footer">
                    <p>Grazie per aver scelto Green Visa.</p>
                    <p>La sostenibilità con un click!</p>
                    <p><strong>Green Visa Team</strong></p>
                </div>
            </div>
        </body>
        </html>`,
    };

    transporter.sendMail(mail_configs, (error, info) => {
      if (error) {
        return reject({ message: "Errore nell'invio dell'email", error });
      }
      return resolve({ message: "Email inviata con successo", info });
    });
  });
}


function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //BEACUSE SECURITY, THE CREDENTIALS MUST BE IN .ENV
        user: email_sender,
        pass: pass_sender
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Green Visa Codice di verifica",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Green Visa - OTP Verification</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    width: 150px;
                }
                .content {
                    text-align: center;
                }
                .content h1 {
                    font-size: 1.4em;
                    color: #2d7044;
                    font-weight: 600;
                }
                .content p {
                    font-size: 1.1em;
                    color: #333333;
                }
                .otp {
                    background: #2d7044;
                    color: white;
                    display: inline-block;
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .footer {
                    text-align: right;
                    padding-top: 20px;
                    color: #aaa;
                    font-size: 0.8em;
                    line-height: 1.5;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 10px;
                    }
                    .content h1 {
                        font-size: 1.2em;
                    }
                    .content p {
                        font-size: 1em;
                    }
                    .otp {
                        font-size: 1.2em;
                        padding: 8px 16px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa">
                </div>
                <div class="content">
                    <h1>Green Visa</h1>
                    <p>Ciao,</p>
                    <p>Grazie per aver utilizzato Green Visa. Usa il seguente codice OTP per recuperare la tua password. Il codice è valido per 5 minuti:</p>
                    <div class="otp">${OTP}</div>
                    <p>Saluti,<br />Green Visa</p>
                </div>
                <div class="footer">
                    <p>Green Visa</p>
                    <p>La sostenibilità con un click!</p>
                </div>
            </div>
        </body>
        </html>`,
    };


    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.error("Errore nell'invio dell'email:", error);
        return reject({
          message: `Errore durante l'invio dell'email: ${error.message}`,
        });
      }
      return resolve({ message: "Email inviata con successo" });
    });
  });
}

function sendEmailMessage({ recipient_email }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //BEACUSE SECURITY, THE CREDENTIALS MUST BE IN .ENV
        user: email_sender,
        pass: pass_sender
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Green Visa Presa in carico",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Green Visa - Presa in carico</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    width: 150px;
                }
                .content {
                    text-align: center;
                }
                .content h1 {
                    font-size: 1.4em;
                    color: #2d7044;
                    font-weight: 600;
                }
                .content p {
                    font-size: 1.1em;
                    color: #333333;
                }
                .footer {
                    text-align: right;
                    padding-top: 20px;
                    color: #aaa;
                    font-size: 0.8em;
                    line-height: 1.5;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 10px;
                    }
                    .content h1 {
                        font-size: 1.2em;
                    }
                    .content p {
                        font-size: 1em;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa">
                </div>
                <div class="content">
                    <h1>Green Visa</h1>
                    <p>Ciao,</p>
                    <p>Grazie per aver scelto Green Visa. Il messagio da te inviato e' stato preso in carico. Ricevera al piu' presto una email di risposta</p>
                    <p>Saluti,<br />Green Visa</p>
                </div>
                <div class="footer">
                    <p>Green Visa</p>
                    <p>La sostenibilità con un click!</p>
                </div>
            </div>
        </body>
        </html>`,
    };

    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.error("Errore nell'invio dell'email:", error);
        return reject({
          message: `Errore durante l'invio dell'email: ${error.message}`,
        });
      }
      return resolve({ message: "Email inviata con successo" });
    });
  });
}

function sendEmailResponse({ recipient_email, email_title, email_content, receiver_username, admin_username }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //BEACUSE SECURITY, THE CREDENTIALS MUST BE IN .ENV
        user: email_sender,
        pass: pass_sender
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Green Visa Risposta",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Green Visa - Risposta</title>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 50px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    width: 150px;
                }
                .content {
                    text-align: center;
                }
                .content h1 {
                    font-size: 1.4em;
                    color: #2d7044;
                    font-weight: 600;
                }
                .content p {
                    font-size: 1.1em;
                    color: #333333;
                }
                .footer {
                    text-align: right;
                    padding-top: 20px;
                    color: #aaa;
                    font-size: 0.8em;
                    line-height: 1.5;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                        padding: 10px;
                    }
                    .content h1 {
                        font-size: 1.2em;
                    }
                    .content p {
                        font-size: 1em;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${process.env.SERVER_URL}/logo2.png" alt="Green Visa">
                </div>
                <div class="content">
                    <h1>${email_title}</h1>
                    <p>Ciao ${receiver_username},</p>
                    <p>${email_content}</p>
                    <p>Saluti,<br />${admin_username} da Green Visa</p>
                </div>
                <div class="footer">
                    <p>Green Visa</p>
                    <p>La sostenibilità con un click!</p>
                </div>
            </div>
        </body>
        </html>`,
    };


    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.error("Errore nell'invio dell'email:", error);
        return reject({
          message: `Errore durante l'invio dell'email: ${error.message}`,
        });
      }
      return resolve({ message: "Email inviata con successo" });
    });
  });
}

app.post("/api/send_recovery_email", async (req, res) => {
  try {
    const email = req.body?.email;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ msg: "Email non valida" });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) {
      const recoveryCode = generateRecoveryCode();
      saveRecoveryChallenge(email, recoveryCode);
      await sendEmail({ recipient_email: email, OTP: recoveryCode });
      logAuthEvent(req, "auth_password_recovery_requested", {
        recovery_email_domain: email.split("@")[1],
      });
    }

    return res.status(200).json({ msg: "Se l'email esiste, abbiamo inviato un codice di recupero." });
  } catch (error) {
    rootLogger.error(
      { event: "unexpected_error", flow: "password_recovery_email", err: { message: error?.message } },
      "recovery email send failed",
    );
    return res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/verify-recovery-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ msg: "Email e codice sono obbligatori" });
    }

    const isValid = verifyRecoveryChallenge(email, code);
    if (!isValid) {
      return res.status(400).json({ msg: "Codice OTP non valido o scaduto" });
    }

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: "Codice OTP non valido o scaduto" });
    }

    const recoveryToken = jwt.sign(
      { user_id: userResult.rows[0].id, purpose: "recovery" },
      secretKey,
      { expiresIn: "15m" }
    );
    res.cookie("recoveryToken", recoveryToken, recoveryTokenCookieOptions);
    return res.status(200).json({ msg: "Codice verificato con successo" });
  } catch (error) {
    return res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.put("/api/change-password", authenticateRecoveryToken, async (req, res) => {
  try {
    const { password } = req.body;
    const user_id = req.user?.user_id;

    if (!passwordCheck(password)) {
      return res
        .status(400)
        .json({ msg: "Password non corretta. Segui le info per ottenere una password sicura" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare the SQL query
    const query = "UPDATE users SET password_digest = $1 WHERE id = $2";
    const values = [hashedPassword, user_id];

    // Execute the query
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.clearCookie('recoveryToken', cookieBaseOptions);

    res.status(200).json({ message: "Password modificata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});


app.post("/api/upload-news", authenticateJWT, authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { title, content } = req.body;
    const { role } = req.user;

    if (role !== "administrator") {
      return res.status(400).json({ msg: "Non hai i permessi per caricare notizie" });
    }

    if (!req.user || !req.user.user_id) {
      //console.log("ID utente mancante:", req.user);
      return res.status(400).json({ msg: "ID utente mancante" });
    }

    if (!title || !content) {
      return res.status(400).json({ msg: "Titolo e contenuto mancanti" });
    }

    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    const sanitizedContent = DOMPurify.sanitize(content);
    const insertNewsQuery = "INSERT INTO news (user_id, title, content, image) VALUES ($1, $2, $3, $4) RETURNING id";
    const values = [req.user.user_id, title, sanitizedContent, image.filename];

    // begin transaction
    const client = await pool.connect();
    await client.query('BEGIN');

    // Insert the news into the database
    const resNews = await client.query(insertNewsQuery, values);
    const newsId = resNews.rows[0].id;

    // update news read status
    const updateReadStatusQuery = `
      INSERT INTO news_read_status (user_id, news_id)
      SELECT u.id, $1
      FROM users u
      LEFT JOIN news_read_status nrs
      ON u.id = nrs.user_id AND $1 = nrs.news_id
      WHERE nrs.id IS NULL;
    `;

    /*La query aggiunge con la LEFT JOIN un record in news_read_status per ogni utente che 
    non ha ancora letto la notizia specificata, garantendo di evitare duplicati grazie alla 
    condizione WHERE nrs.id IS NULL. */

    await client.query(updateReadStatusQuery, [newsId]);

    // complete transaction
    await client.query('COMMIT');
    client.release();

    res.status(200).json({ msg: "Notizia caricata con successo" });

  } catch (error) {
    console.error("Errore nel caricamento della notizia:", error);
    res.status(500).json({ msg: "Errore nel caricamento della notizia" });
  }
});


app.get("/api/news", async (req, res) => {
  try {
    const query = "SELECT * FROM news";
    const result = await pool.query(query);

    const countNews = await pool.query("SELECT COUNT(*) FROM news");

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero delle notizie:", error);
    res.status(500).json({ msg: "Errore nel recupero delle notizie" });
  }
});

app.get("/api/article/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ msg: "Invalid article ID" });
    }

    const query = "SELECT * FROM news WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Article not found" });
    }

    const countNews = await pool.query("SELECT COUNT(*) FROM news");
    const idsResult = await pool.query("SELECT id FROM news");

    // Convert IDs to an array of numbers
    const ids = idsResult.rows.map(row => row.id);
    // Sanitize content with DOMPurify
    result.rows[0].content = DOMPurify.sanitize(result.rows[0].content);

    res.status(200).json({ article: result.rows[0], countnews: countNews.rows[0].count, ids });
  } catch (error) {
    console.error("Errore nel recupero dell'articolo:", error);
    res.status(500).json({ msg: "Errore nel recupero dell'articolo" });
  }
});

app.put("/api/set-news-read/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    console.log("ID della notizia:", id);
    console.log("ID dell'utente:", user_id);

    const query = `UPDATE news_read_status
                  SET is_read = TRUE, read_at = NOW()
                  WHERE user_id = $1 AND news_id = $2`;
    const values = [user_id, id];
    await pool.query(query, values);

    res.status(200).json({ msg: "Notizia impostata come letta correttamente" });

  } catch (error) {
    console.error("Errore nell'impostazione della notizia come letta:", error);
    res.status(500).json({ msg: "Errore nell'impostazione della notizia come letta" });
  }

})

app.get("/api/news-unread", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const query = "SELECT * FROM news JOIN news_read_status ON news.id = news_read_status.news_id WHERE news_read_status.user_id = $1 AND is_read = FALSE";
    const values = [user_id];
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero delle notizie:", error);
    res.status(500).json({ msg: "Errore nel recupero delle notizie" });
  }
})


app.delete("/api/delete-news/:id", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { role } = req.user;
    if (role !== "administrator") {
      return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    const query = "SELECT * FROM news WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Nessun Articolo trovato" });
    }
    // delte image from uploaded folder
    const image = result.rows[0].image;
    const path = `./uploaded_img/${image}`;
    fs.unlinkSync(path);

    //delete article
    const query2 = "DELETE FROM news WHERE id = $1";
    await pool.query(query2, values);
    res.status(200).json({ msg: "Articolo eliminato con successo" });
  } catch (error) {
    console.error("Errore nel cancellamento", error);
    res.status(500).json({ msg: "Errore nel cancellamento" });
  }
});

// create api to apload categriues of a product. categories is an enum
app.get('/api/categories', async (req, res) => {
  try {
    const query = `
          SELECT unnest(enum_range(NULL::category_type)) AS category
      `;
    const result = await pool.query(query);
    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
});

app.post("/api/upload-product", authenticateJWT, authenticateAdmin, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { name, category, tag, info, cod } = req.body;
    const { user_id, role } = req.user;

    if (role !== "administrator") {
      return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    if (!name || !category || !tag || !info || !cod) {
      return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
    }

    const checkCodQuery = "SELECT * FROM products WHERE cod = $1";
    const checkCodValues = [cod];
    const checkCodResult = await pool.query(checkCodQuery, checkCodValues);
    if (checkCodResult.rows.length > 0) {
      return res.status(400).json({ msg: "Codice certificazione già esistente. Inserisci un codice diverso" });
    }

    // set price based on category 
    let price;
    switch (category) {
      case "Certificazione hotel":
        //price = 350;
        price = 0.5;
        break;
      case "Certificazione spa e resorts":
        //price = 350;
        price = 0.5;
        break;
      case "Certificazione trasporti":
        //price = 350;
        price = 0.5;
        break;
      case "Certificazione industria":
        //price = 350;
        price = 0.5;
        break;
      case "Certificazione store e retail":
        //price = 350;
        price = 0.5;
        break;
      case "Certificazione bar e ristoranti":
        //price = 300;
        price = 0.5;
        break;
      default:
        price = 0;
        break;
    }

    // Check if price is valid
    const parsedPrice = parseFloat(price);
    if (parsedPrice <= 0) {
      return res.status(400).json({ msg: "Prezzo non valido" });
    }

    // Check if image is present
    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    if (info.length > 500) {
      return res.status(400).json({ msg: "La descrizione è troppo lunga. Max 100 caratteri" });
    }

    // Create Stripe product
    /*const stripeProduct = await stripe.products.create({
      name: name,
      description: info,
      metadata: {
        category: category,
        tag: tag,
        cod: cod
      }
    });*/

    // Insert product into database
    const query = `
      INSERT INTO products (user_id, name, price, image, info, cod, category, tag, stripe_product_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    const values = [user_id, name, parsedPrice, image.filename, info, cod, category, tag, null];

    await pool.query(query, values);
    logAdminEvent(req, "admin_product_updated", { action: "created", product_cod: cod, category });
    res.status(200).json({ msg: "Certificazione caricata con successo" });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "upload_product" });
    res.status(500).json({ msg: "Errore durante il caricamento della certificazione" });
  }
});



app.get("/api/products-info", async (req, res) => {
  try {
    const { order = "default" } = req.query;  // Aggiungi un valore di default per evitare errori
    // Get the total number of products
    const query = "SELECT COUNT(*) FROM products";
    const result = await pool.query(query);

    // if count is 0, return an empty array
    if (result.rows[0].count === 0) {
      return res.status(200).json({ numProducts: 0, products: [] });
    }

    let query2;
    if (order === "desc") {
      query2 = "SELECT * FROM products ORDER BY price DESC";
    } else if (order === "asc") {
      query2 = "SELECT * FROM products ORDER BY price ASC";
    } else {
      query2 = "SELECT * FROM products"; // Default case
    }

    const result2 = await pool.query(query2);
    res.status(200).json({ numProducts: result.rows[0].count, products: result2.rows });

  } catch (error) {
    console.error("Errore nel recupero dei prodotti", error);
    res.status(500).json({ msg: "Errore nel recupero dei prodotti" });
  }
});


app.get("/api/product-details/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "SELECT * FROM products WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Nessuna certificazione trovata" });
    }
    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Errore nel recupero della certificazione", error);
    res.status(500).json({ msg: "Errore nel recupero della certificazione" });
  }
})

app.delete("/api/delete-product/:id", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== "administrator") {
      return res.status(400).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    const query = "SELECT * FROM products WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Nessuna certificazione trovato" });
    }
    // delte image from uploaded folder
    const image = result.rows[0].image;
    const path = `./uploaded_img/${image}`;
    fs.unlinkSync(path);

    //delete article
    const query2 = "DELETE FROM products WHERE id = $1";
    await pool.query(query2, values);
    logAdminEvent(req, "admin_product_updated", { action: "deleted", product_id: Number(id) });
    res.status(200).json({ msg: "Certificazione eliminata con successo" });
  } catch (error) {
    console.error("Errore nel cancellamento", error);
    res.status(500).json({ msg: "Errore nel cancellamento" });
  }
});

app.post("/api/cart-insertion/:id", async (req, res) => {
  try {
    const { id } = req.params; // ID della certificazione
    const { name, image, price, quantity, option } = req.body;
    console.log("Dati ricevuti:", req.body);

    if (req.cookies.accessToken) {
      await new Promise((resolve, reject) => {
        authenticateJWT(req, res, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    const user_id = req.user?.user_id; // Obtain the user ID from the JWT if needed

    // Check if user_id or session_id is present
    if (!user_id && !req.cookies.sessionId) {
      return res.status(400).json({ msg: "Devi essere autenticato o avere un id di sessione per inserire nel carrello" });
    }

    if (!option) {
      return res.status(400).json({ msg: "Opzione mancante. Scegline una" });
    }

    const categoryQuery = "SELECT category FROM products WHERE id = $1";
    const categoryResult = await pool.query(categoryQuery, [id]);
    const category = categoryResult.rows[0].category;
    let finalPrice = price;

    // Calculate final price based on category
    switch (category) {
      case "Certificazione hotel":
        finalPrice = pricingFunctions.getHotelPrice(option, price);
        break;
      case "Certificazione spa e resorts":
        finalPrice = pricingFunctions.getSpaPrice(option, price);
        break;
      case "Certificazione trasporti":
        finalPrice = pricingFunctions.getTransportPrice(option, price);
        break;
      case "Certificazione industria":
        finalPrice = pricingFunctions.getIndustryPrice(option, price);
        break;
      case "Certificazione store e retail":
        finalPrice = pricingFunctions.getStorePrice(option, price);
        break;
      case "Certificazione bar e ristoranti":
        finalPrice = pricingFunctions.getBarPrice(option, price);
        break;
      default:
        return res.status(400).json({ msg: "Categoria non valida" });
    }

    //console.log("Final price:", finalPrice);

    // Check if the product exists
    const productQuery = "SELECT * FROM products WHERE id = $1";
    const productResult = await pool.query(productQuery, [id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ msg: "Certificazione non trovata" });
    }

    // Prevent repurchase of already owned certifications for authenticated users.
    if (user_id) {
      const alreadyPurchasedQuery = `
        SELECT 1
        FROM orders
        WHERE user_id = $1 AND product_id = $2
        LIMIT 1
      `;
      const alreadyPurchasedResult = await pool.query(alreadyPurchasedQuery, [user_id, id]);
      if (alreadyPurchasedResult.rows.length > 0) {
        return res.status(409).json({ msg: "Hai già acquistato questo prodotto" });
      }
    }

    // Check if the product is already in the cart
    let cartQuery;
    let cartValues;

    if (user_id) {
      // Control for authenticated users
      cartQuery = "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2";
      cartValues = [user_id, id];
    } else {
      // Control for anonymous users
      cartQuery = "SELECT * FROM cart WHERE session_id = $1 AND product_id = $2";
      cartValues = [req.cookies.sessionId, id];
    }

    const cartResult = await pool.query(cartQuery, cartValues);

    if (cartResult.rows.length > 0) {
      return res.status(400).json({ msg: "La certificazione è già nel carrello" });
    }

    // Insert the product into the cart
    let insertQuery;
    let insertValues;

    if (user_id) {
      // Insert into the cart for authenticated users
      insertQuery = "INSERT INTO cart (user_id, product_id, name, image, quantity, option, price) VALUES ($1, $2, $3, $4, $5, $6, $7)";
      insertValues = [user_id, id, name, image, quantity, option, finalPrice];
    } else {
      // Insert into the cart for anonymous users
      insertQuery = "INSERT INTO cart (session_id, product_id, name, image, quantity, option, price) VALUES ($1, $2, $3, $4, $5, $6, $7)";
      insertValues = [req.cookies.sessionId, id, name, image, quantity, option, finalPrice];
    }

    await pool.query(insertQuery, insertValues);

    res.status(200).json({ msg: "Certificazione aggiunta al carrello con successo" });
  } catch (error) {
    console.error("Errore nell'aggiungere la certificazione al carrello:", error);
    res.status(500).json({ msg: "Errore nell'aggiungere la certificazione al carrello" });
  }
});


app.get("/api/fetch-user-cart", async (req, res) => {
  try {

    if (req.cookies.accessToken) {
      await new Promise((resolve, reject) => {
        authenticateJWT(req, res, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    const user_id = req.user?.user_id; // Obtain the user ID from the JWT if needed
    console.log("User ID:", user_id);
    const session_id = req.cookies.sessionId;
    //console.log("User ID:", user_id);
    //console.log("Session ID:", session_id);


    let query;
    let values;
    let query2;


    if (user_id) {
      query = "SELECT cart.product_id AS product_id, cart.quantity AS quantity, products.name AS name, products.image AS image, cart.price AS price, cart.option AS option, products.category AS category FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = $1";
      query2 = "SELECT COUNT(*) FROM cart WHERE user_id = $1";
      values = [user_id];
    } else {
      query = "SELECT cart.product_id AS product_id, cart.quantity AS quantity, products.name AS name, products.image AS image, cart.price AS price, cart.option AS option, products.category AS category FROM cart JOIN products ON cart.product_id = products.id WHERE cart.session_id = $1";
      query2 = "SELECT COUNT(*) FROM cart WHERE session_id = $1";
      values = [session_id];
    }


    const result = await pool.query(query, values);
    const result2 = await pool.query(query2, values);
    res.status(200).json({ cart: result.rows, count: result2.rows[0].count });

  } catch (error) {
    console.error("Errore nel recupero del carrello:", error);
    res.status(500).json({ msg: "Errore nel recupero del carrello" });
  }
})

app.put("/api/update-quantity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (req.cookies.accessToken) {
      await new Promise((resolve, reject) => {
        authenticateJWT(req, res, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    const user_id = req.user?.user_id;
    const session_id = req.cookies.sessionId;

    let query;
    let values;

    if (user_id) {
      query = "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3";
      values = [quantity, user_id, id];
    } else {
      query = "UPDATE cart SET quantity = $1 WHERE session_id = $2 AND product_id = $3";
      values = [quantity, session_id, id];
    }

    await pool.query(query, values);
    res.status(200).json({ msg: "Quantità aggiornata correttamente" });
  } catch (error) {
    console.error("Errore nell'aggiornare la quantità:", error);
    res.status(500).json({ msg: "Errore nell'aggiornare la quantità" });
  }
})

app.delete("/api/remove-from-cart/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (req.cookies.accessToken) {
      await new Promise((resolve, reject) => {
        authenticateJWT(req, res, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    const user_id = req.user?.user_id;
    const session_id = req.cookies.sessionId;

    let query;
    let values;


    if (user_id) {
      query = "DELETE FROM cart WHERE user_id = $1 AND product_id = $2";
      values = [user_id, id];
    } else {
      query = "DELETE FROM cart WHERE session_id = $1 AND product_id = $2";
      values = [session_id, id];
    }

    const result = await pool.query(query, values);
    res.status(200).json({ msg: "Certificazione rimossa dal carrello con successo" });
  } catch (error) {
    console.error("Errore nel rimuovere la certificazione dal carrello:", error);
    res.status(500).json({ msg: "Errore nel rimuovere la certificazione dal carrello" });
  }
});

app.post("/api/send-message", async (req, res) => {
  try {
    const { name, email, company_name, phone, subject, message } = req.body;

    const query = "INSERT INTO contacts (name_surname, email, company_name, phone_number, subject, message) VALUES ($1, $2, $3, $4, $5, $6)";
    const values = [name, email, company_name, phone, subject, message];
    await pool.query(query, values);
    res.status(200).json({ msg: "Messaggio inviato con successo" });
  } catch (error) {
    console.error("Errore nell'invio del messaggio:", error);
    res.status(500).json({ msg: "Errore nell'invio del messaggio" });
  }
});

app.get("/api/messages", authenticateJWT, async (req, res) => {

  try {
    const query = "SELECT * FROM contacts";
    const result = await pool.query(query);

    // if no rows are found, return anything
    if (result.rows.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    const query2 = "SELECT COUNT(*) FROM contacts";
    const result2 = await pool.query(query2);
    res.status(200).json({ messages: result.rows, count: result2.rows[0].count });

  } catch (error) {
    console.error("Errore nel recupero dei messaggi:", error);
    res.status(500).json({ msg: "Errore nel recupero dei messaggi" });
  }
})

app.delete("/api/delete-message/:id", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== "administrator") {
      return res.status(400).json({ msg: "Non hai i permessi per eliminare questo messaggio" });
    }

    const query = "DELETE FROM contacts WHERE id = $1";
    const values = [id];
    await pool.query(query, values);

    res.status(200).json({ msg: "Messaggio eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione del messaggio:", error);
    res.status(500).json({ msg: "Errore nell'eliminazione del messaggio" });
  }
})

app.put("/api/edit-news/:id", authenticateJWT, authenticateAdmin, upload.single("image"), async (req, res) => {

  try {
    const { title, content } = req.body;
    const image = req.file;
    const { id } = req.params;
    const { role } = req.user;
    if (role !== "administrator") {
      return res.status(400).json({ msg: "Non hai i permessi per modificare le notizie" });
    }

    if (!title || !content) {
      return res.status(400).json({ msg: "Titolo e contenuto mancanti" });
    }

    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    //remove previous image from updated_img
    const query_img = "SELECT image FROM news WHERE id = $1";
    const values_img = [id];
    const result_img = await pool.query(query_img, values_img);
    const previous_image = result_img.rows[0].image;
    const path = `./uploaded_img/${previous_image}`;
    fs.unlinkSync(path);

    const query = "UPDATE news SET (title, content, image) = ($1, $2, $3) WHERE id = $4";
    const values = [title, content, image?.filename, id];
    await pool.query(query, values);

    const query2 = "SELECT * FROM news WHERE id = $1";
    const values2 = [id];
    const result = await pool.query(query2, values2);
    res.status(200).json({ msg: "Notizie aggiornate correttamente", tuple: result.rows });
  } catch (error) {
    console.error("Errore nell'aggiornare le notizie:", error);
    res.status(500).json({ msg: "Errore nell'aggiornare le notizie" });
  }
})

app.put("/api/edit-product/:id", authenticateJWT, authenticateAdmin, upload.single("image"), async (req, res) => {

  try {
    const { name, price, info, cod, category, tag } = req.body;
    const image = req.file;
    const { id } = req.params;
    const { role, user_id } = req.user;
    if (role !== "administrator") {
      return res.status(400).json({ msg: "Non hai i permessi per modificare le certificazioni" });
    }

    if (!name || !price || !info || !cod || !category || !tag) {
      return res.status(400).json({ msg: "I campi nome, prezzo, info, codice, categoria e tag sono obbligatori" });
    }

    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    //remove previous image from updated_img
    const query_img = "SELECT image FROM products WHERE id = $1";
    const values_img = [id];
    const result_img = await pool.query(query_img, values_img);
    const previous_image = result_img.rows[0].image;
    const path = `./uploaded_img/${previous_image}`;
    fs.unlinkSync(path);

    const query = "UPDATE products SET (name, price, image, info, cod, category, tag) = ($1, $2, $3, $4, $5, $6, $7) WHERE id = $8 AND user_id = $9";
    const values = [name, price, image?.filename, info, cod, category, tag, id, user_id];
    const result = await pool.query(query, values);
    logAdminEvent(req, "admin_product_updated", { action: "updated", product_id: Number(id) });
    res.status(200).json({ msg: "Certificazione aggiornata con successo", tuple: result.rows });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "edit_product" });
    res.status(500).json({ msg: "Errore nell'aggiornare le certificazioni" });
  }
})

app.post("/api/create-promo-code", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { code, discount, start, expiration, category } = req.body;
    if (!code || !discount || !start || !expiration || !category) {
      return res.status(400).json({ msg: "Completa tutti i campi" });
    } else if (code.length > 20) {
      return res.status(400).json({ msg: "Il codice non deve superare i 20 caratteri" });
    } else if (start > expiration) {
      return res.status(400).json({ msg: "La data di inizio non deve superare la data di fine" });
    } else if (start < Date.now()) {
      return res.status(400).json({ msg: "Data di inizio non corretta" });
    }

    const date = new Date(expiration);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const query = "INSERT INTO promocodes (code, discount, used_by, start, expiration) VALUES ($1, $2, $3, $4, $5)";
    const values = [code, discount, category, start, formattedDate];
    const result = await pool.query(query, values);
    res.status(200).json({ msg: "Codice promozionale aggiunto con successo" });
  } catch (error) {
    console.error("Errore nell'inserimento del codice:", error);
    res.status(500).json({ msg: "Errore nell'inserimento del codice" });
  }
})

app.get("/api/fetch-promo-codes", authenticateJWT, authenticateAdmin, async (req, res) => {

  try {
    const query = "SELECT * FROM promocodes";
    const result = await pool.query(query);
    res.status(200).json({ promocodes: result.rows });
  } catch (error) {
    console.error("Errore nell'aggiornare caricare le certificazioni:", error);
    res.status(500).json({ msg: "Errore nell'aggiornare le certificazioni" });
  }
})

app.get("/api/fetch-published-assinged-codes", authenticateJWT, async (req, res) => {

  try {
    const { user_id } = req.user;

    const query = "SELECT code, used_by FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id";
    const result = await pool.query(query);

    //fetch users's assigned codes
    const query2 = "SELECT code, used_by FROM promocodes_assignments JOIN promocodes ON promocodes_assignments.promocode_id = promocodes.id WHERE promocodes_assignments.user_id = $1";
    const values2 = [user_id];
    const result2 = await pool.query(query2, values2);

    if (result2.rows.length > 0) {
      result.rows = [...result.rows, ...result2.rows]; // Concatenate the results
    }

    res.status(200).json({ codes: result.rows });
  } catch (error) {
    console.error("Errore nell fetching dei codici pubblicati:", error);
    res.status(500).json({ msg: "Errore nell fetching dei codici pubblicati" });
  }
})

app.post("/api/publish-promo-code/:id", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se il codice è già pubblicato
    const check = "SELECT * FROM promocodes_publishment WHERE promocode_id = $1";
    const queryCheck = await pool.query(check, [id]);
    if (queryCheck.rows.length > 0) {
      return res.status(400).json({ msg: "Codice promozionale già pubblicato." });
    }

    // Inserisce il codice nella tabella
    const query = "INSERT INTO promocodes_publishment (promocode_id) VALUES ($1)";
    await pool.query(query, [id]);

    // Risposta di successo
    res.status(200).json({ msg: "Certificazione pubblicata con successo" });
  } catch (error) {
    console.error("Errore durante la pubblicazione del codice promozionale:", error);
    res.status(500).json({ msg: "Errore interno del server durante la pubblicazione del codice promozionale." });
  }
});

app.get("/api/fetch-users-not-assigned-codes/:codeId", authenticateJWT, authenticateAdmin, async (req, res) => {

  try {
    const { codeId } = req.params;
    const query = "SELECT username, company_name FROM users WHERE id NOT IN (SELECT user_id FROM promocodes_assignments WHERE promocode_id = $1)";
    const values = [codeId];
    const result = await pool.query(query, values);
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error("Errore nel trovare gli utenti:", error);
    res.status(500).json({ msg: "Errore nel trovare gli utenti" });
  }
})

app.post("/api/assign-promo-code-to-users/:id", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedUsers } = req.body;

    console.log("Selected users:", selectedUsers);

    for (const user of selectedUsers) {
      // Recupera l'ID dell'utente
      const fetchUserId = "SELECT id FROM users WHERE username = $1";
      const values = [user];
      const userResult = await pool.query(fetchUserId, values);

      if (userResult.rows.length === 0) {
        throw new Error(`Utente con username ${user} non trovato.`);
      }

      const userID = userResult.rows[0].id;

      // Assegna il codice promozionale
      const query = "INSERT INTO promocodes_assignments (promocode_id, user_id) VALUES ($1, $2)";
      await pool.query(query, [id, userID]);
    }

    res.status(200).json({ msg: `Codice promozionale assegnato agli utenti (${selectedUsers.join(", ")}) con successo` });
  } catch (error) {
    console.error("Errore durante l'assegnazione del codice promozionale agli utenti:", error);
    res.status(500).json({ msg: "Errore interno del server durante l'assegnazione del codice promozionale agli utenti." });
  }
});



app.post("/api/apply-promo-code", authenticateJWT, async (req, res) => {

  try {
    const { code } = req.body;
    const { user_id } = req.user;

    if (!code) {
      logPaymentEvent(req, "validation_failed", { flow: "promo_apply", reason: "missing_code" }, "warn");
      return res.status(400).json({ msg: "Nessun codice inserito" });
    }
    const query = "SELECT * FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id WHERE code = $1";
    const values = [code];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      logPaymentEvent(req, "promo_code_rejected", { reason: "not_found", user_id }, "warn");
      return res.status(400).json({ msg: "Codice non esistente" });
    }

    const used_by = result.rows[0].used_by;
    const discount = result.rows[0].discount;
    const code_id = result.rows[0].id;

    if (used_by === "Tutti") {
      logPaymentEvent(req, "promo_code_applied", { user_id, code_id, scope: "all" });
      return res.status(200).json({ msg: "Codice valido, lo sconto verra applicato sui prodotti relativi", discount: result.rows[0].discount, used_by: used_by, discount: discount, code_id: code_id });
    }

    const queryCheck = await pool.query("SELECT category FROM cart JOIN products on cart.product_id = products.id WHERE cart.user_id = $1", [user_id]);
    const cartCategories = queryCheck.rows.map(row => row.category);
    if (cartCategories.includes(used_by)) {
      logPaymentEvent(req, "promo_code_applied", { user_id, code_id, scope: "category" });
      return res.status(200).json({ msg: "Codice valido, lo sconto verra applicato sui prodotti relativi", discount: result.rows[0].discount, used_by: used_by, discount: discount, code_id: code_id });
    }

    logPaymentEvent(req, "promo_code_rejected", { reason: "cart_category_mismatch", user_id, code_id }, "warn");
    return res.status(400).json({ msg: "Codice non valido per le certificazioni inserite nel carrello" });

  } catch (error) {
    logUnexpectedError(req, error, { flow: "promo_apply" });
    res.status(500).json({ msg: "Errore" });
  }

})

app.post("/api/get-code-id", authenticateJWT, async (req, res) => {

  try {
    const { code } = req.body;
    if (code === "") {
      res.status(200).json({ msg: "nessun codice inserito" });
    } else {
      const query = "SELECT promocode_id FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id WHERE code = $1";
      const values = [code];
      const result = await pool.query(query, values);

      res.status(200).json({ codeId: result.rows[0].promocode_id });
    }


  } catch (error) {
    console.error("Errore nella richiesta dell'id del codice:", error);
    res.status(500).json({ msg: "Errore" });
  }
})

app.delete("/api/delete-promo-code/:id", authenticateJWT, authenticateAdmin, async (req, res) => {

  try {
    const { id } = req.params;
    //console.log(`ID: ${id}`);
    const query = "DELETE FROM promocodes WHERE id = $1";
    await pool.query(query, [id]);
    res.status(200).json({ msg: "Certificazione eliminata con successo" });
  } catch (error) {
    console.error("Errore nella cancellazione del codice:", error);
    res.status(500).json({ msg: "Errore nella cancellazione del codice" });
  }
})


app.post("/api/checkout-session", authenticateJWT, async (req, res) => {
  try {
    const { promoCode, products } = req.body;
    const { user_id } = req.user;

    // check if the promo code is valid
    let promo = null;
    if (promoCode) {
      const promoQuery = "SELECT * FROM promocodes WHERE code = $1 AND start <= CURRENT_DATE AND expiration >= CURRENT_DATE";
      const promoValues = [promoCode];
      const promoResult = await pool.query(promoQuery, promoValues);

      if (promoResult.rows.length > 0) {
        promo = promoResult.rows[0];
      } else {
        logPaymentEvent(req, "promo_code_rejected", { reason: "invalid_or_expired_checkout", user_id }, "warn");
        return res.status(400).json({ msg: "Codice promozionale non valido" });
      }
    }

    // Calculate the total price
    const items = [];

    for (const product of products) {
      const { id, name, image, price, quantity } = product;

      // fetch the product from the database
      const productQuery = "SELECT * FROM products WHERE id = $1";
      const productValues = [id];
      const productResult = await pool.query(productQuery, productValues);

      if (productResult.rows.length === 0) {
        return res.status(400).json({ msg: `Certificazione con ID ${id} non trovata` });
      }

      const productInfo = productResult.rows[0];

      let productPrice = price; // default price

      if (promo) {
        if (promo.used_by === "Tutti" || promo.used_by.includes(productInfo.category)) {
          // Apply the promo code to compatible products
          productPrice = price * (1 - promo.discount / 100);
        }
      }

      // Round the price to the nearest cent
      const finalPriceInCents = Math.round(productPrice * 100);
      ////console.log("product image: ", image)
      //const path = `http://localhost:8080/uploaded_img/${image}`
      ////console.log("path: ", path)


      items.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: name
            //images: [path],
          },
          unit_amount: finalPriceInCents,
        },
        quantity: quantity,
      });
    }

    // Prefer the frontend origin that initiated checkout (useful in local/dev),
    // then fallback to CLIENT_URL from env.
    let clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (req.headers.origin) {
      try {
        const parsedOrigin = new URL(req.headers.origin);
        clientBaseUrl = `${parsedOrigin.protocol}//${parsedOrigin.host}`;
      } catch (parseError) {
        req.log?.warn({ event: "validation_failed", reason: "invalid_origin_header" });
      }
    }
    clientBaseUrl = clientBaseUrl.replace(/\/$/, '');

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      success_url: `${clientBaseUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientBaseUrl}/Cart`,
      metadata: {
        user_id: user_id,
        promo_code: promoCode || '',
      },
    });

    const cartSnapshot = [];
    for (const product of products) {
      const cartRow = await pool.query(
        "SELECT quantity, price FROM cart WHERE user_id = $1 AND product_id = $2",
        [user_id, product.id],
      );
      if (cartRow.rows.length > 0) {
        cartSnapshot.push({
          product_id: product.id,
          quantity: cartRow.rows[0].quantity,
          price: parseFloat(cartRow.rows[0].price),
        });
      }
    }

    await pool.query(
      `INSERT INTO checkout_sessions (stripe_session_id, user_id, cart_snapshot, code_id)
       VALUES ($1, $2, $3, $4)`,
      [session.id, user_id, JSON.stringify(cartSnapshot), promo?.id || null],
    );

    logPaymentEvent(req, "payment_checkout_session_created", {
      user_id,
      stripe_session_id: session.id,
      line_item_count: items.length,
      has_promo: !!promoCode,
    });
    res.status(200).json({ url: session.url });
  } catch (error) {
    rootLogger.error(
      {
        event: "unexpected_error",
        flow: "stripe_checkout",
        err: { message: error.message, type: error.type, code: error.code },
      },
      "stripe checkout session failed",
    );
    res.status(500).json({ msg: "Errore durante la creazione della sessione di checkout" });
  }
});


app.post("/api/finalize-checkout-session", authenticateJWT, async (req, res) => {
  const client = await pool.connect();
  try {
    const { sessionId } = req.body;
    const { user_id } = req.user;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ msg: "ID sessione di checkout mancante." });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      "SELECT * FROM checkout_sessions WHERE stripe_session_id = $1 FOR UPDATE",
      [sessionId],
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ msg: "Sessione di checkout non trovata." });
    }

    const checkoutSession = rows[0];

    if (checkoutSession.user_id !== user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ msg: "Accesso negato." });
    }

    if (checkoutSession.status === 'finalized') {
      await client.query('COMMIT');
      return res.status(200).json({ msg: "Ordine già finalizzato.", alreadyFinalized: true });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(402).json({ msg: "Pagamento non completato." });
    }

    const cartSnapshot = checkoutSession.cart_snapshot;
    const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const item of cartSnapshot) {
      await client.query(
        "INSERT INTO orders (quantity, price, user_id, product_id, code_id, order_date) VALUES ($1, $2, $3, $4, $5, $6)",
        [item.quantity, item.price, user_id, item.product_id, checkoutSession.code_id, orderDate],
      );
    }

    await client.query("DELETE FROM cart WHERE user_id = $1", [user_id]);

    await client.query(
      "UPDATE checkout_sessions SET status = 'finalized', finalized_at = NOW() WHERE id = $1",
      [checkoutSession.id],
    );

    await client.query('COMMIT');

    logPaymentEvent(req, "checkout_session_finalized", {
      user_id,
      stripe_session_id: sessionId,
      product_count: cartSnapshot.length,
    });

    res.status(200).json({ msg: "Ordine creato con successo." });
  } catch (error) {
    await client.query('ROLLBACK');
    logUnexpectedError(req, error, { flow: "finalize_checkout_session" });
    res.status(500).json({ msg: "Errore durante la finalizzazione dell'ordine." });
  } finally {
    client.release();
  }
});


app.post("/api/create-order", authenticateJWT, async (req, res) => {
  try {
    const { orderData, codeID } = req.body;
    const { user_id } = req.user;

    for (const id of orderData) {
      // Recover the quantity and price of the product
      const query = "SELECT quantity, price FROM cart WHERE user_id = $1 AND product_id = $2";
      const values = [user_id, id];
      const result = await pool.query(query, values);

      // Check if the product is in the cart
      if (result.rows.length === 0) {
        return res.status(404).json({ msg: `Certificazione con ID ${id} non trovato nel carrello.` });
      }

      const quantity = result.rows[0].quantity;
      const price = result.rows[0].price;
      const order_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const queryCheck = "SELECT * FROM orders WHERE user_id = $1 AND product_id = $2";
      const existingOrder = await pool.query(queryCheck, [user_id, id]);

      /*if (existingOrder.rows.length > 0) {
        return res.status(400).json({ msg: `Ordine già esistente per il prodotto ID ${id}.` });
      }*/


      const query2 = "INSERT INTO orders (quantity, price, user_id, product_id, code_id, order_date) VALUES ($1, $2, $3, $4, $5, $6)";
      const values2 = [quantity, price, user_id, id, codeID, order_date];
      await pool.query(query2, values2);
    }

    logPaymentEvent(req, "order_created", {
      user_id,
      product_id_count: Array.isArray(orderData) ? orderData.length : 0,
      promo_code_id: codeID ?? null,
    });
    res.status(201).json({ msg: "Ordine creato con successo." });

  } catch (error) {
    logUnexpectedError(req, error, { flow: "create_order" });
    res.status(500).json({ msg: "Errore durante la creazione dell'ordine" });
  }
});

app.get("/api/user-orders", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    const query = `
          SELECT 
              orders.id AS order_id, 
              orders.quantity AS quantity, 
              orders.price AS price, 
              orders.order_date AS order_date, 
              products.name AS product_name, 
              products.image AS product_image 
          FROM 
              orders 
          JOIN 
              products ON orders.product_id = products.id 
          WHERE 
              orders.user_id = $1
      `;
    const values = [user_id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(200).json({ msg: "Nessun ordine trovato" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero degli ordini:", error);
    res.status(500).json({ msg: "Errore nel recupero degli ordini" });
  }
});

app.get("/api/all-orders", authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { user_id, role } = req.user;

    if (role !== "administrator") {
      return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    const query = `
          SELECT
              users.username AS username,
              users.company_name AS company_name, 
              users.phone_number AS phone_number,
              orders.id AS order_id, 
              orders.quantity AS quantity, 
              orders.price AS price, 
              orders.order_date AS order_date, 
              products.name AS product_name, 
              products.image AS product_image 
          FROM 
              orders 
          JOIN 
              products ON orders.product_id = products.id
          JOIN
              users ON orders.user_id = users.id
      `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ msg: "Nessun ordine trovato" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero degli ordini:", error);
    res.status(500).json({ msg: "Errore nel recupero degli ordini" });
  }
});



app.delete("/api/remove-user-cart", authenticateJWT, async (req, res) => {

  try {
    const { user_id } = req.user;

    const queryCart = "SELECT image FROM cart WHERE user_id = $1";
    const valuesCart = [user_id];
    const resultCart = await pool.query(queryCart, valuesCart);
    const image = resultCart.rows[0].image;


    const query = "DELETE FROM cart WHERE user_id = $1";
    const values = [user_id];
    await pool.query(query, values);
    res.status(200).json({ msg: "Carrello cancellato con successo" });
  } catch (error) {
    console.error("Errore nella rimozione degli articoli utente dal carrello:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
})


app.post("/api/send-message-response", authenticateJWT, authenticateAdmin, async (req, res) => {

  try {
    const { emailTitle, emailContent, receiverEmail } = req.body;
    const { role, user_id } = req.user;

    if (role !== "administrator") {
      return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    if (!emailTitle || !emailContent) {
      return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
    }

    if (!receiverEmail) {
      return res.status(400).json({ msg: "Problemi nel reperire l'email del destinatario" });
    }

    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE email = $1",
      [receiverEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Non esiste un utente con questa email" });
    }

    const { username } = result.rows[0];

    const myUsername = "SELECT username FROM users WHERE id = $1";
    const values = [user_id];
    const result2 = await pool.query(myUsername, values);
    if (result2.rows.length === 0) {
      return res.status(400).json({ msg: "Non esiste un utente con questo ID" });
    }

    const admin_username = result2.rows[0].username

    sendEmailResponse({
      recipient_email: receiverEmail,
      email_title: emailTitle,
      email_content: emailContent,
      receiver_username: username,
      admin_username: admin_username
    });

    return res.status(200).json({ msg: "Email di risposta inviata correttamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Errore interno del server" });
  }

})


app.post("/api/upload-building", authenticateJWT, async (req, res) => {
  try {
    const {
      name,
      address,
      usage,
      year,
      area,
      location,
      renovation,
      heating,
      ventilation,
      energyControl,
      maintenance,
      waterRecovery,
      electricityCounter,
      electricityAnalyzer,
      lighting,
      led,
      gasLamp,
      autoLightingControlSystem,
      electricForniture,

      ateco,
      activityDescription,
      annualTurnover,
      employees,
      prodProcessDescription,
      country,
      region,
      cap,
      municipality,
      street,
      streetNumber,
      climateZone,
      constructionYearValue,
      contractPowerClass,
    } = req.body;

    const nameNormalized = typeof name === "string" ? name.trim() : "";
    const usageNormalized = typeof usage === "string" ? usage.trim() : "";
    const locationNormalized = firstNonEmpty(
      typeof region === "string" ? region.trim() : null,
      typeof location === "string" ? location.trim() : null,
    );
    const countryNormalized =
      typeof country === "string" && country.trim() !== "" ? country.trim() : "Italia";
    const capNormalized =
      cap === null || cap === undefined || String(cap).trim() === "" ? null : String(cap).trim();
    const municipalityNormalized =
      municipality === null || municipality === undefined || String(municipality).trim() === ""
        ? null
        : String(municipality).trim();
    const streetNormalized =
      street === null || street === undefined || String(street).trim() === ""
        ? null
        : String(street).trim();
    const streetNumberNormalized =
      streetNumber === null || streetNumber === undefined || String(streetNumber).trim() === ""
        ? null
        : String(streetNumber).trim();
    const climateZoneNormalized =
      climateZone === null || climateZone === undefined || String(climateZone).trim() === ""
        ? null
        : String(climateZone).trim().toUpperCase();
    const constructionYearValueNormalized =
      constructionYearValue === null || constructionYearValue === undefined || String(constructionYearValue).trim() === ""
        ? null
        : Number(constructionYearValue);
    const contractPowerClassNormalized = firstNonEmpty(
      typeof contractPowerClass === "string" ? contractPowerClass.trim() : null,
      typeof electricityCounter === "string" ? electricityCounter.trim() : null,
    );
    const addressNormalized = composeLegacyBuildingAddress({
      address: typeof address === "string" ? address.trim() : "",
      street: streetNormalized,
      streetNumber: streetNumberNormalized,
      municipality: municipalityNormalized,
      cap: capNormalized,
      location: locationNormalized,
      country: countryNormalized,
    });
    const yearNormalized = deriveConstructionYearLabel(constructionYearValueNormalized, year);
    const ventilationNormalized = firstNonEmpty(
      typeof ventilation === "string" ? ventilation.trim() : null,
      "No"
    );
    const autoLightingControlSystemNormalized = firstNonEmpty(
      typeof autoLightingControlSystem === "string" ? autoLightingControlSystem.trim() : null,
    ) || "";
    const electricityAnalyzerNormalized = firstNonEmpty(
      typeof electricityAnalyzer === "string" ? electricityAnalyzer.trim() : null,
    );
    const electricFornitureNormalized = firstNonEmpty(
      typeof electricForniture === "string" ? electricForniture.trim() : null,
    );
    const energyControlNormalized = firstNonEmpty(
      typeof energyControl === "string" ? energyControl.trim() : null,
    );
    const maintenanceNormalized = firstNonEmpty(
      typeof maintenance === "string" ? maintenance.trim() : null,
    );
    const waterRecoveryNormalized = firstNonEmpty(
      typeof waterRecovery === "string" ? waterRecovery.trim() : null,
    );
    const heatingNormalized = firstNonEmpty(
      typeof heating === "string" ? heating.trim() : null,
    );
    const renovationNormalized = firstNonEmpty(
      typeof renovation === "string" ? renovation.trim() : null,
    );
    const lightingNormalized =
      lighting === undefined || lighting === null || lighting === "" ? 0 : Number(lighting);
    const ledNormalized =
      led === undefined || led === null || led === "" ? 0 : Number(led);
    const gasLampNormalized =
      gasLamp === undefined || gasLamp === null || gasLamp === "" ? 0 : Number(gasLamp);
    const atecoNormalized =
      ateco === null || ateco === undefined || String(ateco).trim() === ""
        ? null
        : String(ateco).trim();
    const activityDescriptionNormalized =
      activityDescription === null || activityDescription === undefined || String(activityDescription).trim() === ""
        ? null
        : String(activityDescription).trim();
    const prodProcessDescriptionNormalized =
      prodProcessDescription === null || prodProcessDescription === undefined || String(prodProcessDescription).trim() === ""
        ? null
        : String(prodProcessDescription).trim();
    const annualTurnoverNormalized =
      annualTurnover === null || annualTurnover === undefined || String(annualTurnover).trim() === ""
        ? null
        : Number(annualTurnover);
    const employeesNormalized =
      employees === null || employees === undefined || String(employees).trim() === ""
        ? null
        : Number(employees);

    const overflowValidation = [
      { value: nameNormalized, max: 255, message: "Il campo 'Nome' deve avere massimo 255 caratteri." },
      { value: addressNormalized, max: 255, message: "Il campo 'Indirizzo' deve avere massimo 255 caratteri." },
      { value: usageNormalized, max: 50, message: "Il campo 'Destinazione d'uso' deve avere massimo 50 caratteri." },
      { value: municipalityNormalized, max: 255, message: "Il campo 'Comune' deve avere massimo 255 caratteri." },
      { value: streetNormalized, max: 255, message: "Il campo 'Via/Piazza' deve avere massimo 255 caratteri." },
      { value: activityDescriptionNormalized, max: 300, message: "Il campo 'Descrizione attività' deve avere massimo 300 caratteri." },
      { value: prodProcessDescriptionNormalized, max: 300, message: "Il campo 'Descrizione processi produttivi' deve avere massimo 300 caratteri." },
    ];

    for (const check of overflowValidation) {
      if (check.value && check.value.length > check.max) {
        logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "field_overflow" }, "warn");
        return res.status(400).json({ msg: check.message });
      }
    }

    // `buildings.ateco` is VARCHAR(8) in the DB.
    if (atecoNormalized && atecoNormalized.length > 8) {
      logBuildingEvent(
        req,
        "validation_failed",
        { flow: "building_create", reason: "invalid_ateco_length" },
        "warn"
      );
      return res.status(400).json({
        msg: "Il campo 'Codice Ateco' deve avere massimo 8 caratteri.",
      });
    }

    if (employeesNormalized !== null && !Number.isInteger(employeesNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_employees" }, "warn");
      return res.status(400).json({ msg: "Il campo 'Numero dipendenti' deve essere un numero intero." });
    }

    if (annualTurnoverNormalized !== null && !Number.isInteger(annualTurnoverNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_turnover" }, "warn");
      return res.status(400).json({ msg: "Il campo 'Fatturato annuo' deve essere un numero intero." });
    }

    if (capNormalized && !/^\d{5}$/.test(capNormalized)) {
      return res.status(400).json({ msg: "Il campo 'CAP' deve contenere 5 cifre." });
    }

    if (constructionYearValueNormalized !== null) {
      if (!Number.isInteger(constructionYearValueNormalized) || String(constructionYearValueNormalized).length !== 4) {
        return res.status(400).json({ msg: "Il campo 'Anno di costruzione' deve contenere 4 cifre." });
      }
    }

    const completionIssues = getBuildingCompletionIssues({
      name: nameNormalized,
      address: addressNormalized,
      usage: usageNormalized,
      year: yearNormalized,
      area,
      location: locationNormalized,
      renovation: renovationNormalized,
      heating: heatingNormalized,
      energyControl: energyControlNormalized,
      maintenance: maintenanceNormalized,
      waterRecovery: waterRecoveryNormalized,
      contractPowerClass: contractPowerClassNormalized,
      electricityAnalyzer: electricityAnalyzerNormalized,
      electricForniture: electricFornitureNormalized,
      cap: capNormalized,
      municipality: municipalityNormalized,
      street: streetNormalized,
    });

    if (completionIssues.length > 0) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "missing_fields" }, "warn");
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori" });
    }

    if (isNaN(area)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_area" }, "warn");
      return res.status(400).json({ msg: "Il campo 'area' deve essere un numero." });
    }

    if (isNaN(lightingNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_lighting" }, "warn");
      return res.status(400).json({ msg: "Il campo 'illuminazione' deve essere un numero." });
    }

    if (isNaN(ledNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_led" }, "warn");
      return res.status(400).json({ msg: "Il campo 'LED' deve essere un numero." });
    }

    if (isNaN(gasLampNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_create", reason: "invalid_gas_lamp" }, "warn");
      return res.status(400).json({ msg: "Il campo 'lampade a gas' deve essere un numero." });
    }

    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const values = [
      nameNormalized,
      userId,
      addressNormalized,
      usageNormalized,
      locationNormalized,
      yearNormalized,
      area,
      renovationNormalized,
      heatingNormalized,
      ventilationNormalized,
      energyControlNormalized,
      maintenanceNormalized,
      electricFornitureNormalized,
      waterRecoveryNormalized,
      contractPowerClassNormalized,
      lightingNormalized,
      ledNormalized,
      gasLampNormalized,
      electricityAnalyzerNormalized,
      autoLightingControlSystemNormalized,
      atecoNormalized,
      activityDescriptionNormalized,
      annualTurnoverNormalized,
      employeesNormalized,
      prodProcessDescriptionNormalized,
      countryNormalized,
      locationNormalized,
      capNormalized,
      municipalityNormalized,
      streetNormalized,
      streetNumberNormalized,
      climateZoneNormalized,
      constructionYearValueNormalized,
      contractPowerClassNormalized,
      false,
    ];

    const query = `
    INSERT INTO buildings (
        name,
        user_id,
        address,
        usage,
        location,
        construction_year,
        area,
        renovation,
        heat_distribution,
        ventilation,
        energy_control,
        maintenance,
        electricity_forniture,
        water_recovery,
        electricity_meter,
        incandescent,
        led,
        gas_lamp,
        analyzers,
        autoLightingControlSystem,

        ateco,
        activity_description,
        annual_turnover,
        num_employees,
        prodProcessDesc,
        country,
        region,
        cap,
        municipality,
        street,
        street_number,
        climate_zone,
        construction_year_value,
        contract_power_class,
        is_draft
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
    )
    RETURNING id
  `;

    const insertResult = await pool.query(query, values);
    const buildingId = insertResult.rows[0]?.id;
    logBuildingEvent(req, "building_created", { user_id: userId, building_id: buildingId });

    res.status(200).json({ msg: "Edificio caricato con successo", buildingId });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "building_create" });
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/buildings/create-draft", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const values = [
      "Nuovo edificio",
      userId,
      "",
      "",
      "",
      "",
      0,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      0,
      0,
      0,
      "",
      "",
      null,
      null,
      null,
      null,
      null,
      "Italia",
      "",
      "",
      "",
      "",
      "",
      null,
      null,
      null,
      true,
    ];

    const insertResult = await pool.query(`
      INSERT INTO buildings (
        name,
        user_id,
        address,
        usage,
        location,
        construction_year,
        area,
        renovation,
        heat_distribution,
        ventilation,
        energy_control,
        maintenance,
        electricity_forniture,
        water_recovery,
        electricity_meter,
        incandescent,
        led,
        gas_lamp,
        analyzers,
        autoLightingControlSystem,
        ateco,
        activity_description,
        annual_turnover,
        num_employees,
        prodProcessDesc,
        country,
        region,
        cap,
        municipality,
        street,
        street_number,
        climate_zone,
        construction_year_value,
        contract_power_class,
        is_draft
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
      )
      RETURNING id
    `, values);

    const buildingId = insertResult.rows[0]?.id;
    logBuildingEvent(req, "building_draft_created", { user_id: userId, building_id: buildingId });
    res.status(200).json({ msg: "Bozza edificio creata con successo", buildingId });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "building_draft_create" });
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.put("/api/edit-building", authenticateJWT, async (req, res) => {
  try {
    const {
      id,
      name,
      address,
      usage,
      year,
      area,
      location,
      renovation,
      heating,
      ventilation,
      energyControl,
      maintenance,
      waterRecovery,
      electricityCounter,
      electricityAnalyzer,
      lighting,
      led,
      gasLamp,
      autoLightingControlSystem,
      electricForniture,
      ateco,
      activityDescription,
      annualTurnover,
      employees,
      prodProcessDescription,
      country,
      region,
      cap,
      municipality,
      street,
      streetNumber,
      climateZone,
      constructionYearValue,
      contractPowerClass,
    } = req.body;

    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    if (!(await assertBuildingEditable(res, userId, id))) {
      return;
    }

    const existingBuildingResult = await pool.query(
      "SELECT * FROM buildings WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    const existingBuilding = existingBuildingResult.rows[0];

    const nameNormalized = firstNonEmpty(
      typeof name === "string" ? name.trim() : null,
      existingBuilding?.name
    ) || "";
    const usageNormalized = firstNonEmpty(
      typeof usage === "string" ? usage.trim() : null,
      existingBuilding?.usage
    ) || "";
    const locationNormalized = firstNonEmpty(
      typeof region === "string" ? region.trim() : null,
      typeof location === "string" ? location.trim() : null,
      existingBuilding?.region,
      existingBuilding?.location
    ) || "";
    const countryNormalized = firstNonEmpty(
      typeof country === "string" ? country.trim() : null,
      existingBuilding?.country,
      "Italia"
    );
    const capNormalized = firstNonEmpty(cap, existingBuilding?.cap) || "";
    const municipalityNormalized = firstNonEmpty(municipality, existingBuilding?.municipality) || "";
    const streetNormalized = firstNonEmpty(street, existingBuilding?.street) || "";
    const streetNumberNormalized = firstNonEmpty(streetNumber, existingBuilding?.street_number) || "";
    const climateZoneNormalized = firstNonEmpty(
      typeof climateZone === "string" ? climateZone.trim().toUpperCase() : null,
      existingBuilding?.climate_zone
    );
    const constructionYearValueNormalized =
      constructionYearValue === null || constructionYearValue === undefined || String(constructionYearValue).trim() === ""
        ? (existingBuilding?.construction_year_value ?? null)
        : Number(constructionYearValue);
    const areaNormalized =
      area === null || area === undefined || String(area).trim() === ""
        ? Number(existingBuilding?.area ?? 0)
        : Number(area);
    const contractPowerClassNormalized = firstNonEmpty(
      typeof contractPowerClass === "string" ? contractPowerClass.trim() : null,
      typeof electricityCounter === "string" ? electricityCounter.trim() : null,
      existingBuilding?.contract_power_class,
      existingBuilding?.electricity_meter
    ) || "";
    const yearNormalized = deriveConstructionYearLabel(
      constructionYearValueNormalized,
      firstNonEmpty(year, existingBuilding?.construction_year)
    ) || "";
    const addressNormalized = composeLegacyBuildingAddress({
      address: firstNonEmpty(
        typeof address === "string" ? address.trim() : null,
        existingBuilding?.address,
      ),
      street: streetNormalized,
      streetNumber: streetNumberNormalized,
      municipality: municipalityNormalized,
      cap: capNormalized,
      location: locationNormalized,
      country: countryNormalized,
    });
    const renovationNormalized = firstNonEmpty(renovation, existingBuilding?.renovation) || "";
    const heatingNormalized = firstNonEmpty(heating, existingBuilding?.heat_distribution) || "";
    const ventilationNormalized = firstNonEmpty(ventilation, existingBuilding?.ventilation, "No");
    const energyControlNormalized = firstNonEmpty(energyControl, existingBuilding?.energy_control) || "";
    const maintenanceNormalized = firstNonEmpty(maintenance, existingBuilding?.maintenance) || "";
    const waterRecoveryNormalized = firstNonEmpty(waterRecovery, existingBuilding?.water_recovery) || "";
    const electricityAnalyzerNormalized = firstNonEmpty(electricityAnalyzer, existingBuilding?.analyzers) || "";
    const electricFornitureNormalized = firstNonEmpty(electricForniture, existingBuilding?.electricity_forniture) || "";
    const autoLightingControlSystemNormalized = firstNonEmpty(
      autoLightingControlSystem,
      existingBuilding?.autolightingcontrolsystem
    ) || "";
    const lightingNormalized =
      lighting === undefined || lighting === null || lighting === ""
        ? Number(existingBuilding?.incandescent ?? 0)
        : Number(lighting);
    const ledNormalized =
      led === undefined || led === null || led === ""
        ? Number(existingBuilding?.led ?? 0)
        : Number(led);
    const gasLampNormalized =
      gasLamp === undefined || gasLamp === null || gasLamp === ""
        ? Number(existingBuilding?.gas_lamp ?? 0)
        : Number(gasLamp);
    const atecoNormalized =
      ateco === null || ateco === undefined || String(ateco).trim() === ""
        ? (existingBuilding?.ateco ?? null)
        : String(ateco).trim();
    const activityDescriptionNormalized =
      activityDescription === null || activityDescription === undefined || String(activityDescription).trim() === ""
        ? (existingBuilding?.activity_description ?? null)
        : String(activityDescription).trim();
    const prodProcessDescriptionNormalized =
      prodProcessDescription === null || prodProcessDescription === undefined || String(prodProcessDescription).trim() === ""
        ? (existingBuilding?.prodprocessdesc ?? null)
        : String(prodProcessDescription).trim();
    const annualTurnoverNormalized =
      annualTurnover === null || annualTurnover === undefined || String(annualTurnover).trim() === ""
        ? (existingBuilding?.annual_turnover ?? null)
        : Number(annualTurnover);
    const employeesNormalized =
      employees === null || employees === undefined || String(employees).trim() === ""
        ? (existingBuilding?.num_employees ?? null)
        : Number(employees);

    const overflowValidation = [
      { value: nameNormalized, max: 255, message: "Il campo 'Nome' deve avere massimo 255 caratteri." },
      { value: addressNormalized, max: 255, message: "Il campo 'Indirizzo' deve avere massimo 255 caratteri." },
      { value: usageNormalized, max: 50, message: "Il campo 'Destinazione d'uso' deve avere massimo 50 caratteri." },
      { value: activityDescriptionNormalized, max: 300, message: "Il campo 'Descrizione attività' deve avere massimo 300 caratteri." },
      { value: prodProcessDescriptionNormalized, max: 300, message: "Il campo 'Descrizione processi produttivi' deve avere massimo 300 caratteri." },
    ];

    for (const check of overflowValidation) {
      if (check.value && check.value.length > check.max) {
        logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "field_overflow" }, "warn");
        return res.status(400).json({ msg: check.message });
      }
    }

    // `buildings.ateco` is VARCHAR(8) in the DB.
    if (atecoNormalized && atecoNormalized.length > 8) {
      logBuildingEvent(
        req,
        "validation_failed",
        { flow: "building_update", reason: "invalid_ateco_length" },
        "warn"
      );
      return res.status(400).json({
        msg: "Il campo 'Codice Ateco' deve avere massimo 8 caratteri.",
      });
    }

    if (employeesNormalized !== null && !Number.isInteger(employeesNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_employees" }, "warn");
      return res.status(400).json({ msg: "Il campo 'Numero dipendenti' deve essere un numero intero." });
    }

    if (annualTurnoverNormalized !== null && !Number.isInteger(annualTurnoverNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_turnover" }, "warn");
      return res.status(400).json({ msg: "Il campo 'Fatturato annuo' deve essere un numero intero." });
    }

    if (capNormalized && !/^\d{5}$/.test(String(capNormalized))) {
      return res.status(400).json({ msg: "Il campo 'CAP' deve contenere 5 cifre." });
    }

    if (constructionYearValueNormalized !== null) {
      if (!Number.isInteger(constructionYearValueNormalized) || String(constructionYearValueNormalized).length !== 4) {
        return res.status(400).json({ msg: "Il campo 'Anno di costruzione' deve contenere 4 cifre." });
      }
    }

    if (!id) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "missing_id" }, "warn");
      return res.status(400).json({ msg: "Identificativo edificio mancante" });
    }

    if (isNaN(areaNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_area" }, "warn");
      return res.status(400).json({ msg: "Il campo 'area' deve essere un numero." });
    }

    if (isNaN(lightingNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_lighting" }, "warn");
      return res.status(400).json({ msg: "Il campo 'illuminazione' deve essere un numero." });
    }

    if (isNaN(ledNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_led" }, "warn");
      return res.status(400).json({ msg: "Il campo 'LED' deve essere un numero." });
    }

    if (isNaN(gasLampNormalized)) {
      logBuildingEvent(req, "validation_failed", { flow: "building_update", reason: "invalid_gas_lamp" }, "warn");
      return res.status(400).json({ msg: "Il campo 'lampade a gas' deve essere un numero." });
    }

    const completionIssues = getBuildingCompletionIssues({
      name: nameNormalized,
      address: addressNormalized,
      usage: usageNormalized,
      year: yearNormalized,
      area: areaNormalized,
      location: locationNormalized,
      renovation: renovationNormalized,
      heating: heatingNormalized,
      energyControl: energyControlNormalized,
      maintenance: maintenanceNormalized,
      waterRecovery: waterRecoveryNormalized,
      contractPowerClass: contractPowerClassNormalized,
      electricityAnalyzer: electricityAnalyzerNormalized,
      electricForniture: electricFornitureNormalized,
      cap: capNormalized,
      municipality: municipalityNormalized,
      street: streetNormalized,
    });
    const isDraft = completionIssues.length > 0;

    const values = [
      nameNormalized,
      userId,
      addressNormalized,
      usageNormalized,
      locationNormalized,
      yearNormalized,
      areaNormalized,
      renovationNormalized,
      heatingNormalized,
      ventilationNormalized,
      energyControlNormalized,
      maintenanceNormalized,
      electricFornitureNormalized,
      waterRecoveryNormalized,
      contractPowerClassNormalized,
      lightingNormalized,
      ledNormalized,
      gasLampNormalized,
      electricityAnalyzerNormalized,
      autoLightingControlSystemNormalized,
      atecoNormalized,
      activityDescriptionNormalized,
      annualTurnoverNormalized,
      employeesNormalized,
      prodProcessDescriptionNormalized,
      countryNormalized,
      locationNormalized,
      capNormalized,
      municipalityNormalized,
      streetNormalized,
      streetNumberNormalized,
      climateZoneNormalized,
      constructionYearValueNormalized,
      contractPowerClassNormalized,
      isDraft,
      id
    ];

    await pool.query(`
      UPDATE buildings
      SET
        name = $1,
        user_id = $2,
        address = $3,
        usage = $4,
        location = $5,
        construction_year = $6,
        area = $7,
        renovation = $8,
        heat_distribution = $9,
        ventilation = $10,
        energy_control = $11,
        maintenance = $12,
        electricity_forniture = $13,
        water_recovery = $14,
        electricity_meter = $15,
        incandescent = $16,
        led = $17,
        gas_lamp = $18,
        analyzers = $19,
        autoLightingControlSystem = $20,
        ateco = $21,
        activity_description = $22,
        annual_turnover = $23,
        num_employees = $24,
        prodProcessDesc = $25,
        country = $26,
        region = $27,
        cap = $28,
        municipality = $29,
        street = $30,
        street_number = $31,
        climate_zone = $32,
        construction_year_value = $33,
        contract_power_class = $34,
        is_draft = $35
      WHERE id = $36
  `, values);

    logBuildingEvent(req, "building_updated", { user_id: userId, building_id: Number(id) });
    res.status(200).json({ msg: "Edificio aggiornato con successo" });
  } catch (error) {
    logUnexpectedError(req, error, { flow: "building_update" });
    res.status(500).json({ msg: "Errore interno del server" });
  }
});


app.delete("/api/delete-building/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const query = "DELETE FROM buildings WHERE user_id = $1 AND id = $2";
    const values = [user_id, id];
    await pool.query(query, values);
    logBuildingEvent(req, "building_deleted", { user_id, building_id: Number(id) });
    res.status(200).json({ msg: "Edificio rimosso con successo" });

  } catch (error) {
    logUnexpectedError(req, error, { flow: "building_delete" });
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/fetch-buildings", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const rows = await pool.query(`
      SELECT * FROM buildings WHERE user_id = $1
    `, [userId]);

    const numBuildings = await pool.query(`
      SELECT COUNT(*) FROM buildings WHERE user_id = $1
    `, [userId]);

    //console.log('Response:', rows.rows, numBuildings.rows[0].count);

    res.status(200).json({ buildings: rows.rows, numBuildings: numBuildings.rows[0].count });
  } catch (error) {
    console.error('Error fetching buildings:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.get("/api/fetch-building/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const [rows, plantsRows] = await Promise.all([
      pool.query(`SELECT * FROM buildings WHERE id = $1 AND user_id = $2`, [id, user_id]),
      pool.query(`SELECT * FROM plants WHERE building_id = $1 AND user_id = $2`, [id, user_id]),
    ]);
    const building = rows.rows[0] ? deriveLegacyBuildingFromPlants(rows.rows[0], plantsRows.rows) : null;
    res.status(200).json({ building });
  } catch (error) {
    console.error('Error fetching building:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})


app.post("/api/buildings/:id/upload/plant", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const payload = normalizePlantPayload(req.body);
    const validationError = validatePlantPayload(payload);
    if (validationError) {
      return res.status(400).json({ msg: validationError });
    }

    const values = [
      user_id,
      id,
      payload.systemType,
      payload.plantType,
      payload.generatorType,
      payload.generatorDescription,
      payload.fuelType,
      payload.fuelConsumption,
      payload.fuelUnit,
      payload.hasHeatRecovery,
      payload.incandescentCount,
      payload.ledCount,
      payload.gasLampCount,
      payload.autoLightingControl,
    ];

    const insertPlantResult = await pool.query(`
      INSERT INTO plants (
        user_id, building_id, system_type, plant_type, generator_type, generator_description, fuel_type, fuel_consumption, fuel_unit, has_heat_recovery, incandescent_count, led_count, gas_lamp_count, auto_lighting_control
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id
    `, values);

    const plant_id = insertPlantResult.rows[0].id;

    if (payload.hasGasLeak && payload.refrigerantGases.length > 0) {
      const validGases = payload.refrigerantGases.filter(gas => gas.type.trim() !== "" && gas.quantity !== "" && !isNaN(Number(gas.quantity)) && Number(gas.quantity) > 0);
      for (const gas of validGases) {
        const { type, quantity } = gas;
        await pool.query(`
          INSERT INTO refrigerant_gases (
            gas_type, quantity_kg, plant_id, building_id, user_id
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          type,
          Number(quantity),
          plant_id,
          id,
          user_id
        ]);
      }
    }
    if (payload.hasGasLeak) {
      res.status(200).json({ msg: "Impianto e gas refrigeranti aggiunti con successo" });
    } else {
      res.status(200).json({ msg: "Impianto aggiunto con successo" });
    }

  } catch (error) {
    console.error('Error adding plant:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})


app.put("/api/buildings/:id/update/plant/:plant_id", authenticateJWT, async (req, res) => {
  try {
    const { id, plant_id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const payload = normalizePlantPayload(req.body);
    const validationError = validatePlantPayload(payload);
    if (validationError) {
      return res.status(400).json({ msg: validationError });
    }

    const values = [
      user_id,
      id,
      payload.systemType,
      payload.plantType,
      payload.generatorType,
      payload.generatorDescription,
      payload.fuelType,
      payload.fuelConsumption,
      payload.fuelUnit,
      payload.hasHeatRecovery,
      payload.incandescentCount,
      payload.ledCount,
      payload.gasLampCount,
      payload.autoLightingControl,
      plant_id
    ];

    const updatePlantResult = await pool.query(`
      UPDATE plants
      SET system_type = $3, plant_type = $4, generator_type = $5, generator_description = $6, fuel_type = $7, fuel_consumption = $8, fuel_unit = $9, has_heat_recovery = $10, incandescent_count = $11, led_count = $12, gas_lamp_count = $13, auto_lighting_control = $14
      WHERE user_id = $1 AND building_id = $2 AND id = $15
      RETURNING id
    `, values);

    const _plant_id = updatePlantResult.rows[0].id;

    await pool.query(`DELETE FROM refrigerant_gases WHERE plant_id = $1 AND building_id = $2 AND user_id = $3`, [plant_id, id, user_id]);

    if (payload.hasGasLeak && payload.refrigerantGases.length > 0) {
      const validGases = payload.refrigerantGases.filter(gas => gas.type.trim() !== "" && gas.quantity !== "" && !isNaN(Number(gas.quantity)) && Number(gas.quantity) > 0);
      for (const gas of validGases) {
        const { type, quantity } = gas;
        await pool.query(`
          INSERT INTO refrigerant_gases (
            gas_type, quantity_kg, plant_id, building_id, user_id
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          type,
          Number(quantity),
          plant_id,
          id,
          user_id
        ]);
      }
    }
    if (payload.hasGasLeak) {
      res.status(200).json({ msg: "Impianto aggiornato con successo e gas refrigeranti riallineati" });
    } else {
      res.status(200).json({ msg: "Impianto aggiornato con successo" });
    }

  } catch (error) {
    console.error('Error updating plant:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})


app.get("/api/buildings/:id/fetch-plants", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const query2 = "SELECT COUNT(*) FROM plants WHERE building_id = $1 AND user_id = $2";
    const values2 = [id, user_id];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    //console.log('Count from database:', count); // Log count

    const rows = await pool.query(
      `SELECT * FROM plants WHERE building_id = $1 AND user_id = $2 ORDER BY id DESC`,
      [id, user_id],
    );

    res.status(200).json({ plants: rows.rows, count: count });
  } catch (error) {
    console.error('Error fetching plants:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.delete("/api/delete-plant/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const plantLookup = await pool.query(
      "SELECT building_id FROM plants WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );
    if (plantLookup.rows.length === 0) {
      return res.status(404).json({ msg: "Impianto non trovato" });
    }
    const buildingId = plantLookup.rows[0].building_id;
    if (!(await assertBuildingEditable(res, user_id, buildingId))) {
      return;
    }

    await pool.query(`DELETE FROM refrigerant_gases WHERE plant_id = $1 AND user_id = $2`, [id, user_id]);
    await pool.query(`DELETE FROM plants WHERE id = $1 AND user_id = $2`, [id, user_id]);
    res.status(200).json({ msg: "Impianto eliminato con successo" });
  } catch (error) {
    console.error('Error deleting plant:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});


app.get("/api/buildings/:id/fetch-gases", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const query2 = "SELECT COUNT(*) FROM refrigerant_gases WHERE building_id = $1 AND user_id = $2";
    const values2 = [id, user_id];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    //console.log('Count from database:', count); // Log count

    const rows = await pool.query(`
      SELECT 
        rg.*, 
        p.system_type AS plant_name
      FROM refrigerant_gases rg
      LEFT JOIN plants p ON rg.plant_id = p.id
      WHERE rg.user_id = $1 AND rg.building_id = $2;
    `, [id, user_id]);


    res.status(200).json({ gases: rows.rows, count: count });
  } catch (error) {
    console.error('Error fetching gases:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/buildings/:id/upload/gas", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const {
      type,
      quantityKg,
    } = req.body;

    if (!type || !quantityKg) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    const values = [
      user_id, id,
      type,
      quantityKg,
    ];

    await pool.query(`
      INSERT INTO refrigerant_gases (
        user_id, building_id, gas_type, quantity_kg
      ) VALUES (
        $1, $2, $3, $4
      )
    `, values);

    res.status(200).json({ msg: "Gas clima alterante aggiunto con successo" });
  } catch (error) {
    console.error('Error adding gas:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.put("/api/buildings/:id/update/gas/:gas_id", authenticateJWT, async (req, res) => {
  try {
    const { id, gas_id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const {
      type,
      quantityKg,
    } = req.body;

    if (!type || !quantityKg) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    const values = [
      user_id, id,
      type,
      quantityKg,
      gas_id
    ];

    await pool.query(`
      UPDATE refrigerant_gases
      SET gas_type = $3, quantity_kg = $4
      WHERE user_id = $1 AND building_id = $2 AND id = $5
    `, values);

    res.status(200).json({ msg: "Gas clima alterante aggiornato con successo." });
  } catch (error) {
    console.error('Error updating gas:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.delete("/api/delete-gas/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    console.log('user_id:', user_id);
    console.log('id:', id);
    const gasLookup = await pool.query(
      "SELECT building_id FROM refrigerant_gases WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );
    if (gasLookup.rows.length === 0) {
      return res.status(404).json({ msg: "Gas non trovato" });
    }
    const buildingId = gasLookup.rows[0].building_id;
    if (!(await assertBuildingEditable(res, user_id, buildingId))) {
      return;
    }

    await pool.query(`DELETE FROM refrigerant_gases WHERE id = $1 AND user_id = $2`, [id, user_id]);
    res.status(200).json({ msg: "Gas clima alterante eliminato con successo" });
  } catch (error) {
    console.error('Error deleting gas:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});


app.get("/api/:buildingID/fetch-user-energies", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    //console.log('buildingID:', buildingID);

    const rows = await pool.query(`SELECT DISTINCT fuel_type FROM plants WHERE user_id = $1 AND building_id = $2 AND fuel_type <> 'Elettricità'`, [user_id, buildingID]);
    res.status(200).json({ energies: rows.rows });
  } catch (error) {
    console.error('Error fetching energies:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.post("/api/:buildingID/add-consumption", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    if (!(await assertBuildingEditable(res, user_id, buildingID))) {
      return;
    }
    const { energy_source, consumption } = req.body;


    if (!energy_source || !consumption) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi per ogni consumo" });
    }

    const rows = await pool.query(`SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2 AND energy_source = $3`, [user_id, buildingID, energy_source]);

    if (rows.rowCount > 0) {
      return res.status(400).json({ msg: "Hai già aggiunto questo consumo" });
    }

    if (isNaN(consumption)) {
      return res.status(400).json({ msg: "Il consumo deve essere un valore numerico" });
    }

    const values = [user_id, buildingID, energy_source, consumption];
    await pool.query(`
        INSERT INTO user_consumptions (user_id, building_id, energy_source, consumption)
        VALUES ($1, $2, $3, $4)
      `, values);


    res.status(200).json({ msg: "Consumo aggiunto con successo" });

  } catch (error) {
    console.error('Error adding consumption:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/:buildingID/fetch-consumption-data", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    //console.log('buildingID:', buildingID);

    const rows = await pool.query(`SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2`, [user_id, buildingID]);
    res.status(200).json({ consumptions: rows.rows });
  } catch (error) {
    console.error('Error fetching consumption data:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.put("/api/:buildingID/modify-consumption/:consumptionId", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    if (!(await assertBuildingEditable(res, user_id, buildingID))) {
      return;
    }
    const { consumptionId } = req.params;
    const { energy_source, consumption } = req.body;


    if (!energy_source || !consumption) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi per ogni consumo" });
    }

    if (isNaN(consumption)) {
      return res.status(400).json({ msg: "Il consumo deve essere un valore numerico" });
    }

    await pool.query(`UPDATE user_consumptions SET energy_source = $1, consumption = $2 WHERE id = $3 AND building_id = $4 AND user_id = $5`, [energy_source, consumption, consumptionId, buildingID, user_id]);
    res.status(200).json({ msg: "Consumo modificato con successo" });
  } catch (error) {
    console.error('Error modifying consumption:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.delete("/api/:buildingID/delete-consumption/:id", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    if (!(await assertBuildingEditable(res, user_id, buildingID))) {
      return;
    }
    const { id } = req.params;

    //console.log('buildingID:', buildingID);
    //console.log('consumption id:', id);
    //console.log('user_id:', user_id);

    await pool.query(`DELETE FROM user_consumptions WHERE id = $1 AND building_id = $2 AND user_id = $3`, [id, buildingID, user_id]);
    res.status(200).json({ msg: "Consumo eliminato con successo" });
  } catch (error) {
    console.error('Error deleting consumption:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/buildings/:id/upload/solar", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const { installedArea } = req.body;

    if (!installedArea) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    if (isNaN(installedArea)) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore numerico" });
    }

    if (installedArea <= 0) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore positivo" });
    }

    const values = [id, installedArea];

    await pool.query(`
      INSERT INTO solars (
        building_id, installed_area
      ) VALUES (
        $1, $2
      )
    `, values);

    res.status(200).json({ msg: "Impianto solare aggiunto con successo" });
  } catch (error) {
    console.error('Error adding solar:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }

})

app.put("/api/buildings/:id/update/solar/:solarID", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const { installedArea } = req.body;
    const { solarID } = req.params;

    if (!installedArea) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    if (isNaN(installedArea)) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore numerico" });
    }

    if (installedArea <= 0) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore positivo" });
    }

    const values = [installedArea, solarID, id];

    await pool.query(`
      UPDATE solars
      SET installed_area = $1
      WHERE id = $2 AND building_id = $3
    `, values);

    res.status(200).json({ msg: "Impianto solare aggiornato con successo" });
  } catch (error) {
    console.error('Error updating solar:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.delete("/api/delete-solar/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const solarLookup = await pool.query(
      `SELECT s.building_id
       FROM solars s
       JOIN buildings b ON b.id = s.building_id
       WHERE s.id = $1 AND b.user_id = $2`,
      [id, user_id]
    );
    if (solarLookup.rows.length === 0) {
      return res.status(404).json({ msg: "Impianto solare non trovato" });
    }
    const buildingId = solarLookup.rows[0].building_id;
    if (!(await assertBuildingEditable(res, user_id, buildingId))) {
      return;
    }
    const values = [id];
    await pool.query("DELETE FROM solars WHERE id = $1", values);
    res.status(200).json({ msg: "Impianto solare eliminato con successo" });
  } catch (error) {
    console.error('Error deleting solar:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.get("/api/buildings/:id/fetch-solars", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const rows = await pool.query(`SELECT * FROM solars WHERE building_id = $1 ORDER BY id DESC`, [id]);

    const query2 = "SELECT COUNT(*) FROM solars WHERE building_id = $1";
    const values2 = [id];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    res.status(200).json({ solars: rows.rows, count: count });
  } catch (error) {
    console.error('Error fetching solars:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.post("/api/buildings/:id/upload/photovoltaic", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const { power } = req.body;

    if (!power) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    if (isNaN(power)) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore numerico" });
    }

    if (power <= 0) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore positivo" });
    }

    const values = [id, power];

    await pool.query(`
      INSERT INTO photovoltaics (
        building_id, power
      ) VALUES (
        $1, $2
      )
    `, values);

    res.status(200).json({ msg: "Impianto fotovoltaico aggiunto con successo" });
  } catch (error) {
    console.error('Error adding photovoltaic:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }

})

app.delete("/api/delete-photovoltaic/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const photoLookup = await pool.query(
      `SELECT p.building_id
       FROM photovoltaics p
       JOIN buildings b ON b.id = p.building_id
       WHERE p.id = $1 AND b.user_id = $2`,
      [id, user_id]
    );
    if (photoLookup.rows.length === 0) {
      return res.status(404).json({ msg: "Impianto fotovoltaico non trovato" });
    }
    const buildingId = photoLookup.rows[0].building_id;
    if (!(await assertBuildingEditable(res, user_id, buildingId))) {
      return;
    }

    const values = [id];
    await pool.query("DELETE FROM photovoltaics WHERE id = $1", values);
    res.status(200).json({ msg: "Impianto fotovoltaico eliminato con successo" });
  } catch (error) {
    console.error('Error deleting photovoltaic:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }


})

app.put("/api/buildings/:id/update-photovoltaic/:photoID", authenticateJWT, async (req, res) => {
  try {
    const { id, photoID } = req.params;
    const { user_id } = req.user;
    if (!(await assertBuildingEditable(res, user_id, id))) {
      return;
    }
    const { power } = req.body;


    if (!power) {
      return res.status(400).json({ msg: "Per favore, compilare tutti i campi" });
    }

    if (isNaN(power)) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore numerico" });
    }

    if (power <= 0) {
      return res.status(400).json({ msg: "Per favore, inserisci un valore positivo" });
    }

    const values = [power, photoID, id];
    await pool.query(`
      UPDATE photovoltaics
      SET power = $1
      WHERE id = $2 AND building_id = $3
    `, values);
    res.status(200).json({ msg: "Impianto fotovoltaico aggiornato con successo" });
  } catch (error) {
    console.error('Error updating photovoltaic:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }

})

app.get("/api/buildings/:id/fetch-photovoltaics", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const rows = await pool.query(`SELECT * FROM photovoltaics WHERE building_id = $1 ORDER BY id DESC`, [id]);

    const query2 = "SELECT COUNT(*) FROM photovoltaics WHERE building_id = $1";
    const values2 = [id];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    res.status(200).json({ photos: rows.rows, count: count });
  } catch (error) {
    console.error('Error fetching photovoltaics:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.get("/api/:buildingID/fetch-emissions-data", authenticateJWT, async (req, res) => {
  try {
    const { buildingID } = req.params;
    const { user_id } = req.user;

    const [buildingData, plantRowsResult] = await Promise.all([
      pool.query(`SELECT * FROM buildings WHERE id = $1`, [buildingID]),
      pool.query(`SELECT * FROM plants WHERE building_id = $1 AND user_id = $2`, [buildingID, user_id]),
    ]);

    if (buildingData.rows.length === 0) {
      return res.status(404).json({ msg: "Edificio non trovato" });
    }

    const rawPlants = plantRowsResult.rows;
    const building = deriveLegacyBuildingFromPlants(buildingData.rows[0], rawPlants);
    const consumptions = buildConsumptionsFromPlants(rawPlants);
    const plants = mapPlantsForCalculator(rawPlants);

    const totalLightingDevices =
      Number(building.incandescent || 0) +
      Number(building.led || 0) +
      Number(building.gas_lamp || 0);

    if (totalLightingDevices <= 0) {
      return res.status(400).json({
        error: "Completa la sottosezione Illuminazione nel blocco Impianti prima di calcolare le emissioni.",
      });
    }

    //Check if building has at least one plant
    if (rawPlants.length === 0) {
      return res.status(400).json({ error: "Non hai inserito impianti nel tuo edificio. Almeno un impianto è richiesto" });
    }

    if (consumptions.length === 0) {
      return res.status(400).json({ error: "Non hai ancora dati di consumo per questo edificio" });
    }

    const userRefrigerantGasesResult = await pool.query(
      "SELECT gas_type, quantity_kg FROM refrigerant_gases WHERE user_id = $1 AND building_id = $2;",
      [user_id, buildingID]
    );

    const userRefrigerantGases = userRefrigerantGasesResult.rows;

    const plantFuelTypes = rawPlants
      .map((row) => row.fuel_type)
      .filter(Boolean);
    const userEnergySources = consumptions.map((row) => row.energy_source);

    if (!userEnergySources.includes("Elettricità")) {
      return res.status(400).json({ error: "Il consumo di elettricità è richiesto." });
    }

    // Check if all fuel types are present
    const allFuelTypesMatched = plantFuelTypes.every(fuelType =>
      userEnergySources.includes(fuelType)
    );

    // Find missing fuel types
    const missingConsumptions = plantFuelTypes.filter(fuelType =>
      !userEnergySources.includes(fuelType)
    );

    //console.log("missingEnergySources:", missingConsumptions);
    //check if an userenergysource is not included in plantfueltypes
    const allEnergySourcesMatched = userEnergySources.filter(energySource => energySource !== "Elettricità").every(energySource => plantFuelTypes.includes(energySource));
    const missingEnergySources = userEnergySources.filter(energySource => !plantFuelTypes.includes(energySource));
    //remove Elettricità 
    missingEnergySources.splice(missingEnergySources.indexOf("Elettricità"), 1);
    console.log("missingEnergySources:", missingEnergySources);

    if (!allEnergySourcesMatched) {
      return res.status(400).json({ error: `Il consumo ${missingEnergySources} registrato non è più presente tra gli impianti.` });
    }

    if (!allFuelTypesMatched) {
      return res.status(400).json({ error: `Non ha inserito tutti i consumi. Consumi mancanti: ${missingConsumptions}` });
    }

    //Fetch solars and photovoltaics data fo user and building 
    const rows = await pool.query(`SELECT * FROM photovoltaics WHERE building_id = $1`, [buildingID]);
    const query2 = "SELECT COUNT(*) FROM photovoltaics WHERE building_id = $1";
    const totalPower = await pool.query(`SELECT SUM(power) FROM photovoltaics WHERE building_id = $1`, [buildingID]);
    ////console.log(totalPower);
    const values2 = [buildingID];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    const rows2 = await pool.query(`SELECT * FROM solars WHERE building_id = $1`, [buildingID]);
    const query3 = "SELECT COUNT(*) FROM solars WHERE building_id = $1";
    const totalIstalledArea = await pool.query(`SELECT SUM(installed_area) FROM solars WHERE building_id = $1`, [buildingID]);
    ////console.log(totalIstalledArea);
    const values3 = [buildingID];
    const result3 = await pool.query(query3, values3);
    const count2 = parseInt(result3.rows[0].count, 10); // Convert to integer for accuracy

    const solaData = {
      solars: rows2.rows,
      count2: count2,
      totalIstalledArea: totalIstalledArea.rows[0].sum
    };

    const photoData = {
      photovoltaics: rows.rows,
      count: count,
      totalPower: totalPower.rows[0].sum
    };

    res.status(200).json({ buildingData: building, plants: plants, solaData: solaData, photoData: photoData, consumptionsData: consumptions, refrigerantGases: userRefrigerantGases });

  } catch (error) {
    console.error('Error fetching photovoltaics:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.get("/api/fetch-report-data", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    //fetch user data
    const userData = await pool.query(`SELECT * FROM users WHERE id = $1`, [user_id]);
    const user = userData.rows[0];

    // Fetch all buildings for the user
    const buildingsData = await pool.query(`SELECT * FROM buildings WHERE user_id = $1`, [user_id]);

    // Create arrays to hold the data for each building
    const buildings = [];

    for (const building of buildingsData.rows) {
      const buildingID = building.id;

      // Fetch plants for the current building
      const plantsQuery = await pool.query(`SELECT * FROM plants WHERE building_id = $1 AND user_id = $2`, [buildingID, user_id]);
      const plants = plantsQuery.rows;
      const buildingWithDerivedSystems = deriveLegacyBuildingFromPlants(building, plants);
      const consumptions = buildConsumptionsFromPlants(plants);

      // Fetch photovoltaics data for the current building
      const photoQuery = await pool.query(`SELECT * FROM photovoltaics WHERE building_id = $1`, [buildingID]);
      const totalPowerQuery = await pool.query(`SELECT SUM(power) FROM photovoltaics WHERE building_id = $1`, [buildingID]);

      const photoData = {
        photovoltaics: photoQuery.rows,
        totalPower: totalPowerQuery.rows[0].sum || 0  // In case there's no photovoltaics data
      };

      // Fetch solar data for the current building
      const solarQuery = await pool.query(`SELECT * FROM solars WHERE building_id = $1`, [buildingID]);
      const totalInstalledAreaQuery = await pool.query(`SELECT SUM(installed_area) FROM solars WHERE building_id = $1`, [buildingID]);

      const solaData = {
        solars: solarQuery.rows,
        totalInstalledArea: totalInstalledAreaQuery.rows[0].sum || 0  // In case there's no solar data
      };

      // Store the data for the current building
      buildings.push({
        building: buildingWithDerivedSystems,
        plants,
        photoData,
        solaData,
        consumptions
      });
    }

    // Return all the building data with their associated details
    res.status(200).json({ user, buildings });

  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});


app.get("/api/user-questionnaires", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    const rows = await pool.query(`
      SELECT
          o.id AS order_id,
          o.product_id AS product_id,
          p.category AS product_category,
          p.name AS product_name,
          sr.total_score AS total_score,
          sr.co2emissions AS co2emissions,
          sr.created_at AS date,
          sr.completed AS completed
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN survey_responses sr
        ON sr.certification_id = o.product_id
        AND sr.user_id = o.user_id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `, [user_id]);

    res.status(200).json({ surveyInfo: rows.rows });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});


app.post('/api/responses', authenticateJWT, async (req, res) => {
  const { pageNo, certification_id, totalScore, CO2emissions, completed, surveyData } = req.body;
  const { user_id } = req.user;

  ////console.log("ALL", user_id, pageNo, surveyData, totalScore, completed);

  if (!surveyData) {
    logQuestionnaireEvent(req, "validation_failed", { flow: "questionnaire_save", reason: "missing_survey_data" }, "warn");
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const categoryResult = await pool.query(
      'SELECT category FROM products WHERE id = $1 LIMIT 1',
      [certification_id]
    );
    const category = categoryResult.rows[0]?.category || null;
    const normalizedSurveyData = isSpaCategory(category)
      ? sanitizeWellnessSurveyData(surveyData)
      : surveyData;

    const query = `
      INSERT INTO survey_responses (user_id, certification_id, page_no, survey_data, total_score, co2emissions, completed, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, certification_id) 
      DO UPDATE SET 
        page_no = EXCLUDED.page_no,
        survey_data = EXCLUDED.survey_data,
        total_score = EXCLUDED.total_score,
        co2emissions = EXCLUDED.co2emissions,
        completed = EXCLUDED.completed
      RETURNING id;
    `;
    const values = [user_id, certification_id, pageNo, normalizedSurveyData, totalScore, CO2emissions, completed];

    const result = await pool.query(query, values);
    const surveyRowId = result.rows[0].id;
    if (completed === true) {
      logQuestionnaireEvent(req, "questionnaire_submitted", {
        user_id,
        certification_id,
        survey_response_id: surveyRowId,
      });
    } else {
      logQuestionnaireEvent(req, "questionnaire_draft_saved", {
        user_id,
        certification_id,
        page_no: pageNo,
        survey_response_id: surveyRowId,
      });
    }
    res.status(200).json({ id: surveyRowId });
  } catch (err) {
    logUnexpectedError(req, err, { flow: "questionnaire_save" });
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/responses-fetch', authenticateJWT, async (req, res) => {
  const { certification_id } = req.query;
  const { user_id } = req.user;

  //console.log("ALL", user_id, certification_id);

  try {
    const categoryResult = await pool.query(
      'SELECT category FROM products WHERE id = $1 LIMIT 1',
      [certification_id]
    );
    const category = categoryResult.rows[0]?.category || null;

    const query = `
      SELECT page_no, survey_data, total_score, co2emissions, completed FROM survey_responses
      WHERE user_id = $1 AND certification_id = $2;
    `;
    const values = [user_id, certification_id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No survey data found' });
    }

    const responsePayload = { ...result.rows[0] };
    if (isSpaCategory(category)) {
      responsePayload.survey_data = sanitizeWellnessSurveyData(responsePayload.survey_data);
    }

    res.json(responsePayload);
  } catch (err) {
    console.error("Error restoring survey data:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/users-generator-types", authenticateJWT, async (req, res) => {
  const { user_id } = req.user;

  //console.log("user_id:", user_id);

  try {
    const query = `
      SELECT users.username AS username, users.company_name AS company_name, users.phone_number AS phone_number, plants.generator_description AS generator_type, users.username AS username, users.id AS user_id, plants.id AS plant_id
      FROM plants
      JOIN users ON users.id = plants.user_id
      WHERE generator_description IS NOT NULL
      AND plants.generator_assigned_score = 0.0 ;
    `;

    const results = await pool.query(query);
    //console.log("usersGeneratorTypes:", results.rows);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.post("/api/users-assign-score", authenticateJWT, authenticateAdmin, async (req, res) => {
  const { score, requestor_id, generatorType, plant_id } = req.body;

  const { role, user_id } = req.user;
  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  //console.log("user_id:", requestor_id);
  //console.log("score:", score);
  //console.log("score type:", typeof score);
  //console.log("generatorType:", generatorType);

  try {
    const query = `
          UPDATE plants
          SET generator_assigned_score = $1
          WHERE user_id = $2
          AND generator_description = $3
          AND id = $4
      `;

    const result = await pool.query(query, [parseFloat(score), requestor_id, generatorType, plant_id]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Punteggio aggiornato con successo', data: result.rows[0] });
    } else {
      res.status(404).json({ message: 'Generatore non trovato' });
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del punteggio:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

app.post("/api/second-level-certification", authenticateJWT, async (req, res) => {
  const { userInfo, certification_id } = req.body;
  const { user_id } = req.user;
  //console.log("user_id:", user_id);
  //console.log("certification_id:", certification_id);

  try {
    const query = `
      INSERT INTO second_level_certification_requests (certification_id, user_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id;
    `;

    const values = [certification_id, user_id];
    const result = await pool.query(query, values);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') {  // Error code for unique constraint violation
      return res.status(201).json({ message: "La richiesta per questo utente e certificazione esiste già." });
    }
    console.error("Errore nell'inviare la richiesta di certificazione di secondo, livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }

});

app.get("/api/fetch-second-level-requests", authenticateJWT, authenticateAdmin, async (req, res) => {
  const { role, user_id } = req.user;
  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {
    const query = `
      SELECT users.username AS username, users.company_name AS company_name, users.phone_number, products.category AS category, users.username AS username, second_level_certification_requests.created_at AS created_at, second_level_certification_requests.id AS request_id, users.id AS user_id
      FROM second_level_certification_requests
      JOIN users ON users.id = second_level_certification_requests.user_id
      JOIN products ON products.id = second_level_certification_requests.certification_id
      WHERE approved = false
      ;
    `;
    const result = await pool.query(query);

    const query2 = `
    SELECT users.username AS username, users.company_name AS company_name, users.phone_number, products.category AS category, users.username AS username, second_level_certification_requests.created_at AS created_at, second_level_certification_requests.id AS request_id, users.id AS user_id
      FROM second_level_certification_requests
      JOIN users ON users.id = second_level_certification_requests.user_id
      JOIN products ON products.id = second_level_certification_requests.certification_id
      WHERE approved = true
      ;
    `;

    const result2 = await pool.query(query2);
    res.status(200).json({ requests: result.rows, approved: result2.rows });
  } catch (err) {
    console.error("Errore nel fetch delle richieste di certificazione di secondo, livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }

});

app.post("/api/approve-second-level-request", authenticateJWT, authenticateAdmin, async (req, res) => {
  const { request_id, user_requestor_id } = req.body;
  //console.log("request_id:", request_id);
  //console.log("user_requestor_id:", user_requestor_id);
  const { role } = req.user;
  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {



    const query = `
      INSERT INTO second_level_certification_approvation (request_id, user_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id;
    `;

    const values = [request_id, user_requestor_id];
    const result = await pool.query(query, values);

    const query2 = `UPDATE second_level_certification_requests
    SET approved = true
    WHERE id = $1 AND user_id = $2
    `
      ;
    const values2 = [request_id, user_requestor_id];
    await pool.query(query2, values2);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Errore nell'approvazione della richiesta di certificazione di secondo, livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }


})

app.get("/api/fetch-approved-requests", authenticateJWT, async (req, res) => {
  const { user_id } = req.user;

  try {
    const query = `
    SELECT 
        p.category AS category,
        s.id AS approvation_id
    FROM 
        second_level_certification_approvation s
    JOIN 
        second_level_certification_requests r ON s.request_id = r.id
    JOIN 
        products p ON r.certification_id = p.id
    WHERE s.user_id = $1 AND r.approved = true and s.is_cancelled = false

    `;
    const values = [user_id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(204).json({ error: 'No approved certification requests found' });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.error("Errore nel fetch delle richieste di certificazione di secondo, livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }
})

app.put("/api/cancel-approvation/:approvation_id", authenticateJWT, async (req, res) => {
  const { approvation_id } = req.params;
  const { user_id } = req.user;

  try {

    await pool.query(
      `UPDATE second_level_certification_approvation
       SET is_cancelled = TRUE
       WHERE id = $1 AND user_id = $2`,
      [approvation_id, user_id]
    );

    res.status(200).json({ message: 'Approvation cancelled successfully' });
  } catch (err) {
    console.error("Errore nel fetch delle richieste di certificazione di secondo, livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }
})

app.delete("/api/delete-second-level-request", authenticateJWT, authenticateAdmin, async (req, res) => {

  const { request_id, user_requestor_id } = req.query;  // Cambia req.body con req.query
  const { role } = req.user;
  //console.log("request_id:", request_id);
  //console.log("user_requestor_id:", user_requestor_id);
  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {
    const query = `
      DELETE FROM second_level_certification_requests
      WHERE id = $1 AND user_id = $2;
    `;
    const values = [request_id, user_requestor_id];
    await pool.query(query, values);
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (err) {
    console.error("Errore nel fetch delle richieste di certificazione di secondo livello", err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

app.get("/api/fetch-user-info-by-buildings", authenticateJWT, authenticateAdmin, async (req, res) => {

  const { role } = req.user;

  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {

    const query = "SELECT * FROM users WHERE id IN (SELECT DISTINCT user_id FROM buildings);";
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(204).json({ error: 'Nessun utente trovato' });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.error("Errore nel fetch dei dati", err);
    res.status(500).json({ error: 'Errore del server' });
  }
})

app.get("/api/fetch-user-buildings/:id", authenticateJWT, authenticateAdmin, async (req, res) => {

  const { role } = req.user;
  const { id } = req.params;

  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {

    const query = "SELECT * FROM buildings WHERE user_id = $1;";
    const values = [id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(204).json({ error: 'Nessun edificio trovato' });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.error("Errore nel fetch dei dati", err);
    res.status(500).json({ error: 'Errore del server' });
  }

})

app.get("/api/fetch-building-plants-solars-photos/:id/:buildingID", authenticateJWT, async (req, res) => {

  const { role } = req.user;
  const { id, buildingID } = req.params;
  //console.log("buildingID:", buildingID);
  //console.log("id:", id);

  if (role !== "administrator") {
    return res.status(200).json({ msg: "Non hai i permessi per accedere a questa risorsa" });
  }

  try {

    //fetch plants
    const query = "SELECT * FROM plants WHERE user_id = $1 AND building_id = $2;";
    const values = [id, buildingID];
    const result = await pool.query(query, values);

    //fetch solars
    const query2 = "SELECT * FROM solars WHERE building_id = $1;";
    const values2 = [buildingID];
    const result2 = await pool.query(query2, values2);

    //fetch photovoltaics
    const query3 = "SELECT * FROM photovoltaics WHERE building_id = $1;";
    const values3 = [buildingID];
    const result3 = await pool.query(query3, values3);

    const derivedConsumptions = buildConsumptionsFromPlants(result.rows);

    if (result.rows.length === 0) {
      return res.status(204).json({ error: 'Alcuni dati non trovati' });
    } else if (result.rows.length > 0) {
      return res.status(200).json({ plants: result.rows, solars: result2.rows, photovoltaics: result3.rows, consumptions: derivedConsumptions });
    }
  } catch (err) {
    console.error("Errore nel fetch dei dati", err);
    res.status(500).json({ error: 'Errore del server' });
  }
})

app.put("/api/insert-results/:buildingID", authenticateJWT, async (req, res) => {

  const { user_id } = req.user;
  const { buildingID } = req.params;
  const { finalVote, totalCO2Emissions, areaCO2Emissions } = req.body;
  console.log("buildingID:", buildingID);
  console.log("user_id:", user_id);
  console.log("finalVote:", finalVote);
  console.log("totalCO2Emissions:", totalCO2Emissions);


  try {
    const lockState = await getBuildingLockState(user_id, buildingID);
    if (!lockState.found) {
      return res.status(404).json({ msg: "Edificio non trovato" });
    }
    if (lockState.locked) {
      return res.status(409).json({ msg: "Edificio già finalizzato. Non è possibile ricalcolare le emissioni." });
    }

    const buildingResult = await pool.query(
      "SELECT * FROM buildings WHERE id = $1 AND user_id = $2",
      [buildingID, user_id]
    );
    const building = buildingResult.rows[0];

    if (!building) {
      return res.status(404).json({ msg: "Edificio non trovato" });
    }

    if (!isBuildingComplete(building)) {
      return res.status(400).json({
        msg: "Completa i dati obbligatori dell'edificio prima di calcolare le emissioni.",
      });
    }

    await pool.query(`UPDATE buildings SET  emissionMark = $1, emissionCO2 = $2, areaEmissionCO2 = $3, results_visible = true WHERE id = $4 AND user_id = $5`, [finalVote, totalCO2Emissions, areaCO2Emissions, buildingID, user_id]);
    res.status(200).json({ msg: "Risultati inseriti con successo" });
  } catch (error) {
    console.error('Error inserting results:', error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
})

app.get("/api/fetch-results/:buildingID", authenticateJWT, async (req, res) => {

  const { user_id } = req.user;
  const { buildingID } = req.params;
  //console.log("buildingID:", buildingID);
  //console.log("user_id:", user_id);

  try {
    const query = "SELECT emissionMark, emissionCO2, areaEmissionCO2, results_visible FROM buildings WHERE id = $1 AND user_id = $2;";
    const values = [buildingID, user_id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(204).json({ emsgror: 'Alcuni dati non trovati' });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Errore nel fetch dei dati", error.message);
    res.status(500).json({ msg: 'Errore del server' });
  }
})

app.get("/api/is-user-certificable", authenticateJWT, async (req, res) => {

  const { user_id } = req.user;

  //check if user has completed a questionnaire
  let questionnaireCompleted = false;
  try {
    const query = "SELECT completed FROM survey_responses WHERE user_id = $1;";
    const values = [user_id];
    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      questionnaireCompleted = result.rows[0].completed;
    }

    //check if user has at least one building with CO2 emissions calculated
    let buildingsWithResults = false;

    const query2 = "SELECT COUNT(*) FROM buildings WHERE emissionMark IS NOT NULL AND emissionCO2 IS NOT NULL AND areaEmissionCO2 IS NOT NULL AND results_visible = TRUE AND user_id = $1;";
    const values2 = [user_id];
    const result2 = await pool.query(query2, values2);
    if (result2.rows[0].count > 0) {
      buildingsWithResults = true;
    }

    if (questionnaireCompleted && buildingsWithResults) {
      return res.status(200).json({ isCertificable: true });
    } else {
      return res.status(200).json({ isCertificable: false });
    }

  } catch (error) {
    console.error("Errore nel fetch dei dati", error.message);
    res.status(500).json({ msg: 'Errore del server' });
  }
})

app.get("/api/fetch-all-user-quantity", authenticateJWT, async (req, res) => {

  const { user_id } = req.user;

  try {
    const query = "SELECT SUM(quantity) FROM orders WHERE user_id = $1;";
    const values = [user_id];
    const result = await pool.query(query, values);
    console.log("Quantità totali", result.rows[0].sum);
    if (result.rows.length > 0) {
      return res.status(200).json({ quantity: result.rows[0].sum });
    }
  } catch (error) {
    console.error("Errore nel fetch dei dati", error.message);
    res.status(500).json({ msg: 'Errore del server' });
  }

})


function emailCheck(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function normalizeVatNumber(vatNumber) {
  return String(vatNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeEmailDomain(email) {
  return String(email || "")
    .split("@")[1]
    ?.trim()
    .toLowerCase() || "";
}

function normalizeWebsiteDomain(website) {
  const normalizedWebsite = String(website || "").trim().toLowerCase();

  if (!normalizedWebsite) {
    return "";
  }

  try {
    const websiteUrl = normalizedWebsite.startsWith("http://") || normalizedWebsite.startsWith("https://")
      ? normalizedWebsite
      : `https://${normalizedWebsite}`;

    return new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch (error) {
    return normalizedWebsite
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

function passwordCheck(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
  return re.test(String(password));
}

function phoneCheck(phone) {
  // max 15 characters, digits only, no spaces, no leading zeros, no special characters, allowed +, (, ), -, ., /,
  const re = /^[\+]?[(]?[0-9]{3,5}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,10}$/im;
  return re.test(String(phone).toLowerCase());
}

async function vatCheck(vatNumber) {
  try {
    const normalizedVatNumber = normalizeVatNumber(vatNumber);

    if (!normalizedVatNumber || normalizedVatNumber.length < 3) {
      return { valid: false, companyName: "", address: "", serviceUnavailable: false };
    }

    //non tutte le societa scelgono di rendere pubblici nome e indirizzo nel sistema VIES.
    const pivaRegex = /^[A-Z]{2}[0-9]{11}$/;
    if (!pivaRegex.test(normalizedVatNumber)) {
      return { valid: false, companyName: "", address: "", serviceUnavailable: false };
    }

    const countryCode = normalizedVatNumber.slice(0, 2);
    const number = normalizedVatNumber.slice(2);

    const validationInfo = await new Promise((resolve, reject) => {
      validate(countryCode, number, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });

    return {
      valid: Boolean(validationInfo.valid),
      companyName: validationInfo.name || "",
      address: validationInfo.address || "",
      serviceUnavailable: false,
    };
  } catch (error) {
    console.error('Errore durante la verifica della partita IVA:', error);
    return { valid: false, companyName: "", address: "", serviceUnavailable: true };
  }
}

function cfCheck(cf) {
  //const cfRegex = /^[A-Z0-9]{16}$/; // Must be 16 alphanumeric characters
  const cfRegex = /^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/
  return cfRegex.test(cf);
}

// OCR document processing routes (also mounted under /api for the Vite client axiosInstance baseURL)
const documentsRouter = require('./routes/documents');
app.use('/api-v2', documentsRouter);
app.use('/api', documentsRouter);

const transportV2Router = require('./routes/transportV2');
app.use('/api-v2', transportV2Router);
app.use('/api', transportV2Router);

const chatbotRouter = require('./routes/chatbot');
app.use('/api-v2', chatbotRouter);
app.use('/api', chatbotRouter);

app.use((err, req, res, next) => {
  logUnexpectedError(req, err, { source: "express_error_handler" });
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Qualcosa è andato storto!" });
});


async function ensureAdminUser() {
  try {
    // Check if the admin user exists
    const res = await pool.query('SELECT * FROM users WHERE administrator = TRUE LIMIT 1');
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.PASS_ADMIN, 10); // Hash the passwords
      await pool.query(
        `INSERT INTO users(username, company_name, email, phone_number, p_iva, tax_code, legal_headquarter, administrator, password_digest, isVerified, first_login)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [process.env.USERNAME_ADMIN, "green_visa", process.env.EMAIL_ADMIN, null, null, null, null, true, hashedPassword, true, false]
      );
      rootLogger.info({ event: "admin_bootstrap", outcome: "admin_user_created" });
    } else {
      rootLogger.debug({ event: "admin_bootstrap", outcome: "admin_user_exists" });
    }
  } catch (error) {
    rootLogger.error(
      { event: "unexpected_error", err: { message: error.message, code: error.code } },
      "ensureAdminUser failed",
    );
  }
}

if (require.main === module) {
  app.listen(port, '0.0.0.0', async () => {
    //console.log(`Server in ascolto sulla porta ${port}`);
    await ensureBuildingFormColumns();
    await ensurePlantManagementColumns();
    await ensureAdminUser();
  });
}

module.exports = {
  app,
  ensureAdminUser,
};


