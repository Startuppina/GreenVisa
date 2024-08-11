const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("./db"); // Your database connection pool
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const cors = require("cors");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
require("dotenv").config();
const port = 8080;

const email_sender = process.env.EMAIL_SENDER;
const pass_sender = process.env.PASS_SENDER;

const app = express();

app.use(express.static("img"));

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


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


const upload = multer({ storage: storage});

app.use('/uploaded_img', express.static(path.join(__dirname, 'uploaded_img')));

const secretKey = process.env.SECRET_KEY;
console.log("Secret key:", secretKey);

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization; // Access the "Authorization" header

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extract the token from the "Authorization" header

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        console.error("Errore di verifica del token:", err); // Log dell'errore di verifica del token
        return res.sendStatus(403); // Token non valido
      }

      req.user = user;
      next();
    });
  } else {
    console.log("Nessun token fornito");
    res.sendStatus(401); // Nessun token fornito
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*const initializeAdminUser = async () => {
    try {
        console.log('Initializing admin user...');
        const result = await pool.query("SELECT * FROM users WHERE administrator = true");

        if (result.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }

        const adminUsername = 'admin';
        const adminEmail = 'danielchionne@gmail.com';
        const adminPassword = 'adminpassword';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await pool.query(
            "INSERT INTO users (username, email, phone_number, administrator, password_digest) VALUES ($1, $2, $3, true, $4)",
            [adminUsername, adminEmail, '+000 0000000', hashedPassword]
        );

        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error initializing admin user:', error);
    }
};*/

app.post("/api/signup", async (req, res) => {
  const { username, email, password, phone } = req.body;

  console.log("Received signup request:", req.body);

  // Validazione
  if (!email || !password || !username || !phone) {
    return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
  } else if (password.length < 8) {
    return res
      .status(400)
      .json({ msg: "La password deve essere di almeno 8 caratteri" });
  } else if (!emailCheck(email)) {
    return res.status(400).json({ msg: "Email non valida" });
  } else if (!phoneCheck(phone)) {
    return res.status(400).json({ msg: "Numero di telefono non valido" });
  }

  try {
    const result = await pool.query(
      "SELECT email FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ msg: "Email già in uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const intPrefix = phone.slice(0, 2);
    const intSuffix = phone.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    await pool.query(
      "INSERT INTO users (username, email, phone_number, administrator, password_digest) VALUES ($1, $2, $3, true, $4)",
      [username, email, newPhone, hashedPassword]
    );

    return res.status(200).json({ msg: "User registered!" });
  } catch (error) {
    console.error("Error during signup:", error);
    return res
      .status(500)
      .json({ msg: "An error occurred. Please try again." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request:", req.body);

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

    const user = result.rows[0]; // Se c'è un utente, ci sarà solo una riga
    const isMatch = await bcrypt.compare(password, user.password_digest);

    if (!isMatch) {
      return res.status(400).json({ msg: "Password errata" });
    }

    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: "7d" });
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 days
    return res
      .status(200)
      .json({ msg: "Login effettuato con successo!", token });
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ msg: "An error occurred. Please try again." });
  }
});

app.post("/api/logout", authenticateJWT, (req, res) => {

  res.status(200).json({ msg: "Logout effettuato con successo!" });
});

app.delete("/api/delete-account", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { id } = req.user;
    console.log("ID dell'utente:", id);

    // Trova e elimina l'utente dal database
    const result = await pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    console.log("Risultato:", result);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.clearCookie("jwt");
    // Invia una risposta di successo
    res.status(200).json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/user-info", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { id } = req.user;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    // Invia la risposta con l'utente trovato
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/update-username", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { id } = req.user;
    const { username } = req.body;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Aggiorna il nome utente nel database
    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [
      username,
      id,
    ]);

    // Invia una risposta di successo
    res.status(200).json({ message: "Username updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/update-phone", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { id } = req.user;
    const { phone_number } = req.body;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const intPrefix = phone_number.slice(0, 2);
    const intSuffix = phone_number.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    // Aggiorna il numero di telefono nel database
    await pool.query("UPDATE users SET phone_number = $1 WHERE id = $2", [
      newPhone,
      id,
    ]);

    // Invia una risposta di successo
    res
      .status(200)
      .json({ message: "Phone number updated successfully", newPhone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/send_email", async (req, res) => {
  try {
    //verifica se l'email esiste nel database
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [req.body.email]
    );
    if (result.rows.length > 0) {
      const recoveryToken = jwt.sign(
        { id: result.rows[0].id},
        secretKey,
        { expiresIn: "1h" }
      )
      console.log(recoveryToken);
      res.status(200).json({ exist: true, token: recoveryToken });
    } else {
      res.status(200).json({ exist: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        //PER RAGIONI DI SICUREZZA LE CREDENZIALI DEVONO STARE NEL .ENV
        user: email_sender,
        pass: pass_sender
      },
    });

    const mail_configs = {
      from: email_sender,
      to: recipient_email,
      subject: "Green Visa Codice di verifica",
      html: `<!DOCTYPE html>
        <html lang="en" >
        <head>
            <meta charset="UTF-8">
            <title>CodePen - OTP Email Template</title>
            
        
        </head>
        <body>
        <!-- partial:index.partial.html -->
        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0; text-align:center">
            <img src="http://localhost:8080/logo2.png" alt="Green Visa" style="width: 150px"/>
            <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #2d7044;text-decoration:none;font-weight:600">Green Visa</a>
            </div>
            <p style="font-size:1.1em">Ciao</p>
            <p>Grazie per aver utilizzato Green Visa. Usa il seguente codice OTP per recuperare la tua password. Il codice è valido per 5 minuti</p>
            <h2 style="background: #2d7044;margin: 0 auto;width: max-content;padding: 0 10px;color: white;border-radius: 4px;">${OTP}</h2>
            <p style="font-size:0.9em;">Saluti,<br />Green Visa</p>
            <hr style="border:none;border-top:1px solid #eee" />
            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Green Visa</p>
                <p>La sostenibilità con un click!</p>
            </div>
            </div>
        </div>
        <!-- partial -->
            
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
  console.log(OTP)
  sendEmail({ recipient_email: email, OTP })
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      console.error("Errore nell'invio dell'email:", error);
      res.status(500).json(error);
    });
});

app.post("/api/change-password", authenticateJWT, async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.user;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare the SQL query
    const query = "UPDATE users SET password_digest = $1 WHERE id = $2";
    const values = [hashedPassword, id];

    // Execute the query
    await pool.query(query, values);

    res.status(200).json({ message: "Password modificata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/upload-news", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { title, content } = req.body;

    if (!req.user || !req.user.id) {
      console.log("ID utente mancante:", req.user);
      return res.status(400).json({ msg: "ID utente mancante" });
    }

    if (!title || !content) {
      return res.status(400).json({ msg: "Titolo e contenuto mancanti" });
    }

    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    const query = "INSERT INTO news (user_id, title, content, image) VALUES ($1, $2, $3, $4)";
    const values = [req.user.id, title, content, image.filename];

    await pool.query(query, values);
    res.status(200).json({ msg: "Image uploaded successfully" });

    console.log("Image uploaded successfully");
    
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ msg: "Error uploading image" });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const query = "SELECT * FROM news";
    const result = await pool.query(query);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ msg: "Error fetching news" });
  }
});


function emailCheck(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function phoneCheck(phone) {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  return re.test(String(phone).toLowerCase());
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Qualcosa è andato storto!" });
});

app.listen(port, async () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
