const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const { ensureGuestSession } = require('./middlewares/session.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { registerApiRoutes } = require('./routes/api.routes');

const app = express();

app.use(express.static(path.join(__dirname, '../img')));
app.use('/uploaded_img', express.static(path.join(__dirname, '../uploaded_img')));

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://vps-0fde778b.vps.ovh.net:5173'],
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(ensureGuestSession);

registerApiRoutes(app);

app.use(errorHandler);

module.exports = app;
