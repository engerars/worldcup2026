const { loadEnvConfig } = require('../config/env');
const { bootstrap } = require('../bootstrap');
const { createApp } = require('../lib/expressApp');

let cachedApp;

module.exports = (req, res) => {
    if (!cachedApp) {
        loadEnvConfig();
        bootstrap();
        cachedApp = createApp();
    }
    return cachedApp(req, res);
};
