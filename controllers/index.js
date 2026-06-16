const { loadEnvConfig } = require('../config/env');

module.exports = app => {
    const config = loadEnvConfig();

    // Static requires so Vercel's bundler traces all controller dependencies
    require('./getController')(app);
    require('./healthController')(app);
    require('./seoController')(app);

    if (config.STORAGE_MODE !== 'file') {
        require('../legacy/mongodb/controllers/authController')(app);
        require('../legacy/mongodb/controllers/dataController')(app);
        require('../legacy/mongodb/controllers/donationController')(app);
    }
};
