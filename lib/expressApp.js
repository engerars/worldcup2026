const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const { loadEnvConfig } = require('../config/env');

const ROOT = path.join(__dirname, '..');

function createApp() {
    const config = loadEnvConfig();
    const app = express();

    app.set('trust proxy', 1);

    let swaggerUi;
    let specs;
    if (config.ENABLE_SWAGGER) {
        try {
            const swagger = require('../swagger');
            swaggerUi = swagger.swaggerUi;
            specs = swagger.specs;
        } catch (err) {
            console.error('❌ Swagger failed to load:', err.message);
        }
    }

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

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));

    app.use(compression());

    app.use(rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW,
        max: config.RATE_LIMIT_MAX,
        message: {
            error: 'Too many requests, please try again later.',
            retryAfter: '1 second'
        },
        standardHeaders: true,
        legacyHeaders: false,
        validate: { xForwardedForHeader: false }
    }));

    app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

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

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json({ limit: '10kb' }));

    require('../controllers/seoController')(app);

    app.use('/data', (req, res, next) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        next();
    });

    app.use(express.static(path.join(ROOT, 'public')));

    if (swaggerUi && specs) {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'FIFA World Cup 2026 API Documentation'
        }));
    }

    app.get('/', (req, res) => {
        res.sendFile(path.join(ROOT, 'public', 'index.html'));
    });

    require('../controllers/index')(app);

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
        });
    });

    return app;
}

module.exports = { createApp };
