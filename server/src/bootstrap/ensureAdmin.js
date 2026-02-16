const bcrypt = require('bcryptjs');
const pool = require('../../db');

const ensureAdminExists = async () => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE administrator = TRUE LIMIT 1');

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.PASS_ADMIN, 10);
      await pool.query(
        `INSERT INTO users(username, company_name, email, phone_number, p_iva, tax_code, legal_headquarter, administrator, password_digest, isVerified, first_login)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [process.env.USERNAME_ADMIN, 'green_visa', process.env.EMAIL_ADMIN, null, null, null, null, true, hashedPassword, true, false],
      );
      console.log('Admin creato con successo.');
    } else {
      console.log('Admin già esistente.');
    }
  } catch (error) {
    console.error("Errore durante la creazione dell'admin:", error);
  }
};

module.exports = {
  ensureAdminExists,
};
