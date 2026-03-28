const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;
  if (!token) {
    return res.status(401).json({ msg: 'Autenticazione richiesta' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('accessToken', { httpOnly: false, secure: false, sameSite: 'Lax' });
        return res.status(401).json({ msg: 'Sessione scaduta, rieffettua il login per continuare' });
      }
      return res.sendStatus(403);
    }
    req.user = decoded;
    next();
  });
}

module.exports = { authenticateJWT };
