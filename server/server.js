const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("./db"); // Your database connection pool
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
require("dotenv").config();

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const port = 8080;


const email_sender = process.env.EMAIL_SENDER;
const pass_sender = process.env.PASS_SENDER;

const app = express();

// Middleware per il CORS
app.use((req, res, next) => {
  // everyone 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Aggiungi 'Authorization' se stai usando un token JWT
  next();
});

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


const upload = multer({ storage: storage});

app.use('/uploaded_img', express.static(path.join(__dirname, 'uploaded_img')));

const secretKey = process.env.SECRET_KEY;

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
    console.error("Nessun token fornito");
    res.sendStatus(401); // Nessun token fornito
  }
};

//const purify = DOMPurify(window);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/signup", async (req, res) => {
  const { username, email, password, phone } = req.body;

  // Validazione
  if (!email || !password || !username || !phone) {
    return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
  } else if (!passwordCheck(password)) { //implement password check defined below
    return res
      .status(400)
      .json({ msg: "Password non corretta. Segui le info per ottenere una password sicura" }); 
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

    return res.status(200).json({ msg: "Utente registrato" });
  } catch (error) {
    console.error("Errore durante la registrazione dell'utente:", error);
    return res
      .status(500)
      .json({ msg: "Errore durante la registrazione dell'utente" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

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

    const token = jwt.sign({ user_id: user.id }, secretKey, { expiresIn: "7d" });
    return res
      .status(200)
      .json({ msg: "Login effettuato con successo!", token });
  } catch (error) {
    console.error("Errore durante il login:", error);
    return res
      .status(500)
      .json({ msg: "Errore durante il login. Riprova" });
  }
});

app.post("/api/logout", authenticateJWT, (req, res) => {
  res.status(200).json({ msg: "Logout effettuato con successo!" });
});

app.delete("/api/delete-account", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { user_id } = req.user;

    // Trova e elimina l'utente dal database
    const result = await pool.query("DELETE FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Account non trovato" });
    }

    // Invia una risposta di successo
    res.status(200).json({ message: "Account eliminato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.get("/api/user-info", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { user_id } = req.user;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (!result) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Invia la risposta con l'utente trovato
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.put("/api/update-username", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { user_id } = req.user;
    const { username } = req.body;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Aggiorna il nome utente nel database
    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [
      username,
      user_id,
    ]);

    // Invia una risposta di successo
    res.status(200).json({ message: "Username aggiornato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

app.put("/api/update-phone", authenticateJWT, async (req, res) => {
  try {
    // Ottieni l'email dell'utente dal token
    const { user_id } = req.user;
    const { phone_number } = req.body;

    // Trova l'utente dal database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const intPrefix = phone_number.slice(0, 2);
    const intSuffix = phone_number.slice(2);
    const newPhone = `+${intPrefix} ${intSuffix}`;

    // Aggiorna il numero di telefono nel database
    await pool.query("UPDATE users SET phone_number = $1 WHERE id = $2", [
      newPhone,
      user_id,
    ]);

    // Invia una risposta di successo
    res
      .status(200)
      .json({ message: "Numero di telefono aggiornato con successo", newPhone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore interno del server" });
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
    res.status(500).json({ message: "Errore interno del server" });
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
                    <img src="http://localhost:8080/logo2.png" alt="Green Visa">
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

    if(!passwordCheck(password)) {
      return res
        .status(400)
        .json({ msg: "Password non corretta. Segui le info per ottenere una password sicura" });
    }

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
    res.status(500).json({ message: "Errore interno del server" });
  }
});


app.post("/api/upload-news", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { title, content } = req.body;

    if (!req.user || !req.user.user_id) {
      console.log("ID utente mancante:", req.user);
      return res.status(400).json({ msg: "ID utente mancante" });
    }

    if (!title || !content) {
      return res.status(400).json({ msg: "Titolo e contenuto mancanti" });
    }

    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    const sanitizedContent = DOMPurify.sanitize(content);
    const query = "INSERT INTO news (user_id, title, content, image) VALUES ($1, $2, $3, $4)";
    const values = [req.user.user_id, title, sanitizedContent, image.filename];

    await pool.query(query, values);
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
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Errore nel recupero delle notizie:", error);
    res.status(500).json({ msg: "Errore nel recupero delle notizie" });
  }
});

app.get("/api/article/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se l'id è definito e se è un numero intero
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

    //sanitize content with DOMPurify
    result.rows[0].content = DOMPurify.sanitize(result.rows[0].content);

    //send data and countnews
    res.status(200).json({ article: result.rows[0], countnews: countNews.rows[0].count });
  } catch (error) {
    console.error("Errore nel recupero dell'articolo:", error);
    res.status(500).json({ msg: "Errore nel recupero dell'articolo" });
  }
});

app.delete("/api/delete-news/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

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

app.post("/api/upload-product", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { name, price, category, tag, info, cod } = req.body;
    const { user_id } = req.user;

    console.log(name, price, category, tag, info, cod, user_id, image);

    // Controllo che tutti i campi siano compilati
    if (!name || !price || !category || !tag || !info || !cod) {
      return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
    }

    // Controllo che il codice sia unico
    const checkCodQuery = "SELECT * FROM products WHERE cod = $1";
    const checkCodValues = [cod];
    const checkCodResult = await pool.query(checkCodQuery, checkCodValues);
    if (checkCodResult.rows.length > 0) {
      return res.status(400).json({ msg: "Codice prodotto già esistente. Inserisci un codice diverso" });
    }

    // Controllo che il prezzo sia un numero valido
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ msg: "Prezzo non valido" });
    }

    // Controllo che l'immagine sia presente
    if (!image) {
      return res.status(400).json({ msg: "Immagine mancante" });
    }

    if(info.length > 100) {
      return res.status(400).json({ msg: "La descrizione è troppo lunga. Max 100 caratteri" });
    }

    // Inserisco il prodotto nel database
    const query = `
      INSERT INTO products (user_id, name, price, image, info, cod, category, tag) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [user_id, name, parsedPrice, image.filename, info, cod, category, tag];

    await pool.query(query, values);
    res.status(200).json({ msg: "Prodotto caricato con successo" });
  } catch (error) {
    console.error("Errore durante il caricamento del prodotto:", error);
    res.status(500).json({ msg: "Errore durante il caricamento dell'immagine" });
  }
});


app.get("/api/products-info", authenticateJWT, async (req, res) => {
  try {

    // Get the total number of products
    const query = "SELECT COUNT(*) FROM products";
    const result = await pool.query(query);
    console.log(result.rows[0].count);

    // Get all products
    const query2 = "SELECT * FROM products";
    const result2 = await pool.query(query2);
    console.log(result2.rows);
    res.status(200).json({numProducts: result.rows[0].count, products: result2.rows});

  } catch (error) {
    console.error("Errore nel recupero dei prodotti", error);
    res.status(500).json({ msg: "Errore nel recupero dei prodotti" });
  }
});

app.get("/api/product-details/:id", authenticateJWT, async (req, res) => {
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

app.delete("/api/delete-product/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

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
});

app.post("/api/cart-insertion/:id", authenticateJWT, async (req, res) => {
  try {
      const { id } = req.params; // ID del prodotto
      const { user_id } = req.user;
      const { name, image, price, quantity } = req.body;

      // Controlla se il prodotto esiste
      const query = "SELECT * FROM products WHERE id = $1";
      const values = [id];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
          return res.status(404).json({ msg: "Prodotto non trovato" });
      }

      // Aggiungi il prodotto al carrello
      const query2 = "INSERT INTO cart (user_id, product_id, name, image, quantity, price) VALUES ($1, $2, $3, $4, $5, $6)";
      const values2 = [user_id, id, name, image, quantity, price];
      await pool.query(query2, values2);
      res.status(200).json({ msg: "Prodotto aggiunto al carrello con successo" });
  } catch (error) {
      console.error("Errore nell'aggiungere il prodotto al carrello:", error);
      res.status(500).json({ msg: "Errore nell'aggiungere il prodotto al carrello" });
  }
});

app.get("/api/fetch-user-cart", authenticateJWT, async (req, res) => {
  
  try {
    const { user_id } = req.user;

    const query = "SELECT * FROM cart WHERE user_id = $1";
    const values = [user_id];
    const result = await pool.query(query, values);
    console.log(result.rows);
    res.status(200).json({ cart: result.rows });

  } catch (error) {
    console.error("Errore nel recupero del carrello:", error);
    res.status(500).json({ msg: "Errore nel recupero del carrello" });
  }
})

app.put("/api/update-quantity/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const { user_id } = req.user;
    const query = "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3";
    const values = [quantity, user_id, id];
    await pool.query(query, values);
    res.status(200).json({ msg: "Quantità aggiornata correttamente" });
  } catch (error) {
    console.error("Errore nell'aggiornare la quantità:", error);
    res.status(500).json({ msg: "Errore nell'aggiornare la quantità" });
  }
})




function emailCheck(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function passwordCheck(password) {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
  return re.test(String(password));
}

function phoneCheck(phone) {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  return re.test(String(phone).toLowerCase());
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Qualcosa è andato storto!" });
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});

