const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('../config/env');
const { validateLivePayload } = require('./validateLiveData');

const ROOT = path.join(__dirname, '..');

// Static requires so Vercel/Node bundlers include JSON in the serverless bundle
const SOURCE_FILES = {
    teams: require('../football.teams.json'),
    games: require('../football.matches.json'),
    groups: require('../football.matchtables.json'),
    stadiums: require('../football.stadiums.json'),
    squads: require('../football.squads.json')
};

function normalizeMongoJson(value) {
    return JSON.parse(JSON.stringify(value), (key, v) => {
        if (v && typeof v === 'object' && v.$oid) {
            return v.$oid;
        }
        return v;
    });
}

function loadJson(filename) {
    const raw = fs.readFileSync(path.join(ROOT, filename), 'utf8');
    return JSON.parse(raw, (key, value) => {
        if (value && typeof value === 'object' && value.$oid) {
            return value.$oid;
        }
        return value;
    });
}

function loadSourceData() {
    try {
        return {
            teams: loadJson('football.teams.json'),
            games: loadJson('football.matches.json'),
            groups: loadJson('football.matchtables.json'),
            stadiums: loadJson('football.stadiums.json'),
            squads: loadJson('football.squads.json')
        };
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        return {
            teams: normalizeMongoJson(SOURCE_FILES.teams),
            games: normalizeMongoJson(SOURCE_FILES.games),
            groups: normalizeMongoJson(SOURCE_FILES.groups),
            stadiums: normalizeMongoJson(SOURCE_FILES.stadiums),
            squads: normalizeMongoJson(SOURCE_FILES.squads)
        };
    }
}

let cache = null;
let lastUpdated = null;

function getStore() {
    if (!cache) {
        cache = loadSourceData();
    }
    return cache;
}

function reloadStore() {
    cache = null;
    getStore();
    lastUpdated = Date.now();
}

function stripGameForStorage(game) {
    const {
        home_team_name_en,
        home_team_name_fa,
        away_team_name_en,
        away_team_name_fa,
        ...rest
    } = game;
    return rest;
}

function setLiveData({ games, groups }) {
    if (!cache) getStore();

    const validation = validateLivePayload({
        games: games || cache.games,
        groups: groups || cache.groups,
        teams: cache.teams,
        currentGames: cache.games
    });
    if (!validation.ok) {
        throw new Error(`Refusing to apply live data: ${validation.errors.slice(0, 3).join('; ')}`);
    }

    if (games) cache.games = validation.games.map(stripGameForStorage);
    if (groups) cache.groups = validation.groups;
    lastUpdated = Date.now();

    const readOnly = loadEnvConfig().READ_ONLY_STORAGE;
    if (readOnly) {
        return;
    }

    if (games) {
        fs.writeFileSync(
            path.join(ROOT, 'football.matches.json'),
            JSON.stringify(cache.games, null, 2)
        );
    }
    if (groups) {
        fs.writeFileSync(
            path.join(ROOT, 'football.matchtables.json'),
            JSON.stringify(cache.groups, null, 2)
        );
    }

    exportPublicData(true);
}

function getLastUpdated() {
    return lastUpdated;
}

function getTeamsMap() {
    const map = {};
    getStore().teams.forEach(team => {
        map[team.id] = {
            name_en: team.name_en,
            name_fa: team.name_fa
        };
    });
    return map;
}

function getAllTeams(filter) {
    const { teams } = getStore();
    if (filter && filter.group) {
        return teams.filter(t => t.groups === filter.group.toUpperCase());
    }
    return teams;
}

function getTeamById(id) {
    return getStore().teams.find(t => t._id === id || t.id === id) || null;
}

function normalizeTeamLookupName(name) {
    return String(name || '').trim().toLowerCase();
}

function getTeamByName(name) {
    const query = normalizeTeamLookupName(name);
    if (!query) return null;

    return getStore().teams.find((team) => {
        const candidates = [
            team.name_en,
            team.name_fa,
            team.fifa_code
        ].filter(Boolean).map(normalizeTeamLookupName);
        return candidates.includes(query);
    }) || null;
}

function getAllGames() {
    const teamMap = getTeamsMap();
    return getStore().games.map(game => {
        const enriched = { ...game };
        if (game.home_team_id && teamMap[game.home_team_id]) {
            enriched.home_team_name_en = teamMap[game.home_team_id].name_en;
            enriched.home_team_name_fa = teamMap[game.home_team_id].name_fa;
        }
        if (game.away_team_id && teamMap[game.away_team_id]) {
            enriched.away_team_name_en = teamMap[game.away_team_id].name_en;
            enriched.away_team_name_fa = teamMap[game.away_team_id].name_fa;
        }
        return enriched;
    });
}

function getGameById(id) {
    return getAllGames().find(g => g._id === id || g.id === id) || null;
}

function getAllGroups() {
    const groups = getStore().groups || [];
    return [...groups].sort((a, b) => {
        const nameA = String(a.group || a.name || '').toUpperCase();
        const nameB = String(b.group || b.name || '').toUpperCase();
        return nameA.localeCompare(nameB);
    });
}

function getGroupByName(name) {
    const upper = name.toUpperCase();
    const group = getStore().groups.find(g => String(g.group || g.name || '').toUpperCase() === upper);
    if (!group) return null;
    const teams = getStore().teams.filter(t => t.groups === name.toUpperCase());
    return { group, teams };
}

function getAllStadiums() {
    return getStore().stadiums;
}

function getStadiumById(id) {
    return getStore().stadiums.find(s => s.id === id) || null;
}

function getSquadByTeamId(id) {
    const squads = getStore().squads || {};
    return squads[String(id)] || null;
}

function getAllSquads() {
    return getStore().squads || {};
}

function exportPublicData(quiet) {
    if (loadEnvConfig().READ_ONLY_STORAGE) {
        return;
    }

    const outDir = path.join(ROOT, 'public', 'data');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const storeData = getStore();
    let squads = storeData.squads || {};
    try {
        squads = loadJson('football.squads.json');
        storeData.squads = squads;
    } catch (_) {
        /* keep in-memory squads if file missing */
    }

    const files = {
        'teams.json': { teams: storeData.teams },
        'games.json': { games: getAllGames() },
        'groups.json': { groups: getAllGroups() },
        'stadiums.json': { stadiums: storeData.stadiums },
        'squads.json': { squads }
    };

    Object.entries(files).forEach(([name, data]) => {
        fs.writeFileSync(path.join(outDir, name), JSON.stringify(data));
    });

    if (!quiet) {
        console.log('📦 Exported seed data to public/data/');
    }
}

module.exports = {
    getStore,
    reloadStore,
    setLiveData,
    getLastUpdated,
    getAllTeams,
    getTeamById,
    getTeamByName,
    getAllGames,
    getGameById,
    getAllGroups,
    getGroupByName,
    getAllStadiums,
    getStadiumById,
    getSquadByTeamId,
    getAllSquads,
    exportPublicData
};
