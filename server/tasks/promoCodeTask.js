const cron = require("node-cron");

async function deleteExpiredPromoCodes() {
  try {
    const query = "DELETE FROM promocodes WHERE expiration <= NOW()";
    await pool.query(query);
  } catch (error) {
    console.error("Error deleting expired promo codes:", error);
  }
}

cron.schedule("0 * * * *", deleteExpiredPromoCodes);
