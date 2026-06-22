/**
 * Build football.squads.json from Wikipedia/FIFA squad import + match scorers.
 * Run: npm run import:squads && npm run build:squads
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const teams = JSON.parse(fs.readFileSync(path.join(ROOT, 'football.teams.json'), 'utf8'));
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'football.matches.json'), 'utf8'));

const COACHES = require('./squad-coaches.json');
const PLAYER_SUPPLEMENTS = require('./squad-players-seed.json');

const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

function parseScorers(raw) {
    if (!raw || raw === 'null') return [];
    const names = [];
    const cleaned = String(raw).replace(/[{}"]/g, '');
    cleaned.split(',').forEach(part => {
        const name = part.replace(/\s*\d+.*$/, '').replace(/\(.*?\)/g, '').trim();
        if (name && name.length > 1 && !names.includes(name)) names.push(name);
    });
    return names;
}

function collectScorersFromGames() {
    const byTeam = {};
    games.forEach(game => {
        const pairs = [
            [game.home_team_id, game.home_scorers],
            [game.away_team_id, game.away_scorers]
        ];
        pairs.forEach(([teamId, scorers]) => {
            if (!teamId || teamId === '0') return;
            if (!byTeam[teamId]) byTeam[teamId] = new Set();
            parseScorers(scorers).forEach(n => byTeam[teamId].add(n));
        });
    });
    return byTeam;
}

function mergePlayers(teamId, scorerNames) {
    const seed = PLAYER_SUPPLEMENTS[teamId] || [];
    if (seed.length >= 20) {
        return [...seed].sort((a, b) => {
            const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9);
            if (pd !== 0) return pd;
            return a.number - b.number;
        });
    }

    const map = new Map();
    let nextNum = 1;

    const add = (p) => {
        const key = p.name.toLowerCase();
        if (map.has(key)) return;
        map.set(key, {
            number: p.number || nextNum++,
            name: p.name,
            position: p.position || 'MID',
            club: p.club || '—'
        });
    };

    seed.forEach(add);
    scorerNames.forEach(name => add({ name, position: 'FWD' }));

    return [...map.values()]
        .sort((a, b) => {
            const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9);
            if (pd !== 0) return pd;
            return a.number - b.number;
        })
        .map((p, i) => ({ ...p, number: p.number || i + 1 }));
}

function buildSquads() {
    const scorers = collectScorersFromGames();
    const squads = {};

    teams.forEach(team => {
        const id = String(team.id);
        const coach = COACHES[id] || { head: 'TBD', staff: [] };
        const staff = [{ role: 'Head Coach', name: coach.head }];
        (coach.staff || []).forEach((name, i) => {
            staff.push({
                role: i === 0 ? 'Assistant Coach' : 'Goalkeeping Coach',
                name
            });
        });
        const players = mergePlayers(id, [...(scorers[id] || [])]);

        squads[id] = {
            team_id: id,
            staff,
            players
        };
    });

    return squads;
}

const squads = buildSquads();
const outRoot = path.join(ROOT, 'football.squads.json');
const outPublic = path.join(ROOT, 'public', 'data', 'squads.json');

fs.writeFileSync(outRoot, JSON.stringify(squads, null, 2));
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outPublic, JSON.stringify({ squads }, null, 2));

console.log(`✅ Wrote ${Object.keys(squads).length} team squads → football.squads.json & public/data/squads.json`);
