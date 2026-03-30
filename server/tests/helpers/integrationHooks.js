const { resetTestDb, setupTestDb, teardownTestDb } = require('./testDb');

function registerIntegrationHooks() {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });
}

module.exports = {
  registerIntegrationHooks,
};
