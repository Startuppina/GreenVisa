const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    env: {
      VITEST: 'true',
    },
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 30000,
    testTimeout: 30000,
    setupFiles: ['./tests/setup/env.js'],
  },
});
