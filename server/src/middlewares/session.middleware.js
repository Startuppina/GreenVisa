const ensureGuestSession = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = `_${Math.random().toString(36).substr(2, 9)}`;
      res.cookie('sessionId', sessionId, {
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });
    }
  }

  next();
};

module.exports = {
  ensureGuestSession,
};
