const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    hookTimeout: 30000,
    testTimeout: 30000,
    setupFiles: ['./tests/setup/env.js'],
  },
});
