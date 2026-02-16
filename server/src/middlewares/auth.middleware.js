const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.accessToken || req.cookies.recoveryToken || null;

  if (!token) {
    console.error('Nessun token fornito');
    return res.sendStatus(401);
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error('Errore di verifica del token:', err);

      if (err.name === 'TokenExpiredError') {
        res.clearCookie('accessToken', {
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        });

        return res.status(401).json({ msg: 'Sessione scaduta, rieffettua il login per continuare' });
      }

      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'administrator') {
    return next();
  }

  return res.status(403).json({ msg: 'Non hai i permessi per accedere a questa risorsa' });
};

module.exports = {
  authenticateJWT,
  authenticateAdmin,
};
