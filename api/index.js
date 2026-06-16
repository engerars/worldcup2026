const { loadEnvConfig } = require('../config/env');
const { bootstrap } = require('../bootstrap');
const { createApp } = require('../app');

loadEnvConfig();
bootstrap();

module.exports = createApp();
