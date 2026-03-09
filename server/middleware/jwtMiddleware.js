const jwt = require("jsonwebtoken");


function authenticateJWT(req, res, next) {
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;
  if (!token) {
    console.error("Nessun token fornito");
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
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

module.exports = { authenticateJWT };
