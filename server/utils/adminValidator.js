const ADMINISTRATOR_ROLE = "administrator";

function authenticateAdmin(req, res, next) {
  const { role } = req.user;

  if (!role || role !== ADMINISTRATOR_ROLE) {
    res
      .status(403)
      .json({ message: "Non hai i permessi per accedere a questa risorsa" });
    return;
  }

  next();
}

module.exports = { authenticateAdmin };
