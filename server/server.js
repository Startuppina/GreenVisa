const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Your database connection
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require("bcryptjs");
const cors = require('cors');
const port = 8080;

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

const secretKey = 'your-secret-key';

/*
// Session configuration
app.use(session({
    store: new PgSession({
        pool: pool,                // Connection pool
        tableName: 'session'       // Use the "session" table created in the database
    }),
    secret: 'your-session-secret', // Replace with a secret for signing session ID cookies
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));*/

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/auth', authenticateJWT, (req, res) => {
    if (req.user) {
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

app.post('/api/signup', async (req, res) => {
    const { username, email, password, phone } = req.body;

    console.log('Received signup request:', req.body);

    // Validazione
    if (!email || !password) {
        return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
    } else if (password.length < 8) {
        return res.status(400).json({ msg: "La password deve essere di almeno 8 caratteri" });
    } else if (!emailCheck(email)) {
        return res.status(400).json({ msg: "Email non valida" });
    }

    try {
        const result = await pool.query(
            "SELECT email FROM users WHERE email = $1", [email]
        );

        if (result.rows.length > 0) {
            return res.status(400).json({ msg: "Email già in uso" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        await pool.query(
            "INSERT INTO users (username, email, phone_number, administrator, password_digest) VALUES ($1, $2, $3, true, $4)",
            [username, email, phone, hashedPassword]
        );

        const token = jwt.sign({ email }, secretKey, { expiresIn: '7d' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        return res.status(200).json({ msg: "User registered!", token });

    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ msg: "An error occurred. Please try again." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request:', req.body);

    if (!email || !password) {
        return res.status(400).json({ msg: "Per favore riempi tutti i campi" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ msg: "Email non valida" });
        }

        const user = result.rows[0]; // Se c'è un utente, ci sarà solo una riga
        const isMatch = await bcrypt.compare(password, user.password_digest);

        if (!isMatch) {
            return res.status(400).json({ msg: "Password errata" });
        }

        const token = jwt.sign({ email }, secretKey, { expiresIn: '7d' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        return res.status(200).json({ msg: "Login effettuato con successo!", token });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ msg: "An error occurred. Please try again." });
    }
});


app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            res.status(500).json({ msg: "An error occurred. Please try again." });
        } else {
            res.clearCookie('token');
            res.status(200).json({ msg: "Logout effettuato con successo!" });
        }
    });
});

app.post('/api/delete-account', authenticateJWT, async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM users WHERE email = $1", [req.session.user.email]
        );
        req.session.destroy((err) => {
            if (err) {
                console.error('Error during logout:', err);
                res.status(500).json({ msg: "An error occurred. Please try again." });
            } else {
                res.clearCookie('token');
                res.status(200).json({ msg: "Account cancellato con successo!" });
            }
        });
    } catch (error) {
        console.error('Error during deleteaccount:', error);
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
