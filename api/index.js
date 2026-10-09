const { app, ready } = require("../server");

module.exports = async function handler(req, res) {
  await ready;
  return app(req, res);
};
