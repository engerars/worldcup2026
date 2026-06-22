const axios = require('axios');
const store = require('./store');
const { validateLivePayload } = require('./validateLiveData');
const { loadEnvConfig } = require('../config/env');

let lastSyncAt = 0;

async function syncLiveScores(force = false) {
    const config = loadEnvConfig();
    if (!config.LIVE_SYNC_ENABLED || !config.LIVE_SYNC_URL) {
        return;
    }

    const now = Date.now();
    if (!force && now - lastSyncAt < config.LIVE_SYNC_INTERVAL_MS) {
        return;
    }
    lastSyncAt = now;

    const base = config.LIVE_SYNC_URL.replace(/\/$/, '');

    try {
        const [gamesRes, groupsRes] = await Promise.all([
            axios.get(`${base}/get/games`, { timeout: 20000 }),
            axios.get(`${base}/get/groups`, { timeout: 20000 })
        ]);

        const games = gamesRes.data && gamesRes.data.games;
        const groups = groupsRes.data && groupsRes.data.groups;

        const validation = validateLivePayload({
            games,
            groups,
            teams: store.getAllTeams(),
            currentGames: store.getStore().games
        });
        if (!validation.ok) {
            throw new Error(`Live data rejected: ${validation.errors.slice(0, 3).join('; ')}`);
        }

        store.setLiveData({ games: validation.games, groups: validation.groups });
        console.log(`🔴 Live sync OK — ${validation.games.length} games, ${validation.groups.length} groups`);
    } catch (err) {
        console.warn(`⚠️ Live sync failed: ${err.message}`);
    }
}

function startLiveSync() {
    const config = loadEnvConfig();
    if (!config.LIVE_SYNC_ENABLED || config.READ_ONLY_STORAGE) {
        if (config.READ_ONLY_STORAGE && config.LIVE_SYNC_ENABLED) {
            console.log('🔴 Live sync on demand via /get/live (serverless read-only mode)');
        } else {
            console.log('⏸️ Live score sync disabled');
        }
        return;
    }

    console.log(`🔴 Live sync enabled — ${config.LIVE_SYNC_URL} every ${config.LIVE_SYNC_INTERVAL_MS}ms`);
    syncLiveScores();
    setInterval(syncLiveScores, config.LIVE_SYNC_INTERVAL_MS);
}

module.exports = { syncLiveScores, startLiveSync };
