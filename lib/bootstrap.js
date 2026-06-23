const { loadEnvConfig } = require('../config/env');

function bootstrap() {
    const config = loadEnvConfig();

    if (config.STORAGE_MODE !== 'file') {
        return;
    }

    const store = require('../data/store');
    store.getStore();

    if (config.READ_ONLY_STORAGE) {
        return;
    }

    store.exportPublicData();
    require('../data/liveSync').startLiveSync();
}

module.exports = { bootstrap };
