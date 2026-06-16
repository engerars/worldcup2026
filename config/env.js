const path = require('path');
const dotenv = require('dotenv');

let configLoaded = false;
let config = null;

function loadEnvConfig() {
  if (configLoaded) return config;

  const NODE_ENV = (process.env.NODE_ENV || 'development').trim();
  const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';
  const envPath = path.resolve(process.cwd(), envFile);

  const result = dotenv.config({ path: envPath });
  if (result.error) {
    dotenv.config();
  }

  config = {
    NODE_ENV,
    isDev: NODE_ENV === 'development',
    isProd: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isProduction: NODE_ENV === 'production',
    PORT: parseInt(process.env.PORT, 10) || 3050,
    API_URL: process.env.API_URL || `http://localhost:${process.env.PORT || 3050}`,
    FRONTEND_URL: process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3050}`,
    STORAGE_MODE: process.env.STORAGE_MODE || 'file',
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
    CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
    LOG_LEVEL: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'debug'),
    ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true' || NODE_ENV === 'development',
    LIVE_SYNC_ENABLED: process.env.LIVE_SYNC_ENABLED !== 'false',
    LIVE_SYNC_URL: process.env.LIVE_SYNC_URL || 'https://worldcup26.ir',
    LIVE_SYNC_INTERVAL_MS: parseInt(process.env.LIVE_SYNC_INTERVAL_MS, 10) || 30000,
    LIVE_POLL_INTERVAL_MS: parseInt(process.env.LIVE_POLL_INTERVAL_MS, 10) || 30000,
    getCorsOrigins: function() {
      const origins = process.env.CORS_ORIGINS || '*';
      if (origins === '*') return '*';
      return origins.split(',').map((o) => o.trim());
    }
  };

  configLoaded = true;
  return config;
}

module.exports = { loadEnvConfig, config: null };

Object.defineProperty(module.exports, 'config', {
  get: function() {
    if (!config) loadEnvConfig();
    return config;
  }
});
