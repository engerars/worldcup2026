const mongoose = require('mongoose');
const packageJson = require('../package.json');
const { loadEnvConfig } = require('../config/env');

module.exports = (app) => {
    app.get('/health', async (req, res) => {
        try {
            const config = loadEnvConfig();
            const useFileStorage = config.STORAGE_MODE === 'file';

            let database;
            if (useFileStorage) {
                database = { status: 'file', name: 'public/data + IndexedDB (client)' };
            } else {
                const dbStatus = mongoose.connection.readyState;
                const dbStatusText = {
                    0: 'disconnected',
                    1: 'connected',
                    2: 'connecting',
                    3: 'disconnecting'
                }[dbStatus] || 'unknown';
                database = {
                    status: dbStatusText,
                    name: mongoose.connection.name || 'N/A'
                };
            }

            const isHealthy = useFileStorage || mongoose.connection.readyState === 1;

            const healthData = {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: packageJson.version,
                environment: process.env.NODE_ENV || 'development',
                storage: useFileStorage ? 'file' : 'mongodb',
                database,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
                }
            };

            return res.status(isHealthy ? 200 : 503).json(healthData);
        } catch (error) {
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    });

    app.get('/api/health', async (req, res) => {
        req.url = '/health';
        app.handle(req, res);
    });
};
