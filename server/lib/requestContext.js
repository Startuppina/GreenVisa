const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

function run(context, fn) {
  return als.run(context, fn);
}

function getRequestContext() {
  return als.getStore();
}

module.exports = { run, getRequestContext };
