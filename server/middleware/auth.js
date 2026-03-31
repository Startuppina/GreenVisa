const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const log = req.log;
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;
  if (!token) {
    if (log) {
      log.warn({ event: 'auth_unauthorized', reason: 'missing_token' });
    }
    return res.status(401).json({ msg: 'Autenticazione richiesta' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        if (log) log.warn({ event: 'auth_token_expired' });
        res.clearCookie('accessToken', { httpOnly: false, secure: false, sameSite: 'Lax' });
        return res.status(401).json({ msg: 'Sessione scaduta, rieffettua il login per continuare' });
      }
      if (log) log.warn({ event: 'auth_forbidden', reason: 'invalid_token' });
      return res.sendStatus(403);
    }
    req.user = decoded;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  if (req.user && req.user.role === 'administrator') {
    next();
  } else {
    if (req.log) {
      req.log.warn({ event: 'auth_forbidden', reason: 'administrator_required' });
    }
    res.status(403).json({ msg: 'Non hai i permessi per accedere a questa risorsa' });
  }
}

module.exports = { authenticateJWT, authenticateAdmin };
