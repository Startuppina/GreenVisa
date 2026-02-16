const cron = require('node-cron');
const pool = require('../../db');

const cleanUpCart = async () => {
  try {
    await pool.query(`
      DELETE FROM cart
      WHERE session_id IS NOT NULL
      AND user_id IS NULL
    `);
  } catch (error) {
    console.error('Errore nella pulizia del carrello:', error);
  }
};

const deleteExpiredPromoCodes = async () => {
  try {
    await pool.query(`
      DELETE FROM promocodes
      WHERE expiration <= NOW()
    `);
  } catch (error) {
    console.error('Error deleting expired promo codes:', error);
  }
};

const registerMaintenanceJobs = () => {
  cron.schedule('0 0 */3 * *', cleanUpCart);
  cron.schedule('0 * * * *', deleteExpiredPromoCodes);
};

module.exports = {
  registerMaintenanceJobs,
};
