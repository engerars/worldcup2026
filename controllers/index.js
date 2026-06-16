const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('../config/env');

const FILE_MODE_CONTROLLERS = new Set([
    'getController.js',
    'healthController.js',
    'seoController.js'
]);

const MONGODB_MODE_CONTROLLERS = new Set([
    'authController.js',
    'dataController.js',
    'donationController.js'
]);

module.exports = app => {
    const config = loadEnvConfig();
    const allowedControllers = config.STORAGE_MODE === 'file'
        ? FILE_MODE_CONTROLLERS
        : new Set([...FILE_MODE_CONTROLLERS, ...MONGODB_MODE_CONTROLLERS]);

    fs.readdirSync(__dirname)
        .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && allowedControllers.has(file))
        .sort()
        .forEach(file => require(path.resolve(__dirname, file))(app));
};
