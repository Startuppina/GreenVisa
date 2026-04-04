function getApp() {
  const serverModule = require('../../server');
  return serverModule.app || serverModule;
}

module.exports = {
  getApp,
};
