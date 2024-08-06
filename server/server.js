const express = require('express');
const session = require('express-session');
const pool = require('./db');
const PgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const port = 8080;

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(
    session({
        store: new PgSession({
            pool: pool,
            tableName: "session",
        }),
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "Strict",
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/auth', (req, res) => {
    if(req.session.user) {
        res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT email FROM users WHERE email = $1", [email]
        );
        if (result.rows.length > 0) {
            return res.status(400).json({ msg: "Email già in uso" });
        }

        if (email === "" || password === "") {
            return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
        } else if (password.length < 8) {
            return res.status(400).json({ msg: "La password deve essere di almeno 8 caratteri" });
        } else if (!emailCheck(email)) {
            return res.status(400).json({ msg: "Email non valida" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        await pool.query(
            "INSERT INTO users (email, administrator, password_digest) VALUES ($1, true, $2)",
            [email, hashedPassword]
        );

        return res.status(200).json({ msg: "User registered!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "An error occurred. Please try again." });
    }
});

function emailCheck(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Qualcosa è andato storto!' });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
