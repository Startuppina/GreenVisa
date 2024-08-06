const express = require('express');
const session = require('express-session');
const pool = require('./db'); // Assicurati che il modulo `db` sia corretto
const PgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Importa il middleware cors
const port = 8080;

const app = express();

// Abilita CORS per tutte le richieste
app.use(cors({
    origin: 'http://localhost:5173', // Permetti solo il tuo client React
    methods: ['GET', 'POST'], // Specifica i metodi permessi
    credentials: true, // Permetti l'invio di cookie e credenziali
}));

// Middleware per gestire le sessioni
app.use(
    session({
        store: new PgSession({
            pool: pool, // Connection pool
            tableName: "session", // Use the session table we created
        }),
        secret: "your_secret_key", // Replace with your own secret
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000, // cookies last 30 days
            sameSite: "Strict", // Allows the cookie to be sent in all contexts
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*API*/

app.get('/api/auth', (req, res) => {
    if(req.session.user) {
        res.json({ isAtuhenticated: true, user: req.session.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email already exists
        const result = await pool.query(
            "SELECT email FROM users WHERE email = $1", [email]
        );
        if (result.rows.length > 0) {
            req.session.msg = "Email già in uso";
            return res.redirect("/signup"); // Adjust redirect path as needed
        }

        // Validate input fields
        if (email === "" || password === "") {
            req.session.msgToUser = "Per favore riempi tutti i campi";
            return res.redirect("/signup");
        } else if (password.length < 8) {
            req.session.msgToUser = "La password deve essere di almeno 8 caratteri";
            return res.redirect("/signup");
        } else if (!emailCheck(email)) {
            req.session.msgToUser = "Email non valida";
            return res.redirect("/signup");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 8);

        // Insert the new user
        await pool.query(
            "INSERT INTO users (email, password_digest) VALUES ($1, $2)",
            [email, hashedPassword]
        );

        // Render the success message
        req.session.msgToUser = "User registered!";
        return res.redirect("/login");

    } catch (error) {
        console.error(error);
        req.session.msgToUser = "An error occurred. Please try again.";
        return res.redirect("/signup");
    }
});

// Middleware per gestire gli errori
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Qualcosa è andato storto!' });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
