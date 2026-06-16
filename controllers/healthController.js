const packageJson = require('../package.json');
const { loadEnvConfig } = require('../config/env');

module.exports = (app) => {
    app.get('/health', async (req, res) => {
        try {
            const config = loadEnvConfig();
            const isFileStorage = config.STORAGE_MODE === 'file';

            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: packageJson.version,
                environment: process.env.NODE_ENV || 'development',
                platform: config.isServerless ? 'vercel' : 'node',
                readOnlyStorage: config.READ_ONLY_STORAGE,
                storage: isFileStorage ? 'file' : config.STORAGE_MODE,
                database: {
                    status: isFileStorage ? 'file' : 'legacy',
                    name: isFileStorage ? 'public/data' : 'legacy'
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
                }
            };

            return res.status(200).json(healthData);
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
