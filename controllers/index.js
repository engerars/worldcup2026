const { loadEnvConfig } = require('../config/env');

module.exports = app => {
    loadEnvConfig();

    // Static requires so Vercel's bundler traces all controller dependencies
    require('./getController')(app);
    require('./healthController')(app);
};
