const { loadEnvConfig, config } = require('./config/env');
const { bootstrap } = require('./bootstrap');
const { createApp } = require('./lib/expressApp');

loadEnvConfig();

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error(err.stack);
});
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    console.error(err.stack);
});

bootstrap();

const app = createApp();
const PORT = config.PORT;

console.log(`🌍 Environment: ${config.NODE_ENV}`);
console.log(`📊 Rate Limit: ${config.RATE_LIMIT_MAX} req/${config.RATE_LIMIT_WINDOW}ms`);
console.log(`🔗 CORS Origin: ${typeof config.getCorsOrigins() === 'string' ? config.getCorsOrigins() : config.getCorsOrigins().join(', ')}`);
if (config.READ_ONLY_STORAGE) {
    console.log('📁 Read-only storage (serverless) — live sync on demand via /get/live');
} else if (config.LIVE_SYNC_ENABLED) {
    console.log(`🔴 Live sync enabled — ${config.LIVE_SYNC_URL} every ${config.LIVE_SYNC_INTERVAL_MS}ms`);
}

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
