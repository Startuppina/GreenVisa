const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("./db"); // Your database connection pool

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const cron = require("node-cron");
const pricingFunctions = require("./priceCalculator");
const bodyParser = require("body-parser");
const { JSDOM } = require("jsdom");

const createDOMPurify = require("dompurify");
const { disconnect } = require("process");
const { v4: uuidv4 } = require("uuid");
const { user } = require("pg/lib/defaults");
const validate = require("validate-vat");

const { RegistrationBody } = require("./utils/registrationValidator");

const port = 8080;

const email_sender = process.env.EMAIL_SENDER;
const pass_sender = process.env.PASS_SENDER;

const SECRET_KEY = process.env.SECRET_KEY;

const {
  emailCheck,
  passwordCheck,
  phoneCheck,
  cfCheck,
} = require("./utils/regexValidator");

const app = express();
// CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://vps-0fde778b.vps.ovh.net:5173"],
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.static("img")); // Directory statica per immagini
app.use("/uploaded_img", express.static(path.join(__dirname, "uploaded_img")));

DOMPurify = createDOMPurify(new JSDOM().window);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploaded_img");
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

//const purify = DOMPurify(window);

const { containsSessionId } = require("./middleware/authMiddleware");
const { authenticateJWT } = require("./middleware/jwtMiddleware");
app.use(containsSessionId);
app.use(authenticateJWT);

const cleanUpCart = async () => {
  try {
    await pool.query(`
      DELETE FROM cart
      WHERE session_id IS NOT NULL
      AND user_id IS NULL
    `);
    //console.log('Pulizia del carrello completata.');
  } catch (error) {
    console.error("Errore nella pulizia del carrello:", error);
  }
};

cron.schedule("0 0 */3 * *", cleanUpCart);

// -- DELETE PROMO CODES -- TASK
require("./tasks/promoCodeTask");

app.get("/api/authenticated", authenticateJWT, (req, res) => {
  return res.status(200).json({ msg: "Utente autenticato", user: req.user });
});

app.get(
  "/api/admin-username",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const query = "SELECT username FROM users WHERE id = $1";
      const result = await pool.query(query, [user_id]);
      const username = result.rows[0].username;
      res.status(200).json({ username });
    } catch (error) {
      console.error(
        "Errore durante la richiesta dell'username dell'admin:",
        error,
      );

      res.status(500).json({ msg: "Errore durante la richiesta" });
    }
  },
);

app.post("/api/signup", async (req, res) => {
  const {
    username,
    company_name,
    email,
    confirmEmail,
    password,
    phone,
    company_website,
    pec,
    vat,
    noCompanyEmail,
    legal_headquarter,
  } = req.body;

  const registrationBody = new RegistrationBody(
    username,
    company_name,
    email,
    confirmEmail,
    password,
    phone,
    company_website,
    pec,
    vat,
    noCompanyEmail,
    legal_headquarter,
  );

  // Oggetto voluto a gestire tutti i campi e il body della richiesta
  registrationBody.validateFields(res);

  const emailDomain = email.split("@")[1];
  const websiteDomain = company_website.split("www.")[1];

  // Non so cosa sia questa roba arcaica -- Ale
  console.log("noCompanyEmail:", noCompanyEmail);

  if (emailDomain !== websiteDomain && !noCompanyEmail) {
    return res.status(400).json({
      msg: "il dominio della email non corrisponde al dominio del sito aziendale fornito",
    });
  }

  try {
    const result = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ msg: "Email già in uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const intPrefix = phone.slice(0, 2);
    const intSuffix = phone.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    const result2 = await pool.query(
      "INSERT INTO users (username, company_name, email, phone_number, p_iva, tax_code, legal_headquarter, turnover, administrator, password_digest) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [
        username,
        company_name,
        email,
        newPhone,
        vat,
        null,
        legal_headquarter,
        null,
        false,
        hashedPassword,
      ],
    );

    if (noCompanyEmail) {
      return res.status(200).json({ notCompanyEmail: true });
    }

    if (result2.rowCount > 0) {
      const userID = result2.rows[0].id;
      const userToken = uuidv4();

      const updateResult = await pool.query(
        "UPDATE users SET token = $1 WHERE id = $2",
        [userToken, userID],
      );

      if (updateResult.rowCount > 0) {
        // Tutto ok -> mando email di conferma
        sendConfirmationEmail({
          recipient_email: email,
          recipient_name: username,
          token: userToken,
        });
      }
    }

    return res.status(200).json({ msg: "Utente registrato" });
  } catch (error) {
    console.error("Errore durante la registrazione dell'utente:", error);
    return res
      .status(500)
      .json({ msg: "Errore durante la registrazione dell'utente" });
  }
});

app.post("/api/check-vat", async (req, res) => {
  try {
    const { vatNumber } = req.body;

    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, msg: "Partita IVA mancante" });
    }

    const isValid = await vatCheck(vatNumber);

    if (isValid.valid) {
      return res.status(200).json({
        success: true,
        companyName: isValid.companyName,
        address: isValid.address,
        msg: "Partita IVA valida",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "Partita IVA non valida o non attiva" });
    }
  } catch (error) {
    console.error("Errore durante il controllo della partita IVA:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Errore interno al server" });
  }
});

app.get("/api/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token mancante" });
  }

  try {
    // Cerca l'utente con quel token
    const result = await pool.query("SELECT * FROM users WHERE token = $1", [
      token,
    ]);

    if (result.rows.length === 0) {
      // Nessun utente trovato con quel token
      return res
        .status(404)
        .json({ success: false, message: "Token non valido o scaduto" });
    }

    const userId = result.rows[0].id;
    const email = result.rows[0].email;
    const username = result.rows[0].username;

    const updateResult = await pool.query(
      "UPDATE users SET isVerified = true, token = NULL WHERE id = $1",
      [userId],
    );

    if (updateResult.rowCount > 0) {
      // Invia email di benvenuto solo se l'UPDATE ha modificato qualcosa
      sendWelcomeEmail({
        recipient_email: email,
        recipient_name: username,
      });

      return res
        .status(200)
        .json({ success: true, message: "Account verificato" });
    }
  } catch (error) {
    console.error("Errore durante la verifica del token:", error);
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
});

app.post(
  "/api/send-verify-email",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      //verify if the email exists in the database
      const { userID } = req.body;
      const result = await pool.query(
        "SELECT username, email FROM users WHERE id = $1",
        [userID],
      );
      if (result.rows.length === 0) {
        return res
          .status(400)
          .json({ msg: "Non esiste un utente con questo id" });
      }

      const userToken = uuidv4();

      const updateResult = await pool.query(
        "UPDATE users SET token = $1 WHERE id = $2",
        [userToken, userID],
      );

      if (updateResult.rowCount > 0) {
        sendConfirmationEmail({
          recipient_email: result.rows[0].email,
          recipient_name: result.rows[0].username,
          token: userToken,
        });
        return res
          .status(200)
          .json({ msg: "Email di verifica inviata correttamente" });
      }
    } catch (error) {
      console.error("Errore durante l'invio dell'email di verifica:", error);
      return res
        .status(500)
        .json({ msg: "Errore durante l'invio dell'email di verifica" });
    }
  },
);

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const sessionID = req.cookies.sessionId;
  console.log("sessionID:", sessionID);

  if (!email || !password) {
    return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Email non valida" });
    }

    const user = result.rows[0]; // if we found a user
    const isMatch = await bcrypt.compare(password, user.password_digest);

    if (!isMatch) {
      return res.status(400).json({ msg: "Password errata" });
    }

    console.log("isVerified:", user.isverified);
    if (!user.isverified) {
      return res.status(400).json({ msg: "Account non verificato" });
    }

    let token;
    //check if user is admin
    if (user.administrator) {
      token = jwt.sign(
        { user_id: user.id, role: "administrator" },
        SECRET_KEY,
        {
          expiresIn: "3d",
        },
      );
    } else {
      token = jwt.sign({ user_id: user.id, role: "user" }, SECRET_KEY, {
        expiresIn: "3d",
      });
    }

    const user_id = user.id;
    const first_login = user.first_login;
    console.log("first_login:", first_login);
    if (first_login) {
      await pool.query("UPDATE users SET first_login = false WHERE id = $1", [
        user_id,
      ]);
    }

    if (sessionID) {
      // Update user_id and session_id in cart table if session_id is not null
      await pool.query(
        "UPDATE cart SET user_id = $1, session_id = NULL  WHERE session_id = $2",
        [user_id, sessionID],
      );
    }

    res.cookie("accessToken", token, {
      httpOnly: false,
      secure: false, // in poducazione mettere true
      sameSite: "Lax",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.clearCookie("sessionId", {
      httpOnly: false,
      secure: false, // Impostalo su true se stai usando HTTPS
      sameSite: "Lax",
    });

    return res
      .status(200)
      .json({ msg: "Login effettuato con successo!", token, first_login });
  } catch (error) {
    console.error("Errore durante il login:", error);
    return res.status(500).json({ msg: "Errore durante il login. Riprova" });
  }
});

app.post("/api/logout", authenticateJWT, (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: false,
    secure: false, // Impostalo su true se stai usando HTTPS
    sameSite: "Lax",
  });
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

    res.clearCookie("accessToken", {
      httpOnly: false,
      secure: false, // Impostalo su true se stai usando HTTPS
      sameSite: "Lax",
    });

    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: false, // Impostalo su true se stai usando HTTPS
      sameSite: "Lax",
    });

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

    res.status(200).json({
      message: "Numero di telefono aggiornato con successo",
      newPhone,
    });
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
});

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

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

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

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    await pool.query("UPDATE users SET turnover = $1 WHERE id = $2", [
      turnover,
      user_id,
    ]);

    await pool.query(
      "UPDATE buildings SET annual_turnover = $1 WHERE user_id = $2",
      [turnover, user_id],
    );

    res.status(200).json({ message: "Fatturato aggiornato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.get(
  "/api/fetch-users",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
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
  },
);

app.get(
  "/api/fetch-not-verified-users",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      if (req.user.role !== "administrator") {
        return res.status(401).json({ message: "Non sei autorizzato" });
      }

      const result = await pool.query(
        "SELECT * FROM users WHERE isVerified = false and administrator = false order by id ASC ",
      );
      res.status(200).json({ rows: result.rows, count: result.rows.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Errore interno del server" });
    }
  },
);

app.post("/api/send_email", async (req, res) => {
  try {
    //verifica se l'email esiste nel database
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [req.body.email],
    );
    if (result.rows.length > 0) {
      const recoveryToken = jwt.sign({ id: result.rows[0].id }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.cookie("recoveryToken", recoveryToken, {
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
        maxAge: 6 * 10 * 60 * 1000, // 1 hour
      });
      //console.log(recoveryToken);
      res.status(200).json({ exist: true, token: recoveryToken });
    } else {
      res.status(200).json({ exist: false });
    }
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
      [req.body.email],
    );
    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ msg: "Non esiste un utente con questa email" });
    }

    sendEmailMessage({
      recipient_email: req.body.email,
    });

    return res
      .status(200)
      .json({ msg: "Email di presa in carico inviata correttamente" });
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
        pass: pass_sender,
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
        pass: pass_sender,
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

function sendEmailResponse({
  recipient_email,
  email_title,
  email_content,
  receiver_username,
  admin_username,
}) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //BEACUSE SECURITY, THE CREDENTIALS MUST BE IN .ENV
        user: email_sender,
        pass: pass_sender,
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

app.post("/api/send_recovery_email", authenticateJWT, (req, res) => {
  const { email, OTP } = req.body;
  sendEmail({ recipient_email: email, OTP })
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      console.error("Errore nell'invio dell'email:", error);
      res.status(500).json(error);
    });
});

app.put("/api/change-password", authenticateJWT, async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.user;

    if (!passwordCheck(password)) {
      return res.status(400).json({
        msg: "Password non corretta. Segui le info per ottenere una password sicura",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare the SQL query
    const query = "UPDATE users SET password_digest = $1 WHERE id = $2";
    const values = [hashedPassword, id];

    // Execute the query
    await pool.query(query, values);

    res.clearCookie("recoveryToken", {
      httpOnly: false,
      secure: false, // Impostalo su true se stai usando HTTPS
      sameSite: "Lax",
    });

    res.status(200).json({ message: "Password modificata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.post(
  "/api/upload-news",
  authenticateJWT,
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file;
      const { title, content } = req.body;
      const { role } = req.user;

      if (role !== "administrator") {
        return res
          .status(400)
          .json({ msg: "Non hai i permessi per caricare notizie" });
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
      const insertNewsQuery =
        "INSERT INTO news (user_id, title, content, image) VALUES ($1, $2, $3, $4) RETURNING id";
      const values = [
        req.user.user_id,
        title,
        sanitizedContent,
        image.filename,
      ];

      // begin transaction
      const client = await pool.connect();
      await client.query("BEGIN");

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
      await client.query("COMMIT");
      client.release();

      res.status(200).json({ msg: "Notizia caricata con successo" });
    } catch (error) {
      console.error("Errore nel caricamento della notizia:", error);
      res.status(500).json({ msg: "Errore nel caricamento della notizia" });
    }
  },
);

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
    const ids = idsResult.rows.map((row) => row.id);
    // Sanitize content with DOMPurify
    result.rows[0].content = DOMPurify.sanitize(result.rows[0].content);

    res.status(200).json({
      article: result.rows[0],
      countnews: countNews.rows[0].count,
      ids,
    });
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
    res
      .status(500)
      .json({ msg: "Errore nell'impostazione della notizia come letta" });
  }
});

app.get("/api/news-unread", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;
    const query =
      "SELECT * FROM news JOIN news_read_status ON news.id = news_read_status.news_id WHERE news_read_status.user_id = $1 AND is_read = FALSE";
    const values = [user_id];
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero delle notizie:", error);
    res.status(500).json({ msg: "Errore nel recupero delle notizie" });
  }
});

app.delete(
  "/api/delete-news/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { role } = req.user;
      if (role !== "administrator") {
        return res
          .status(200)
          .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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
  },
);

// create api to apload categriues of a product. categories is an enum
app.get("/api/categories", async (req, res) => {
  try {
    const query = `
          SELECT unnest(enum_range(NULL::category_type)) AS category
      `;
    const result = await pool.query(query);
    const categories = result.rows.map((row) => row.category);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/api/upload-product",
  authenticateJWT,
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const image = req.file;
      const { name, category, tag, info, cod } = req.body;
      const { user_id, role } = req.user;

      if (role !== "administrator") {
        return res
          .status(200)
          .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
      }

      if (!name || !category || !tag || !info || !cod) {
        return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
      }

      const checkCodQuery = "SELECT * FROM products WHERE cod = $1";
      const checkCodValues = [cod];
      const checkCodResult = await pool.query(checkCodQuery, checkCodValues);
      if (checkCodResult.rows.length > 0) {
        return res.status(400).json({
          msg: "Codice certificazione già esistente. Inserisci un codice diverso",
        });
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
        return res
          .status(400)
          .json({ msg: "La descrizione è troppo lunga. Max 100 caratteri" });
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
      const values = [
        user_id,
        name,
        parsedPrice,
        image.filename,
        info,
        cod,
        category,
        tag,
        null,
      ];

      await pool.query(query, values);
      res.status(200).json({ msg: "Certificazione caricata con successo" });
    } catch (error) {
      console.error(
        "Errore durante il caricamento della certificazione:",
        error,
      );
      res
        .status(500)
        .json({ msg: "Errore durante il caricamento della certificazione" });
    }
  },
);

app.get("/api/products-info", async (req, res) => {
  try {
    const { order = "default" } = req.query; // Aggiungi un valore di default per evitare errori
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
    res
      .status(200)
      .json({ numProducts: result.rows[0].count, products: result2.rows });
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
});

app.delete(
  "/api/delete-product/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.user;

      if (role !== "administrator") {
        return res
          .status(400)
          .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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
      res.status(200).json({ msg: "Certificazione eliminata con successo" });
    } catch (error) {
      console.error("Errore nel cancellamento", error);
      res.status(500).json({ msg: "Errore nel cancellamento" });
    }
  },
);

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
      return res.status(400).json({
        msg: "Devi essere autenticato o avere un id di sessione per inserire nel carrello",
      });
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

    // Check if the product is already in the cart
    let cartQuery;
    let cartValues;

    if (user_id) {
      // Control for authenticated users
      cartQuery = "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2";
      cartValues = [user_id, id];
    } else {
      // Control for anonymous users
      cartQuery =
        "SELECT * FROM cart WHERE session_id = $1 AND product_id = $2";
      cartValues = [req.cookies.sessionId, id];
    }

    const cartResult = await pool.query(cartQuery, cartValues);

    if (cartResult.rows.length > 0) {
      return res
        .status(400)
        .json({ msg: "La certificazione è già nel carrello" });
    }

    // Insert the product into the cart
    let insertQuery;
    let insertValues;

    if (user_id) {
      // Insert into the cart for authenticated users
      insertQuery =
        "INSERT INTO cart (user_id, product_id, name, image, quantity, option, price) VALUES ($1, $2, $3, $4, $5, $6, $7)";
      insertValues = [user_id, id, name, image, quantity, option, finalPrice];
    } else {
      // Insert into the cart for anonymous users
      insertQuery =
        "INSERT INTO cart (session_id, product_id, name, image, quantity, option, price) VALUES ($1, $2, $3, $4, $5, $6, $7)";
      insertValues = [
        req.cookies.sessionId,
        id,
        name,
        image,
        quantity,
        option,
        finalPrice,
      ];
    }

    await pool.query(insertQuery, insertValues);

    res
      .status(200)
      .json({ msg: "Certificazione aggiunta al carrello con successo" });
  } catch (error) {
    console.error(
      "Errore nell'aggiungere la certificazione al carrello:",
      error,
    );
    res
      .status(500)
      .json({ msg: "Errore nell'aggiungere la certificazione al carrello" });
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
      query =
        "SELECT cart.product_id AS product_id, cart.quantity AS quantity, products.name AS name, products.image AS image, cart.price AS price, cart.option AS option, products.category AS category FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = $1";
      query2 = "SELECT COUNT(*) FROM cart WHERE user_id = $1";
      values = [user_id];
    } else {
      query =
        "SELECT cart.product_id AS product_id, cart.quantity AS quantity, products.name AS name, products.image AS image, cart.price AS price, cart.option AS option, products.category AS category FROM cart JOIN products ON cart.product_id = products.id WHERE cart.session_id = $1";
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
});

app.put("/api/update-quantity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (req.headers.authorization) {
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
    const session_id = req.header("session-id");

    let query;
    let values;

    if (user_id) {
      query =
        "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3";
      values = [quantity, user_id, id];
    } else {
      query =
        "UPDATE cart SET quantity = $1 WHERE session_id = $2 AND product_id = $3";
      values = [quantity, session_id, id];
    }

    await pool.query(query, values);
    res.status(200).json({ msg: "Quantità aggiornata correttamente" });
  } catch (error) {
    console.error("Errore nell'aggiornare la quantità:", error);
    res.status(500).json({ msg: "Errore nell'aggiornare la quantità" });
  }
});

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
    res
      .status(200)
      .json({ msg: "Certificazione rimossa dal carrello con successo" });
  } catch (error) {
    console.error(
      "Errore nel rimuovere la certificazione dal carrello:",
      error,
    );
    res
      .status(500)
      .json({ msg: "Errore nel rimuovere la certificazione dal carrello" });
  }
});

app.post("/api/send-message", async (req, res) => {
  try {
    const { name, email, company_name, phone, subject, message } = req.body;

    const query =
      "INSERT INTO contacts (name_surname, email, company_name, phone_number, subject, message) VALUES ($1, $2, $3, $4, $5, $6)";
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
    res
      .status(200)
      .json({ messages: result.rows, count: result2.rows[0].count });
  } catch (error) {
    console.error("Errore nel recupero dei messaggi:", error);
    res.status(500).json({ msg: "Errore nel recupero dei messaggi" });
  }
});

app.delete(
  "/api/delete-message/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.user;

      if (role !== "administrator") {
        return res
          .status(400)
          .json({ msg: "Non hai i permessi per eliminare questo messaggio" });
      }

      const query = "DELETE FROM contacts WHERE id = $1";
      const values = [id];
      await pool.query(query, values);

      res.status(200).json({ msg: "Messaggio eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione del messaggio:", error);
      res.status(500).json({ msg: "Errore nell'eliminazione del messaggio" });
    }
  },
);

app.put(
  "/api/edit-news/:id",
  authenticateJWT,
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      const image = req.file;
      const { id } = req.params;
      const { role } = req.user;
      if (role !== "administrator") {
        return res
          .status(400)
          .json({ msg: "Non hai i permessi per modificare le notizie" });
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

      const query =
        "UPDATE news SET (title, content, image) = ($1, $2, $3) WHERE id = $4";
      const values = [title, content, image?.filename, id];
      await pool.query(query, values);

      const query2 = "SELECT * FROM news WHERE id = $1";
      const values2 = [id];
      const result = await pool.query(query2, values2);
      res
        .status(200)
        .json({ msg: "Notizie aggiornate correttamente", tuple: result.rows });
    } catch (error) {
      console.error("Errore nell'aggiornare le notizie:", error);
      res.status(500).json({ msg: "Errore nell'aggiornare le notizie" });
    }
  },
);

app.put(
  "/api/edit-product/:id",
  authenticateJWT,
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, info, cod, category, tag } = req.body;
      const image = req.file;
      const { id } = req.params;
      const { role, user_id } = req.user;
      if (role !== "administrator") {
        return res
          .status(400)
          .json({ msg: "Non hai i permessi per modificare le certificazioni" });
      }

      if (!name || !price || !info || !cod || !category || !tag) {
        return res.status(400).json({
          msg: "I campi nome, prezzo, info, codice, categoria e tag sono obbligatori",
        });
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

      const query =
        "UPDATE products SET (name, price, image, info, cod, category, tag) = ($1, $2, $3, $4, $5, $6, $7) WHERE id = $8 AND user_id = $9";
      const values = [
        name,
        price,
        image?.filename,
        info,
        cod,
        category,
        tag,
        id,
        user_id,
      ];
      const result = await pool.query(query, values);
      res.status(200).json({
        msg: "Certificazione aggiornata con successo",
        tuple: result.rows,
      });
    } catch (error) {
      console.error("Errore nell'aggiornare le certificazioni:", error);
      res.status(500).json({ msg: "Errore nell'aggiornare le certificazioni" });
    }
  },
);

app.post(
  "/api/create-promo-code",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { code, discount, start, expiration, category } = req.body;
      if (!code || !discount || !start || !expiration || !category) {
        return res.status(400).json({ msg: "Completa tutti i campi" });
      } else if (code.length > 20) {
        return res
          .status(400)
          .json({ msg: "Il codice non deve superare i 20 caratteri" });
      } else if (start > expiration) {
        return res
          .status(400)
          .json({ msg: "La data di inizio non deve superare la data di fine" });
      } else if (start < Date.now()) {
        return res.status(400).json({ msg: "Data di inizio non corretta" });
      }

      const date = new Date(expiration);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const query =
        "INSERT INTO promocodes (code, discount, used_by, start, expiration) VALUES ($1, $2, $3, $4, $5)";
      const values = [code, discount, category, start, formattedDate];
      const result = await pool.query(query, values);
      res
        .status(200)
        .json({ msg: "Codice promozionale aggiunto con successo" });
    } catch (error) {
      console.error("Errore nell'inserimento del codice:", error);
      res.status(500).json({ msg: "Errore nell'inserimento del codice" });
    }
  },
);

app.get(
  "/api/fetch-promo-codes",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const query = "SELECT * FROM promocodes";
      const result = await pool.query(query);
      res.status(200).json({ promocodes: result.rows });
    } catch (error) {
      console.error(
        "Errore nell'aggiornare caricare le certificazioni:",
        error,
      );
      res.status(500).json({ msg: "Errore nell'aggiornare le certificazioni" });
    }
  },
);

app.get(
  "/api/fetch-published-assinged-codes",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;

      const query =
        "SELECT code, used_by FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id";
      const result = await pool.query(query);

      //fetch users's assigned codes
      const query2 =
        "SELECT code, used_by FROM promocodes_assignments JOIN promocodes ON promocodes_assignments.promocode_id = promocodes.id WHERE promocodes_assignments.user_id = $1";
      const values2 = [user_id];
      const result2 = await pool.query(query2, values2);

      if (result2.rows.length > 0) {
        result.rows = [...result.rows, ...result2.rows]; // Concatenate the results
      }

      res.status(200).json({ codes: result.rows });
    } catch (error) {
      console.error("Errore nell fetching dei codici pubblicati:", error);
      res
        .status(500)
        .json({ msg: "Errore nell fetching dei codici pubblicati" });
    }
  },
);

app.post(
  "/api/publish-promo-code/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verifica se il codice è già pubblicato
      const check =
        "SELECT * FROM promocodes_publishment WHERE promocode_id = $1";
      const queryCheck = await pool.query(check, [id]);
      if (queryCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ msg: "Codice promozionale già pubblicato." });
      }

      // Inserisce il codice nella tabella
      const query =
        "INSERT INTO promocodes_publishment (promocode_id) VALUES ($1)";
      await pool.query(query, [id]);

      // Risposta di successo
      res.status(200).json({ msg: "Certificazione pubblicata con successo" });
    } catch (error) {
      console.error(
        "Errore durante la pubblicazione del codice promozionale:",
        error,
      );
      res.status(500).json({
        msg: "Errore interno del server durante la pubblicazione del codice promozionale.",
      });
    }
  },
);

app.get(
  "/api/fetch-users-not-assigned-codes/:codeId",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { codeId } = req.params;
      const query =
        "SELECT username, company_name FROM users WHERE id NOT IN (SELECT user_id FROM promocodes_assignments WHERE promocode_id = $1)";
      const values = [codeId];
      const result = await pool.query(query, values);
      res.status(200).json({ users: result.rows });
    } catch (error) {
      console.error("Errore nel trovare gli utenti:", error);
      res.status(500).json({ msg: "Errore nel trovare gli utenti" });
    }
  },
);

app.post(
  "/api/assign-promo-code-to-users/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
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
        const query =
          "INSERT INTO promocodes_assignments (promocode_id, user_id) VALUES ($1, $2)";
        await pool.query(query, [id, userID]);
      }

      res.status(200).json({
        msg: `Codice promozionale assegnato agli utenti (${selectedUsers.join(", ")}) con successo`,
      });
    } catch (error) {
      console.error(
        "Errore durante l'assegnazione del codice promozionale agli utenti:",
        error,
      );
      res.status(500).json({
        msg: "Errore interno del server durante l'assegnazione del codice promozionale agli utenti.",
      });
    }
  },
);

app.post("/api/apply-promo-code", authenticateJWT, async (req, res) => {
  try {
    const { code } = req.body;
    const { user_id } = req.user;

    if (!code) {
      return res.status(400).json({ msg: "Nessun codice inserito" });
    }
    const query =
      "SELECT * FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id WHERE code = $1";
    const values = [code];
    const result = await pool.query(query, values);
    const used_by = result.rows[0].used_by;
    const discount = result.rows[0].discount;
    const code_id = result.rows[0].id;

    if (result.rows.length > 0) {
      if (used_by === "Tutti") {
        return res.status(200).json({
          msg: "Codice valido, lo sconto verra applicato sui prodotti relativi",
          discount: result.rows[0].discount,
          used_by: used_by,
          discount: discount,
          code_id: code_id,
        });
      }

      const queryCheck = await pool.query(
        "SELECT category FROM cart JOIN products on cart.product_id = products.id WHERE cart.user_id = $1",
        [user_id],
      );
      const cartCategories = queryCheck.rows.map((row) => row.category); // fetch the category of each product in the cart
      if (cartCategories.includes(used_by)) {
        return res.status(200).json({
          msg: "Codice valido, lo sconto verra applicato sui prodotti relativi",
          discount: result.rows[0].discount,
          used_by: used_by,
          discount: discount,
          code_id: code_id,
        });
      } else {
        return res.status(400).json({
          msg: "Codice non valido per le certificazioni inserite nel carrello",
        });
      }
    } else {
      return res.status(400).json({ msg: "Codice non esistente" });
    }
  } catch (error) {
    console.error("Errore nell'inserimento del codice:", error);
    res.status(500).json({ msg: "Errore" });
  }
});

app.post("/api/get-code-id", authenticateJWT, async (req, res) => {
  try {
    const { code } = req.body;
    if (code === "") {
      res.status(200).json({ msg: "nessun codice inserito" });
    } else {
      const query =
        "SELECT promocode_id FROM promocodes_publishment JOIN promocodes ON promocodes_publishment.promocode_id = promocodes.id WHERE code = $1";
      const values = [code];
      const result = await pool.query(query, values);

      res.status(200).json({ codeId: result.rows[0].promocode_id });
    }
  } catch (error) {
    console.error("Errore nella richiesta dell'id del codice:", error);
    res.status(500).json({ msg: "Errore" });
  }
});

app.delete(
  "/api/delete-promo-code/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
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
  },
);

app.post("/api/checkout-session", authenticateJWT, async (req, res) => {
  try {
    const { promoCode, products } = req.body;
    const { user_id } = req.user;

    // check if the promo code is valid
    let promo = null;
    if (promoCode) {
      const promoQuery =
        "SELECT * FROM promocodes WHERE code = $1 AND start <= CURRENT_DATE AND expiration >= CURRENT_DATE";
      const promoValues = [promoCode];
      const promoResult = await pool.query(promoQuery, promoValues);

      if (promoResult.rows.length > 0) {
        promo = promoResult.rows[0];
      } else {
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
        return res
          .status(400)
          .json({ msg: `Certificazione con ID ${id} non trovata` });
      }

      const productInfo = productResult.rows[0];

      let productPrice = price; // default price

      if (promo) {
        if (
          promo.used_by === "Tutti" ||
          promo.used_by.includes(productInfo.category)
        ) {
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
          currency: "eur",
          product_data: {
            name: name,
            //images: [path],
          },
          unit_amount: finalPriceInCents,
        },
        quantity: quantity,
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/PaymentSuccess`,
      cancel_url: `${process.env.CLIENT_URL}/Cart`,
      metadata: {
        user_id: user_id,
        promo_code: promoCode || "",
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(
      "Errore durante la creazione della sessione di checkout:",
      error,
    );
    res
      .status(500)
      .json({ msg: "Errore durante la creazione della sessione di checkout" });
  }
});

app.post("/api/create-order", authenticateJWT, async (req, res) => {
  try {
    const { orderData, codeID } = req.body;
    const { user_id } = req.user;

    console.log("Dati dell'ordine:", orderData);
    console.log("Codice ID:", codeID);
    console.log("User ID:", user_id);

    for (const id of orderData) {
      // Recover the quantity and price of the product
      const query =
        "SELECT quantity, price FROM cart WHERE user_id = $1 AND product_id = $2";
      const values = [user_id, id];
      const result = await pool.query(query, values);

      console.log("Risultato query:", result.rows);

      // Check if the product is in the cart
      if (result.rows.length === 0) {
        return res.status(404).json({
          msg: `Certificazione con ID ${id} non trovato nel carrello.`,
        });
      }

      const quantity = result.rows[0].quantity;
      const price = result.rows[0].price;
      const order_date = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const queryCheck =
        "SELECT * FROM orders WHERE user_id = $1 AND product_id = $2";
      const existingOrder = await pool.query(queryCheck, [user_id, id]);

      /*if (existingOrder.rows.length > 0) {
        return res.status(400).json({ msg: `Ordine già esistente per il prodotto ID ${id}.` });
      }*/

      const query2 =
        "INSERT INTO orders (quantity, price, user_id, product_id, code_id, order_date) VALUES ($1, $2, $3, $4, $5, $6)";
      const values2 = [quantity, price, user_id, id, codeID, order_date];
      await pool.query(query2, values2);

      console.log(`Ordine creato per certificazione ID ${id}`);
    }

    res.status(201).json({ msg: "Ordine creato con successo." });
  } catch (error) {
    console.error("Errore durante la creazione dell'ordine:", error);
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

app.get(
  "/api/all-orders",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { user_id, role } = req.user;

      if (role !== "administrator") {
        return res
          .status(200)
          .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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
  },
);

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
    console.error(
      "Errore nella rimozione degli articoli utente dal carrello:",
      error,
    );
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post(
  "/api/send-message-response",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    try {
      const { emailTitle, emailContent, receiverEmail } = req.body;
      const { role, user_id } = req.user;

      if (role !== "administrator") {
        return res
          .status(200)
          .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
      }

      if (!emailTitle || !emailContent) {
        return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
      }

      if (!receiverEmail) {
        return res
          .status(400)
          .json({ msg: "Problemi nel reperire l'email del destinatario" });
      }

      const result = await pool.query(
        "SELECT id, username, email FROM users WHERE email = $1",
        [receiverEmail],
      );

      if (result.rows.length === 0) {
        return res
          .status(400)
          .json({ msg: "Non esiste un utente con questa email" });
      }

      const { username } = result.rows[0];

      const myUsername = "SELECT username FROM users WHERE id = $1";
      const values = [user_id];
      const result2 = await pool.query(myUsername, values);
      if (result2.rows.length === 0) {
        return res
          .status(400)
          .json({ msg: "Non esiste un utente con questo ID" });
      }

      const admin_username = result2.rows[0].username;

      sendEmailResponse({
        recipient_email: receiverEmail,
        email_title: emailTitle,
        email_content: emailContent,
        receiver_username: username,
        admin_username: admin_username,
      });

      return res
        .status(200)
        .json({ msg: "Email di risposta inviata correttamente" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

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
      //buildingScore
    } = req.body;

    //console.log(req.body);

    console.log("Dati dell'ordine:", req.body);

    if (
      !name ||
      !address ||
      !usage ||
      !year ||
      !area ||
      !location ||
      !renovation ||
      !heating ||
      !ventilation ||
      !energyControl ||
      !maintenance ||
      !waterRecovery ||
      !electricityCounter ||
      !electricityAnalyzer ||
      !electricForniture ||
      !lighting ||
      !led ||
      !gasLamp ||
      !autoLightingControlSystem
    ) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori" });
    }

    if (isNaN(area)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'area' deve essere un numero." });
    }

    if (isNaN(lighting)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'illuminazione' deve essere un numero." });
    }

    if (isNaN(led)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'LED' deve essere un numero." });
    }

    if (isNaN(gasLamp)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'lampade a gas' deve essere un numero." });
    }

    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const values = [
      name,
      userId,
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
      electricForniture,
      waterRecovery,
      electricityCounter,
      lighting,
      led,
      gasLamp,
      electricityAnalyzer,
      autoLightingControlSystem,
      ateco,
      activityDescription,
      annualTurnover,
      employees,
      prodProcessDescription,
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
        prodProcessDesc
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
    )
  `;

    await pool.query(query, values);

    res.status(200).json({ msg: "Edificio caricato con successo" });
  } catch (error) {
    console.error("Error inserting building:", error.message);
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
      //buildingScore
    } = req.body;

    //console.log(req.body);

    if (
      !id ||
      !name ||
      !address ||
      !usage ||
      !year ||
      !area ||
      !location ||
      !renovation ||
      !heating ||
      !ventilation ||
      !energyControl ||
      !maintenance ||
      !waterRecovery ||
      !electricityCounter ||
      !electricityAnalyzer ||
      !electricForniture ||
      !lighting ||
      !led ||
      !gasLamp ||
      !autoLightingControlSystem
    ) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori" });
    }

    if (isNaN(area)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'area' deve essere un numero." });
    }

    if (isNaN(lighting)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'illuminazione' deve essere un numero." });
    }

    if (isNaN(led)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'LED' deve essere un numero." });
    }

    if (isNaN(gasLamp)) {
      return res
        .status(400)
        .json({ msg: "Il campo 'lampade a gas' deve essere un numero." });
    }

    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const values = [
      name,
      userId,
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
      electricForniture,
      waterRecovery,
      electricityCounter,
      lighting,
      led,
      gasLamp,
      electricityAnalyzer,
      autoLightingControlSystem,
      ateco,
      activityDescription,
      annualTurnover,
      employees,
      prodProcessDescription,
      id,
    ];

    await pool.query(
      `
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
        prodProcessDesc = $25
      WHERE id = $26
  `,
      values,
    );

    res.status(200).json({ msg: "Edificio aggiornato con successo" });
  } catch (error) {
    console.error("Error updating building:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.delete("/api/delete-building/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    //console.log('ID dai parametri della richiesta:', id);
    const query = "DELETE FROM buildings WHERE user_id = $1 AND id = $2";
    const values = [user_id, id];
    await pool.query(query, values);
    res.status(200).json({ msg: "Edificio rimosso con successo" });
  } catch (error) {
    console.error("Error deleting building:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/fetch-buildings", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ msg: "Utente non autenticato" });
    }

    const rows = await pool.query(
      `
      SELECT * FROM buildings WHERE user_id = $1
    `,
      [userId],
    );

    const numBuildings = await pool.query(
      `
      SELECT COUNT(*) FROM buildings WHERE user_id = $1
    `,
      [userId],
    );

    //console.log('Response:', rows.rows, numBuildings.rows[0].count);

    res
      .status(200)
      .json({ buildings: rows.rows, numBuildings: numBuildings.rows[0].count });
  } catch (error) {
    console.error("Error fetching buildings:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/fetch-building/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const rows = await pool.query(
      `SELECT * FROM buildings WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );
    res.status(200).json({ building: rows.rows[0] });
  } catch (error) {
    console.error("Error fetching building:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post(
  "/api/buildings/:id/upload/plant",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;
      const {
        description,
        plantType,
        serviceType,
        generatorType,
        generatorDescription,
        fuelType,
        hasGasLeak = false,
        refrigerantGases = [],
      } = req.body;

      if (
        !description ||
        !plantType ||
        !serviceType ||
        !generatorType ||
        !fuelType
      ) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      let validGases = [];
      if (hasGasLeak) {
        validGases = refrigerantGases.filter(
          (gas) =>
            gas.type.trim() !== "" &&
            gas.quantity !== "" &&
            !isNaN(Number(gas.quantity)) &&
            Number(gas.quantity) > 0,
        );
        if (validGases.length === 0) {
          return res
            .status(400)
            .json({ msg: "Devi inserire almeno un gas refrigerante" });
        }
      }

      const values = [
        user_id,
        id,
        description,
        plantType,
        serviceType,
        generatorType,
        generatorDescription,
        fuelType,
        //quantity,
        //electricitySupply,
        //plantScore
      ];

      const insertPlantResult = await pool.query(
        `
      INSERT INTO plants (
        user_id, building_id, description, plant_type, service_type, generator_type, generator_description, fuel_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING id
    `,
        values,
      );

      const plant_id = insertPlantResult.rows[0].id;

      if (hasGasLeak && refrigerantGases.length > 0) {
        // Prepariamo query per inserire gas refrigeranti
        for (const gas of validGases) {
          const { type, quantity } = gas;
          await pool.query(
            `
          INSERT INTO refrigerant_gases (
            gas_type, quantity_kg, plant_id, building_id, user_id
          ) VALUES ($1, $2, $3, $4, $5)
        `,
            [type, Number(quantity), plant_id, id, user_id],
          );
        }
      }
      if (hasGasLeak) {
        res
          .status(200)
          .json({ msg: "Impianto e gas refrigeranti aggiunti con successo" });
      } else {
        res.status(200).json({ msg: "Impianto aggiunto con successo" });
      }
    } catch (error) {
      console.error("Error adding plant:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.put(
  "/api/buildings/:id/update/plant/:plant_id",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, plant_id } = req.params;
      const { user_id } = req.user;
      const {
        description,
        plantType,
        serviceType,
        generatorType,
        generatorDescription,
        fuelType,
        hasGasLeak = false,
        refrigerantGases = [],
      } = req.body;

      if (!description || !plantType || !serviceType || !generatorType) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      let validGases = [];
      if (hasGasLeak) {
        validGases = refrigerantGases.filter(
          (gas) =>
            gas.type.trim() !== "" &&
            gas.quantity !== "" &&
            !isNaN(Number(gas.quantity)) &&
            Number(gas.quantity) > 0,
        );
        if (validGases.length === 0) {
          return res
            .status(400)
            .json({ msg: "Devi inserire almeno un gas refrigerante" });
        }
      }

      const values = [
        user_id,
        id,
        description,
        plantType,
        serviceType,
        generatorType,
        generatorDescription,
        fuelType,
        //quantity,
        //electricitySupply,
        //plantScore,
        plant_id,
      ];

      const updatePlantResult = await pool.query(
        `
      UPDATE plants
      SET description = $3, plant_type = $4, service_type = $5, generator_type = $6, generator_description = $7, fuel_type = $8
      WHERE user_id = $1 AND building_id = $2 AND id = $9
      RETURNING id
    `,
        values,
      );

      const _plant_id = updatePlantResult.rows[0].id;

      if (hasGasLeak && refrigerantGases.length > 0) {
        // Prepariamo query per inserire gas refrigeranti
        for (const gas of validGases) {
          const { type, quantity } = gas;
          await pool.query(
            `
          INSERT INTO refrigerant_gases (
            gas_type, quantity_kg, plant_id, building_id, user_id
          ) VALUES ($1, $2, $3, $4, $5)
        `,
            [type, Number(quantity), plant_id, id, user_id],
          );
        }
      }
      if (hasGasLeak) {
        res.status(200).json({
          msg: "Impianto aggiornato con successo e aggiunti gas refrigeranti. Per un'eventuale modifica della fonte energetica, aggiungere il consumo nuovo e modificare quello precedente",
        });
      } else {
        res.status(200).json({
          msg: "Impianto aggiornato con successo. Per un'eventuale modifica della fonte energetica, aggiungere il consumo nuovo e modificare quello precedente",
        });
      }
    } catch (error) {
      console.error("Error updating plant:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get(
  "/api/buildings/:id/fetch-plants",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;

      const query2 =
        "SELECT COUNT(*) FROM plants WHERE building_id = $1 AND user_id = $2";
      const values2 = [id, user_id];
      const result2 = await pool.query(query2, values2);
      const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

      //console.log('Count from database:', count); // Log count

      const rows = await pool.query(
        `SELECT * FROM plants WHERE building_id = $1 AND user_id = $2`,
        [id, user_id],
      );

      res.status(200).json({ plants: rows.rows, count: count });
    } catch (error) {
      console.error("Error fetching plants:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.delete("/api/delete-plant/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    await pool.query(`DELETE FROM plants WHERE id = $1`, [id]);
    res.status(200).json({ msg: "Impianto eliminato con successo" });
  } catch (error) {
    console.error("Error deleting plant:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/buildings/:id/fetch-gases", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const query2 =
      "SELECT COUNT(*) FROM refrigerant_gases WHERE building_id = $1 AND user_id = $2";
    const values2 = [id, user_id];
    const result2 = await pool.query(query2, values2);
    const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

    //console.log('Count from database:', count); // Log count

    const rows = await pool.query(
      `
      SELECT 
        rg.*, 
        p.description AS plant_name
      FROM refrigerant_gases rg
      LEFT JOIN plants p ON rg.plant_id = p.id
      WHERE rg.user_id = $1 AND rg.building_id = $2;
    `,
      [id, user_id],
    );

    res.status(200).json({ gases: rows.rows, count: count });
  } catch (error) {
    console.error("Error fetching gases:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/buildings/:id/upload/gas", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const { type, quantityKg } = req.body;

    if (!type || !quantityKg) {
      return res
        .status(400)
        .json({ msg: "Per favore, compilare tutti i campi" });
    }

    const values = [user_id, id, type, quantityKg];

    await pool.query(
      `
      INSERT INTO refrigerant_gases (
        user_id, building_id, gas_type, quantity_kg
      ) VALUES (
        $1, $2, $3, $4
      )
    `,
      values,
    );

    res.status(200).json({ msg: "Gas clima alterante aggiunto con successo" });
  } catch (error) {
    console.error("Error adding gas:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.put(
  "/api/buildings/:id/update/gas/:gas_id",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, gas_id } = req.params;
      const { user_id } = req.user;
      const { type, quantityKg } = req.body;

      if (!type || !quantityKg) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      const values = [user_id, id, type, quantityKg, gas_id];

      await pool.query(
        `
      UPDATE refrigerant_gases
      SET gas_type = $3, quantity_kg = $4
      WHERE user_id = $1 AND building_id = $2 AND id = $5
    `,
        values,
      );

      res
        .status(200)
        .json({ msg: "Gas clima alterante aggiornato con successo." });
    } catch (error) {
      console.error("Error updating gas:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.delete("/api/delete-gas/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    console.log("user_id:", user_id);
    console.log("id:", id);

    await pool.query(
      `DELETE FROM refrigerant_gases WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );
    res.status(200).json({ msg: "Gas clima alterante eliminato con successo" });
  } catch (error) {
    console.error("Error deleting gas:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get(
  "/api/:buildingID/fetch-user-energies",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { buildingID } = req.params;
      //console.log('buildingID:', buildingID);

      const rows = await pool.query(
        `SELECT DISTINCT fuel_type FROM plants WHERE user_id = $1 AND building_id = $2 AND fuel_type <> 'Elettricità'`,
        [user_id, buildingID],
      );
      res.status(200).json({ energies: rows.rows });
    } catch (error) {
      console.error("Error fetching energies:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.post(
  "/api/:buildingID/add-consumption",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { buildingID } = req.params;
      const { energy_source, consumption } = req.body;

      if (!energy_source || !consumption) {
        return res.status(400).json({
          msg: "Per favore, compilare tutti i campi per ogni consumo",
        });
      }

      const rows = await pool.query(
        `SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2 AND energy_source = $3`,
        [user_id, buildingID, energy_source],
      );

      if (rows.rowCount > 0) {
        return res.status(400).json({ msg: "Hai già aggiunto questo consumo" });
      }

      if (isNaN(consumption)) {
        return res
          .status(400)
          .json({ msg: "Il consumo deve essere un valore numerico" });
      }

      const values = [user_id, buildingID, energy_source, consumption];
      await pool.query(
        `
        INSERT INTO user_consumptions (user_id, building_id, energy_source, consumption)
        VALUES ($1, $2, $3, $4)
      `,
        values,
      );

      res.status(200).json({ msg: "Consumo aggiunto con successo" });
    } catch (error) {
      console.error("Error adding consumption:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get(
  "/api/:buildingID/fetch-consumption-data",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { buildingID } = req.params;
      //console.log('buildingID:', buildingID);

      const rows = await pool.query(
        `SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2`,
        [user_id, buildingID],
      );
      res.status(200).json({ consumptions: rows.rows });
    } catch (error) {
      console.error("Error fetching consumption data:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.put(
  "/api/:buildingID/modify-consumption/:consumptionId",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { buildingID } = req.params;
      const { consumptionId } = req.params;
      const { energy_source, consumption } = req.body;

      if (!energy_source || !consumption) {
        return res.status(400).json({
          msg: "Per favore, compilare tutti i campi per ogni consumo",
        });
      }

      if (isNaN(consumption)) {
        return res
          .status(400)
          .json({ msg: "Il consumo deve essere un valore numerico" });
      }

      await pool.query(
        `UPDATE user_consumptions SET energy_source = $1, consumption = $2 WHERE id = $3 AND building_id = $4 AND user_id = $5`,
        [energy_source, consumption, consumptionId, buildingID, user_id],
      );
      res.status(200).json({ msg: "Consumo modificato con successo" });
    } catch (error) {
      console.error("Error modifying consumption:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.delete(
  "/api/:buildingID/delete-consumption/:id",
  authenticateJWT,
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { buildingID } = req.params;
      const { id } = req.params;

      //console.log('buildingID:', buildingID);
      //console.log('consumption id:', id);
      //console.log('user_id:', user_id);

      await pool.query(
        `DELETE FROM user_consumptions WHERE id = $1 AND building_id = $2 AND user_id = $3`,
        [id, buildingID, user_id],
      );
      res.status(200).json({ msg: "Consumo eliminato con successo" });
    } catch (error) {
      console.error("Error deleting consumption:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.post(
  "/api/buildings/:id/upload/solar",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;
      const { installedArea } = req.body;

      if (!installedArea) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      if (isNaN(installedArea)) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore numerico" });
      }

      if (installedArea <= 0) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore positivo" });
      }

      const values = [id, installedArea];

      await pool.query(
        `
      INSERT INTO solars (
        building_id, installed_area
      ) VALUES (
        $1, $2
      )
    `,
        values,
      );

      res.status(200).json({ msg: "Impianto solare aggiunto con successo" });
    } catch (error) {
      console.error("Error adding solar:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.put(
  "/api/buildings/:id/update/solar/:solarID",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;
      const { installedArea } = req.body;
      const { solarID } = req.params;

      if (!installedArea) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      if (isNaN(installedArea)) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore numerico" });
      }

      if (installedArea <= 0) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore positivo" });
      }

      const values = [installedArea, solarID, id];

      await pool.query(
        `
      UPDATE solars
      SET installed_area = $1
      WHERE id = $2 AND building_id = $3
    `,
        values,
      );

      res.status(200).json({ msg: "Impianto solare aggiornato con successo" });
    } catch (error) {
      console.error("Error updating solar:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.delete("/api/delete-solar/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const values = [id];
    await pool.query("DELETE FROM solars WHERE id = $1", values);
    res.status(200).json({ msg: "Impianto solare eliminato con successo" });
  } catch (error) {
    console.error("Error deleting solar:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get(
  "/api/buildings/:id/fetch-solars",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;

      const rows = await pool.query(
        `SELECT * FROM solars WHERE building_id = $1`,
        [id],
      );

      const query2 = "SELECT COUNT(*) FROM solars WHERE building_id = $1";
      const values2 = [id];
      const result2 = await pool.query(query2, values2);
      const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

      res.status(200).json({ solars: rows.rows, count: count });
    } catch (error) {
      console.error("Error fetching solars:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.post(
  "/api/buildings/:id/upload/photovoltaic",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;
      const { power } = req.body;

      if (!power) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      if (isNaN(power)) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore numerico" });
      }

      if (power <= 0) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore positivo" });
      }

      const values = [id, power];

      await pool.query(
        `
      INSERT INTO photovoltaics (
        building_id, power
      ) VALUES (
        $1, $2
      )
    `,
        values,
      );

      res
        .status(200)
        .json({ msg: "Impianto fotovoltaico aggiunto con successo" });
    } catch (error) {
      console.error("Error adding photovoltaic:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.delete(
  "/api/delete-photovoltaic/:id",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;

      const values = [id];
      await pool.query("DELETE FROM photovoltaics WHERE id = $1", values);
      res
        .status(200)
        .json({ msg: "Impianto fotovoltaico eliminato con successo" });
    } catch (error) {
      console.error("Error deleting photovoltaic:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.put(
  "/api/buildings/:id/update-photovoltaic/:photoID",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id, photoID } = req.params;
      const { user_id } = req.user;
      const { power } = req.body;

      if (!power) {
        return res
          .status(400)
          .json({ msg: "Per favore, compilare tutti i campi" });
      }

      if (isNaN(power)) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore numerico" });
      }

      if (power <= 0) {
        return res
          .status(400)
          .json({ msg: "Per favore, inserisci un valore positivo" });
      }

      const values = [power, photoID, id];
      await pool.query(
        `
      UPDATE photovoltaics
      SET power = $1
      WHERE id = $2 AND building_id = $3
    `,
        values,
      );
      res
        .status(200)
        .json({ msg: "Impianto fotovoltaico aggiornato con successo" });
    } catch (error) {
      console.error("Error updating photovoltaic:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get(
  "/api/buildings/:id/fetch-photovoltaics",
  authenticateJWT,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.user;

      const rows = await pool.query(
        `SELECT * FROM photovoltaics WHERE building_id = $1`,
        [id],
      );

      const query2 =
        "SELECT COUNT(*) FROM photovoltaics WHERE building_id = $1";
      const values2 = [id];
      const result2 = await pool.query(query2, values2);
      const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

      res.status(200).json({ photos: rows.rows, count: count });
    } catch (error) {
      console.error("Error fetching photovoltaics:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get(
  "/api/:buildingID/fetch-emissions-data",
  authenticateJWT,
  async (req, res) => {
    try {
      const { buildingID } = req.params;
      const { user_id } = req.user;

      //fetch building data
      const buildingData = await pool.query(
        `SELECT * FROM buildings WHERE id = $1`,
        [buildingID],
      );

      if (buildingData.rows.length === 0) {
        return res.status(404).json({ msg: "Edificio non trovato" });
      }

      const building = buildingData.rows[0];

      //Check if building has at least one plant
      const hasPlants = await pool.query(
        `SELECT COUNT(*)::int AS count FROM plants WHERE building_id = $1 AND user_id = $2`,
        [buildingID, user_id],
      );
      if (hasPlants.rows[0].count === 0) {
        return res.status(400).json({
          error:
            "Non hai inserito impianti nel tuo edificio. Almeno un impianto è richiesto",
        });
      }

      // Check if user has consumption data for the building
      const userHasConsumptionData = await pool.query(
        "SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2;",
        [user_id, buildingID],
      );
      if (userHasConsumptionData.rows.length === 0) {
        return res.status(400).json({
          error: "Non hai ancora dati di consumo per questo edificio",
        });
      }

      // Recover the quantity and price of the product
      const plantsConsumptions = await pool.query(
        "SELECT fuel_type FROM plants WHERE user_id = $1 AND building_id = $2;",
        [user_id, buildingID],
      );
      //console.log("consumptionCheck:", plantsConsumptions.rows);

      // Recover the quantity and price of the product
      const userConsumptions = await pool.query(
        "SELECT energy_source FROM user_consumptions WHERE user_id = $1 AND building_id = $2;",
        [user_id, buildingID],
      );
      //console.log("userConsumptions:", userConsumptions.rows);

      const userRefrigerantGasesResult = await pool.query(
        "SELECT gas_type, quantity_kg FROM refrigerant_gases WHERE user_id = $1 AND building_id = $2;",
        [user_id, buildingID],
      );

      const userRefrigerantGases = userRefrigerantGasesResult.rows;

      // Extract the fuel types from the rows
      const plantFuelTypes = plantsConsumptions.rows.map(
        (row) => row.fuel_type,
      );
      const userEnergySources = userConsumptions.rows.map(
        (row) => row.energy_source,
      );

      if (!userEnergySources.includes("Elettricità")) {
        return res
          .status(400)
          .json({ error: "Il consumo di elettricità è richiesto." });
      }

      // Check if all fuel types are present
      const allFuelTypesMatched = plantFuelTypes.every((fuelType) =>
        userEnergySources.includes(fuelType),
      );

      // Find missing fuel types
      const missingConsumptions = plantFuelTypes.filter(
        (fuelType) => !userEnergySources.includes(fuelType),
      );

      //console.log("missingEnergySources:", missingConsumptions);
      //check if an userenergysource is not included in plantfueltypes
      const allEnergySourcesMatched = userEnergySources
        .filter((energySource) => energySource !== "Elettricità")
        .every((energySource) => plantFuelTypes.includes(energySource));
      const missingEnergySources = userEnergySources.filter(
        (energySource) => !plantFuelTypes.includes(energySource),
      );
      //remove Elettricità
      missingEnergySources.splice(
        missingEnergySources.indexOf("Elettricità"),
        1,
      );
      console.log("missingEnergySources:", missingEnergySources);

      if (!allEnergySourcesMatched) {
        return res.status(400).json({
          error: `Il consumo ${missingEnergySources} registrato non è più presente tra gli impianti.`,
        });
      }

      if (!allFuelTypesMatched) {
        return res.status(400).json({
          error: `Non ha inserito tutti i consumi. Consumi mancanti: ${missingConsumptions}`,
        });
      }

      //Fetch solars and photovoltaics data fo user and building
      const rows = await pool.query(
        `SELECT * FROM photovoltaics WHERE building_id = $1`,
        [buildingID],
      );
      const query2 =
        "SELECT COUNT(*) FROM photovoltaics WHERE building_id = $1";
      const totalPower = await pool.query(
        `SELECT SUM(power) FROM photovoltaics WHERE building_id = $1`,
        [buildingID],
      );
      ////console.log(totalPower);
      const values2 = [buildingID];
      const result2 = await pool.query(query2, values2);
      const count = parseInt(result2.rows[0].count, 10); // Convert to integer for accuracy

      const rows2 = await pool.query(
        `SELECT * FROM solars WHERE building_id = $1`,
        [buildingID],
      );
      const query3 = "SELECT COUNT(*) FROM solars WHERE building_id = $1";
      const totalIstalledArea = await pool.query(
        `SELECT SUM(installed_area) FROM solars WHERE building_id = $1`,
        [buildingID],
      );
      ////console.log(totalIstalledArea);
      const values3 = [buildingID];
      const result3 = await pool.query(query3, values3);
      const count2 = parseInt(result3.rows[0].count, 10); // Convert to integer for accuracy

      //fetch building plants
      const query =
        "SELECT * FROM plants WHERE building_id = $1 AND user_id = $2";
      const values = [buildingID, user_id];
      const result = await pool.query(query, values);
      const plants = result.rows;

      const solaData = {
        solars: rows2.rows,
        count2: count2,
        totalIstalledArea: totalIstalledArea.rows[0].sum,
      };

      const photoData = {
        photovoltaics: rows.rows,
        count: count,
        totalPower: totalPower.rows[0].sum,
      };

      //fetch user consumptions
      const query4 =
        "SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2";
      const values4 = [user_id, buildingID];
      const result4 = await pool.query(query4, values4);
      const consumptions = result4.rows;

      res.status(200).json({
        buildingData: building,
        plants: plants,
        solaData: solaData,
        photoData: photoData,
        consumptionsData: consumptions,
        refrigerantGases: userRefrigerantGases,
      });
    } catch (error) {
      console.error("Error fetching photovoltaics:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get("/api/fetch-report-data", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    //fetch user data
    const userData = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      user_id,
    ]);
    const user = userData.rows[0];

    // Fetch all buildings for the user
    const buildingsData = await pool.query(
      `SELECT * FROM buildings WHERE user_id = $1`,
      [user_id],
    );

    // Create arrays to hold the data for each building
    const buildings = [];

    for (const building of buildingsData.rows) {
      const buildingID = building.id;

      // Fetch plants for the current building
      const plantsQuery = await pool.query(
        `SELECT * FROM plants WHERE building_id = $1 AND user_id = $2`,
        [buildingID, user_id],
      );
      const plants = plantsQuery.rows;

      // Fetch photovoltaics data for the current building
      const photoQuery = await pool.query(
        `SELECT * FROM photovoltaics WHERE building_id = $1`,
        [buildingID],
      );
      const totalPowerQuery = await pool.query(
        `SELECT SUM(power) FROM photovoltaics WHERE building_id = $1`,
        [buildingID],
      );

      const photoData = {
        photovoltaics: photoQuery.rows,
        totalPower: totalPowerQuery.rows[0].sum || 0, // In case there's no photovoltaics data
      };

      // Fetch solar data for the current building
      const solarQuery = await pool.query(
        `SELECT * FROM solars WHERE building_id = $1`,
        [buildingID],
      );
      const totalInstalledAreaQuery = await pool.query(
        `SELECT SUM(installed_area) FROM solars WHERE building_id = $1`,
        [buildingID],
      );

      const solaData = {
        solars: solarQuery.rows,
        totalInstalledArea: totalInstalledAreaQuery.rows[0].sum || 0, // In case there's no solar data
      };

      // Fetch consumptions for the current building
      const consumptionsQuery = await pool.query(
        `SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2`,
        [user_id, buildingID],
      );
      const consumptions = consumptionsQuery.rows;

      // Store the data for the current building
      buildings.push({
        building,
        plants,
        photoData,
        solaData,
        consumptions,
      });
    }

    // Return all the building data with their associated details
    res.status(200).json({ user, buildings });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.get("/api/user-questionnaires", authenticateJWT, async (req, res) => {
  try {
    const { user_id } = req.user;

    /*const rows = await pool.query(`
      SELECT 
          o.product_id AS product_id,
          p.category AS product_category,
          sr.total_score AS total_score,
          sr.co2emissions AS co2emissions,
          sr.completed AS completed
      FROM 
          orders o
      JOIN 
          products p ON o.product_id = p.id
      LEFT JOIN 
          survey_responses sr ON sr.certification_id = o.product_id
      WHERE 
          o.user_id = $1;
    `, [user_id]);*/

    const rows = await pool.query(
      `
     SELECT DISTINCT ON (p.category)
        o.product_id AS product_id,
        p.category AS product_category,
        sr.total_score AS total_score,
        sr.co2emissions AS co2emissions,
        sr.created_at AS date,
        sr.completed AS completed
    FROM 
        orders o
    JOIN 
        products p ON o.product_id = p.id
    LEFT JOIN 
        survey_responses sr ON sr.certification_id = o.product_id
    WHERE 
        o.user_id = $1
    `,
      [user_id],
    );

    res.status(200).json({ surveyInfo: rows.rows });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ msg: "Errore interno del server" });
  }
});

app.post("/api/responses", authenticateJWT, async (req, res) => {
  const {
    pageNo,
    certification_id,
    totalScore,
    CO2emissions,
    completed,
    surveyData,
  } = req.body;
  const { user_id } = req.user;

  ////console.log("ALL", user_id, pageNo, surveyData, totalScore, completed);

  if (!surveyData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
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
    const values = [
      user_id,
      certification_id,
      pageNo,
      surveyData,
      totalScore,
      CO2emissions,
      completed,
    ]; // Aggiungi totalScore

    const result = await pool.query(query, values);
    res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error inserting or updating survey response:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/responses-fetch", authenticateJWT, async (req, res) => {
  const { certification_id } = req.query;
  const { user_id } = req.user;

  //console.log("ALL", user_id, certification_id);

  try {
    const query = `
      SELECT page_no, survey_data, total_score, co2emissions, completed FROM survey_responses
      WHERE user_id = $1 AND certification_id = $2;
    `;
    const values = [user_id, certification_id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No survey data found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error restoring survey data:", err);
    res.status(500).json({ error: "Internal server error" });
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

app.post(
  "/api/users-assign-score",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { score, requestor_id, generatorType, plant_id } = req.body;

    const { role, user_id } = req.user;
    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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

      const result = await pool.query(query, [
        parseFloat(score),
        requestor_id,
        generatorType,
        plant_id,
      ]);

      if (result.rowCount > 0) {
        res.status(200).json({
          message: "Punteggio aggiornato con successo",
          data: result.rows[0],
        });
      } else {
        res.status(404).json({ message: "Generatore non trovato" });
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento del punteggio:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  },
);

app.post(
  "/api/second-level-certification",
  authenticateJWT,
  async (req, res) => {
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
      if (err.code === "23505") {
        // Error code for unique constraint violation
        return res.status(201).json({
          message:
            "La richiesta per questo utente e certificazione esiste già.",
        });
      }
      console.error(
        "Errore nell'inviare la richiesta di certificazione di secondo, livello",
        err,
      );
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.get(
  "/api/fetch-second-level-requests",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { role, user_id } = req.user;
    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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
      console.error(
        "Errore nel fetch delle richieste di certificazione di secondo, livello",
        err,
      );
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.post(
  "/api/approve-second-level-request",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { request_id, user_requestor_id } = req.body;
    //console.log("request_id:", request_id);
    //console.log("user_requestor_id:", user_requestor_id);
    const { role } = req.user;
    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
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
    `;
      const values2 = [request_id, user_requestor_id];
      await pool.query(query2, values2);

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(
        "Errore nell'approvazione della richiesta di certificazione di secondo, livello",
        err,
      );
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

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
      return res
        .status(204)
        .json({ error: "No approved certification requests found" });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (err) {
    console.error(
      "Errore nel fetch delle richieste di certificazione di secondo, livello",
      err,
    );
    res.status(500).json({ error: "Errore del server" });
  }
});

app.put(
  "/api/cancel-approvation/:approvation_id",
  authenticateJWT,
  async (req, res) => {
    const { approvation_id } = req.params;
    const { user_id } = req.user;

    try {
      await pool.query(
        `UPDATE second_level_certification_approvation
       SET is_cancelled = TRUE
       WHERE id = $1 AND user_id = $2`,
        [approvation_id, user_id],
      );

      res.status(200).json({ message: "Approvation cancelled successfully" });
    } catch (err) {
      console.error(
        "Errore nel fetch delle richieste di certificazione di secondo, livello",
        err,
      );
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.delete(
  "/api/delete-second-level-request",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { request_id, user_requestor_id } = req.query; // Cambia req.body con req.query
    const { role } = req.user;
    //console.log("request_id:", request_id);
    //console.log("user_requestor_id:", user_requestor_id);
    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    try {
      const query = `
      DELETE FROM second_level_certification_requests
      WHERE id = $1 AND user_id = $2;
    `;
      const values = [request_id, user_requestor_id];
      await pool.query(query, values);
      res.status(200).json({ message: "Request deleted successfully" });
    } catch (err) {
      console.error(
        "Errore nel fetch delle richieste di certificazione di secondo livello",
        err,
      );
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.get(
  "/api/fetch-user-info-by-buildings",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { role } = req.user;

    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    try {
      const query =
        "SELECT * FROM users WHERE id IN (SELECT DISTINCT user_id FROM buildings);";
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        return res.status(204).json({ error: "Nessun utente trovato" });
      } else if (result.rows.length > 0) {
        return res.status(200).json(result.rows);
      }
    } catch (err) {
      console.error("Errore nel fetch dei dati", err);
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.get(
  "/api/fetch-user-buildings/:id",
  authenticateJWT,
  authenticateAdmin,
  async (req, res) => {
    const { role } = req.user;
    const { id } = req.params;

    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    try {
      const query = "SELECT * FROM buildings WHERE user_id = $1;";
      const values = [id];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(204).json({ error: "Nessun edificio trovato" });
      } else if (result.rows.length > 0) {
        return res.status(200).json(result.rows);
      }
    } catch (err) {
      console.error("Errore nel fetch dei dati", err);
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.get(
  "/api/fetch-building-plants-solars-photos/:id/:buildingID",
  authenticateJWT,
  async (req, res) => {
    const { role } = req.user;
    const { id, buildingID } = req.params;
    //console.log("buildingID:", buildingID);
    //console.log("id:", id);

    if (role !== "administrator") {
      return res
        .status(200)
        .json({ msg: "Non hai i permessi per accedere a questa risorsa" });
    }

    try {
      //fetch plants
      const query =
        "SELECT * FROM plants WHERE user_id = $1 AND building_id = $2;";
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

      //fetch user consumptions
      const query4 =
        "SELECT * FROM user_consumptions WHERE user_id = $1 AND building_id = $2;";
      const values4 = [id, buildingID];
      const result4 = await pool.query(query4, values4);

      if (result.rows.length === 0) {
        return res.status(204).json({ error: "Alcuni dati non trovati" });
      } else if (result.rows.length > 0) {
        return res.status(200).json({
          plants: result.rows,
          solars: result2.rows,
          photovoltaics: result3.rows,
          consumptions: result4.rows,
        });
      }
    } catch (err) {
      console.error("Errore nel fetch dei dati", err);
      res.status(500).json({ error: "Errore del server" });
    }
  },
);

app.put(
  "/api/insert-results/:buildingID",
  authenticateJWT,
  async (req, res) => {
    const { user_id } = req.user;
    const { buildingID } = req.params;
    const { finalVote, totalCO2Emissions, areaCO2Emissions } = req.body;
    console.log("buildingID:", buildingID);
    console.log("user_id:", user_id);
    console.log("finalVote:", finalVote);
    console.log("totalCO2Emissions:", totalCO2Emissions);

    try {
      await pool.query(
        `UPDATE buildings SET  emissionMark = $1, emissionCO2 = $2, areaEmissionCO2 = $3, results_visible = true WHERE id = $4 AND user_id = $5`,
        [finalVote, totalCO2Emissions, areaCO2Emissions, buildingID, user_id],
      );
      res.status(200).json({ msg: "Risultati inseriti con successo" });
    } catch (error) {
      console.error("Error inserting results:", error.message);
      res.status(500).json({ msg: "Errore interno del server" });
    }
  },
);

app.get("/api/fetch-results/:buildingID", authenticateJWT, async (req, res) => {
  const { user_id } = req.user;
  const { buildingID } = req.params;
  //console.log("buildingID:", buildingID);
  //console.log("user_id:", user_id);

  try {
    const query =
      "SELECT emissionMark, emissionCO2, areaEmissionCO2, results_visible FROM buildings WHERE id = $1 AND user_id = $2;";
    const values = [buildingID, user_id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(204).json({ emsgror: "Alcuni dati non trovati" });
    } else if (result.rows.length > 0) {
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Errore nel fetch dei dati", error.message);
    res.status(500).json({ msg: "Errore del server" });
  }
});

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

    const query2 =
      "SELECT COUNT(*) FROM buildings WHERE emissionMark IS NOT NULL AND emissionCO2 IS NOT NULL AND areaEmissionCO2 IS NOT NULL AND results_visible = TRUE AND user_id = $1;";
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
    res.status(500).json({ msg: "Errore del server" });
  }
});

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
    res.status(500).json({ msg: "Errore del server" });
  }
});

async function vatCheck(vatNumber) {
  try {
    if (!vatNumber || vatNumber.length < 3) {
      return false;
    }

    //non tutte le societa scelgono di rendere pubblici nome e indirizzo nel sistema VIES.
    const pivaRegex = /^[A-Z]{2}[0-9]{11}$/;
    if (!pivaRegex.test(vatNumber)) {
      return false;
    }

    const countryCode = vatNumber.slice(0, 2).toUpperCase();
    const number = vatNumber.slice(2);

    const validationInfo = await new Promise((resolve, reject) => {
      validate(countryCode, number, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });

    return {
      valid: validationInfo.valid,
      companyName: validationInfo.name,
      address: validationInfo.address,
    }; // true o false
  } catch (error) {
    console.error("Errore durante la verifica della partita IVA:", error);
    return false;
  }
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Qualcosa è andato storto!" });
});

app.listen(port, "0.0.0.0", async () => {
  //console.log(`Server in ascolto sulla porta ${port}`);

  try {
    // Check if the admin user exists
    const res = await pool.query(
      "SELECT * FROM users WHERE administrator = TRUE LIMIT 1",
    );
    if (res.rows.length === 0) {
      // If the admin user doesn't exist, create it
      console.log("PASS_ADMIN:", process.env.PASS_ADMIN);
      const hashedPassword = await bcrypt.hash(process.env.PASS_ADMIN, 10); // Hash the passwords
      await pool.query(
        `INSERT INTO users(username, company_name, email, phone_number, p_iva, tax_code, legal_headquarter, administrator, password_digest, isVerified, first_login)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          process.env.USERNAME_ADMIN,
          "green_visa",
          process.env.EMAIL_ADMIN,
          null,
          null,
          null,
          null,
          true,
          hashedPassword,
          true,
          false,
        ],
      );
      console.log("Admin creato con successo.");
    } else {
      console.log("Admin già esistente.");
    }
  } catch (error) {
    console.error("Errore durante la creazione dell'admin:", error);
  }
});
