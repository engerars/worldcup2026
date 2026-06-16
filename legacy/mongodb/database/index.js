const mongoose = require('mongoose');
const { loadEnvConfig } = require('../../../config/env');

mongoose.set('strictQuery', false);
mongoose.Promise = global.Promise;

const config = loadEnvConfig();

if (config.STORAGE_MODE === 'file') {
    console.log('📂 File storage mode — MongoDB connection skipped');
} else {
    const isProd = process.env.NODE_ENV === 'production';
    const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/worldcup2026';
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
    };

    console.log(`🔌 Connecting to MongoDB (${isProd ? 'Production' : 'Development'})...`);

    mongoose.connect(url, options)
        .then(() => console.log('✅ Successful connection with MongoDB'))
        .catch((err) => {
            console.log('❌ Error: Connection to MongoDB not successful', err.message);
            process.exit(1);
        });
}

module.exports = mongoose;
