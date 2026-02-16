require('dotenv').config();

const app = require('./app');
const { registerMaintenanceJobs } = require('./jobs/maintenance.jobs');
const { ensureAdminExists } = require('./bootstrap/ensureAdmin');

const port = 8080;

registerMaintenanceJobs();

app.listen(port, '0.0.0.0', async () => {
  await ensureAdminExists();
});
