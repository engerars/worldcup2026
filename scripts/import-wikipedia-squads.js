/**
 * Import official 2026 World Cup squads from Wikipedia (FIFA-sourced)
 * and write data/source/squads.json + public/data/squads.json directly.
 * Run: npm run import:squads
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { SOURCE_FILES } = require('../data/sourcePaths');
const WIKI_URL = 'https://en.wikipedia.org/w/index.php?title=2026_FIFA_World_Cup_squads&action=raw';
const SKIP_SECTIONS = new Set([
    'Age',
    'Player representation by club',
    'Player representation by league system',
    'Player representation by club confederation',
    'Average age of squads',
    'Coach representation by country',
    'Notes',
    'References',
    'External links'
]);

const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

const WIKI_ALIASES = {
    'DR Congo': 'Democratic Republic of the Congo'
};

function parseWikiLink(raw) {
    if (!raw) return '';
    const m = String(raw).match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (m) return (m[2] || m[1]).trim();
    return String(raw).replace(/\{\{[^}]+\}\}/g, '').trim();
}

function parseCoach(section) {
    const m = section.match(/^Coach:\s*(.+)$/m);
    if (!m) return null;
    const line = m[1];
    const names = [...line.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((x) => (x[2] || x[1]).trim());
    if (names.length) return names.join(' / ');
    return line
        .replace(/\{\{#invoke:[^}]+\}\}/g, '')
        .replace(/\{\{small\|[^}]+\}\}/g, '')
        .replace(/\{\{[^}]+\}\}/g, '')
        .replace(/\s+/g, ' ')
        .trim() || null;
}

function getTemplateField(line, key) {
    const re = new RegExp(`\\|${key}=(\\[\\[[^\\]]+\\]\\]|[^|}]+)`);
    const hit = line.match(re);
    return hit ? hit[1].trim() : '';
}

function parsePlayerLine(line) {
    const pos = getTemplateField(line, 'pos');
    return {
        number: parseInt(getTemplateField(line, 'no'), 10) || 0,
        name: parseWikiLink(getTemplateField(line, 'name')),
        position: pos === 'MF' ? 'MID' : pos,
        club: parseWikiLink(getTemplateField(line, 'club')) || '—'
    };
}

function sortPlayers(players) {
    return [...players].sort((a, b) => {
        const pd = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9);
        if (pd !== 0) return pd;
        return a.number - b.number;
    });
}

function parseSquads(wikitext) {
    const sections = {};
    const parts = wikitext.split(/^===([^=]+)===$/m);
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        const body = parts[i + 1] || '';
        if (!SKIP_SECTIONS.has(title)) sections[title] = body;
    }
    return sections;
}

function buildTeamIdMap(teams) {
    const byName = {};
    teams.forEach((t) => {
        byName[t.name_en] = String(t.id);
    });
    return byName;
}

function resolveTeamId(wikiName, byName) {
    const name = WIKI_ALIASES[wikiName] || wikiName;
    return byName[name] || null;
}

async function main() {
    const teams = JSON.parse(fs.readFileSync(SOURCE_FILES.teams, 'utf8'));
    const byName = buildTeamIdMap(teams);

    console.log('Fetching Wikipedia squads…');
    const res = await fetch(WIKI_URL, { headers: { 'User-Agent': 'worldcup2026-app/1.0 (squad import)' } });
    if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);
    const wikitext = await res.text();

    const sections = parseSquads(wikitext);
    const squads = {};
    const missing = [];
    const stats = [];

    teams.forEach((team) => {
        squads[String(team.id)] = {
            team_id: String(team.id),
            staff: [{ role: 'Head Coach', name: 'TBD' }],
            players: []
        };
    });

    Object.entries(sections).forEach(([wikiName, body]) => {
        const teamId = resolveTeamId(wikiName, byName);
        if (!teamId) {
            missing.push(wikiName);
            return;
        }

        const coach = parseCoach(body);
        const lines = body.match(/\{\{nat fs g player\|[^}]+\}\}/g) || [];
        const players = sortPlayers(lines.map(parsePlayerLine).filter((p) => p.name));

        squads[teamId] = {
            team_id: teamId,
            staff: [{ role: 'Head Coach', name: coach || 'TBD' }],
            players
        };
        stats.push({ wikiName, teamId, players: players.length, coach });
    });

    const outRoot = SOURCE_FILES.squads;
    const outPublic = path.join(ROOT, 'public', 'data', 'squads.json');
    fs.writeFileSync(outRoot, JSON.stringify(squads, null, 2));
    fs.mkdirSync(path.dirname(outPublic), { recursive: true });
    fs.writeFileSync(outPublic, JSON.stringify({ squads }));

    // Keep public export in sync with source of truth
    try {
        require('../data/store').reloadStore();
        require('../data/store').exportPublicData(true);
    } catch (_) {
        /* export optional when store unavailable */
    }

    const teamCount = stats.length;
    const playerTotal = stats.reduce((n, s) => n + s.players, 0);
    console.log(`✅ Wrote ${teamCount} squads (${playerTotal} players)`);
    console.log(`   → ${outRoot}`);
    console.log(`   → ${outPublic}`);

    const bad = stats.filter((s) => s.players !== 26);
    if (bad.length) {
        console.warn('⚠ Teams without 26 players:', bad.map((s) => `${s.wikiName}(${s.players})`).join(', '));
    }
    if (missing.length) {
        console.warn('⚠ Unmapped Wikipedia sections:', missing.join(', '));
    }

    const noCoach = stats.filter((s) => !s.coach);
    if (noCoach.length) {
        console.warn('⚠ Teams missing coach:', noCoach.map((s) => s.wikiName).join(', '));
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
