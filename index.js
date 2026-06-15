// Load environment configuration
const { loadEnvConfig, config } = require('./config/env');
loadEnvConfig();

if (config.STORAGE_MODE === 'file') {
    require('./data/store').exportPublicData();
    require('./data/liveSync').startLiveSync();
}

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

// Catch unhandled errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error(err.stack);
    // Don't exit in dev
    // if (config.isProd) process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    console.error(err.stack);
    // Don't exit in dev
    // if (config.isProd) process.exit(1);
});

const app = express();
const PORT = config.PORT;

// Trust proxy - MUST be set when behind nginx/reverse proxy
// Fixes: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Swagger setup (only in development or if explicitly enabled)
let swaggerUi, specs;
console.log(`🔍 ENABLE_SWAGGER value: ${config.ENABLE_SWAGGER}`);
if (config.ENABLE_SWAGGER) {
    try {
        const swagger = require('./swagger');
        swaggerUi = swagger.swaggerUi;
        specs = swagger.specs;
        console.log(`✅ Swagger loaded: swaggerUi=${!!swaggerUi}, specs=${!!specs}`);
    } catch(err) {
        console.error('❌ Swagger failed to load:', err.message);
    }
} else {
    console.log('⚠️ Swagger is disabled');
}

// CORS - public read endpoints must be reachable from browsers on other origins
const corsOrigins = config.getCorsOrigins();
const publicCorsOptions = {
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false
};
const privateCorsOptions = {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
};

app.use((req, res, next) => {
    if (req.path.startsWith('/get')) {
        return cors(publicCorsOptions)(req, res, next);
    }

    return cors(privateCorsOptions)(req, res, next);
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Compression for faster responses
app.use(compression());

// Rate limiting - configurable per environment
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW,
    max: config.RATE_LIMIT_MAX,
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '1 second'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});
app.use(limiter);

// Logging - always enabled
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

// Request logger - log every request with details
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.url} from ${req.ip}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusIcon = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`${statusIcon} ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
    });
    
    next();
});

console.log(`🌍 Environment: ${config.NODE_ENV}`);
console.log(`📊 Rate Limit: ${config.RATE_LIMIT_MAX} req/${config.RATE_LIMIT_WINDOW}ms`);
console.log(`🔗 CORS Origin: ${typeof corsOrigins === 'string' ? corsOrigins : corsOrigins.join(', ')}`);

app.use(bodyParser.urlencoded({ extended: false }));
const path = require('path');

app.use(bodyParser.json({ limit: '10kb' })); // Limit body size

// Dynamic sitemap - must be before static files middleware
require('./controllers/seoController')(app);

// Never cache live data JSON — scores must stay fresh
app.use('/data', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    next();
});

// Serve static files (UI)
app.use(express.static(path.join(__dirname, 'public')));

// Swagger Documentation
if (swaggerUi && specs) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'FIFA World Cup 2026 API Documentation'
    }));
    console.log('📚 Swagger UI available at /api-docs');
} else {
    console.log('⚠️ Swagger NOT mounted! swaggerUi:', !!swaggerUi, 'specs:', !!specs);
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns API welcome message
 *     tags: [General]
 *     security: []
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to FIFA World Cup 2026 API
 */
// Serve UI for root path - with server-side language detection for SEO
const fs = require('fs');
app.get('/', (req, res) => {
    const lang = req.query.lang;
    if (lang === 'fa') {
        try {
            let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
            html = html
                .replace('<html lang="en" dir="ltr">', '<html lang="fa" dir="rtl">')
                .replace(
                    /<title[^>]*>.*?<\/title>/,
                    '<title id="page-title">جام جهانی فوتبال 2026 | برنامه بازی‌ها، تیم‌ها و نتایج</title>'
                )
                .replace(
                    /<meta name="description"[^>]*>/,
                    '<meta name="description" id="meta-description" content="اطلاعات کامل جام جهانی فوتبال 2026 آمریکا، کانادا و مکزیک. برنامه بازی‌ها، جدول گروه‌ها، اطلاعات تیم‌ها و ورزشگاه‌ها.">'
                )
                .replace(
                    /<meta property="og:title"[^>]*>/,
                    '<meta property="og:title" id="og-title" content="جام جهانی فوتبال 2026 | برنامه بازی‌ها، تیم‌ها و نتایج">'
                )
                .replace(
                    /<meta property="og:description"[^>]*>/,
                    '<meta property="og:description" id="og-description" content="اطلاعات کامل جام جهانی فوتبال 2026 آمریکا، کانادا و مکزیک. برنامه بازی‌ها، جدول گروه‌ها، اطلاعات تیم‌ها و ورزشگاه‌ها.">'
                )
                .replace(
                    /<meta property="og:locale" content="en_US">/,
                    '<meta property="og:locale" content="fa_IR">'
                )
                .replace(
                    /<meta name="twitter:title"[^>]*>/,
                    '<meta name="twitter:title" id="twitter-title" content="جام جهانی فوتبال 2026 | برنامه بازی‌ها، تیم‌ها و نتایج">'
                )
                .replace(
                    /<meta name="twitter:description"[^>]*>/,
                    '<meta name="twitter:description" id="twitter-description" content="اطلاعات کامل جام جهانی فوتبال 2026 آمریکا، کانادا و مکزیک. برنامه بازی‌ها، جدول گروه‌ها، اطلاعات تیم‌ها و ورزشگاه‌ها.">'
                )
                .replace(
                    /<link rel="canonical"[^>]*>/,
                    '<link rel="canonical" href="https://worldcup26.ir/?lang=fa">'
                );
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.send(html);
        } catch (err) {
            console.error('Error serving Persian HTML:', err.message);
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

require('./controllers/index')(app);

app.use((req, res, next) => {
    console.log(`⚠️ 404 Not Found: ${req.method} ${req.url} from ${req.ip}`);
    const erro = new Error('Route not found');
    erro.status = 404;
    next(erro);
});

app.use((error, req, res, next) => {
    console.error(`❌ Error ${error.status || 500}: ${error.message} | ${req.method} ${req.url}`);
    if (error.stack) console.error(error.stack);
    res.status(error.status || 500);
    return res.send({
        error: {
            message: error.message
        }
    })
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
