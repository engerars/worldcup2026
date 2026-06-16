const { loadEnvConfig } = require('../config/env');
const { bootstrap } = require('../bootstrap');
const { createApp } = require('../lib/expressApp');

loadEnvConfig();
bootstrap();

const app = createApp();
module.exports = app;
