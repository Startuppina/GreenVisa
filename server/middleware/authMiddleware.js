const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const COOKIE_EXPIRY_MS = 3 * ONE_DAY;

const jwt = require("jsonwebtoken");

function containsSessionId(req, res, next) {
  const token = req.cookies.accessToken;
  if (token) next();
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = "_" + Math.random().toString(36).substr(2, 9);
    res.cookie("sessionId", sessionId, {
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
      maxAge: COOKIE_EXPIRY_MS,
    });
  }

  next();
}

function authenticateJWT(req, res, next) {
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;
  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err && err instanceof jwt.TokenExpiredError) {
      console.error("Sessione scaduta, rieffettua il login per continuare");
      res.clearCookie("accessToken", {
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      });
      res.status(401).json({
        message: "Sessione scaduta, rieffettua il login per continuare",
      });
      return;
    }

    req.user = user;
    next();
  });
}

module.exports = { containsSessionId };
