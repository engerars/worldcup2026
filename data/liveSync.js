const axios = require('axios');
const store = require('./store');
const { loadEnvConfig } = require('../config/env');

async function syncLiveScores() {
    const config = loadEnvConfig();
    if (!config.LIVE_SYNC_ENABLED || !config.LIVE_SYNC_URL) {
        return;
    }

    const base = config.LIVE_SYNC_URL.replace(/\/$/, '');

    try {
        const [gamesRes, groupsRes] = await Promise.all([
            axios.get(`${base}/get/games`, { timeout: 20000 }),
            axios.get(`${base}/get/groups`, { timeout: 20000 })
        ]);

        const games = gamesRes.data && gamesRes.data.games;
        const groups = groupsRes.data && groupsRes.data.groups;

        if (!Array.isArray(games) || !Array.isArray(groups)) {
            throw new Error('Invalid live data response');
        }

        store.setLiveData({ games, groups });
        console.log(`🔴 Live sync OK — ${games.length} games, ${groups.length} groups`);
    } catch (err) {
        console.warn(`⚠️ Live sync failed: ${err.message}`);
    }
}

function startLiveSync() {
    const config = loadEnvConfig();
    if (!config.LIVE_SYNC_ENABLED) {
        console.log('⏸️ Live score sync disabled');
        return;
    }

    console.log(`🔴 Live sync enabled — ${config.LIVE_SYNC_URL} every ${config.LIVE_SYNC_INTERVAL_MS}ms`);
    syncLiveScores();
    setInterval(syncLiveScores, config.LIVE_SYNC_INTERVAL_MS);
}

module.exports = { syncLiveScores, startLiveSync };
