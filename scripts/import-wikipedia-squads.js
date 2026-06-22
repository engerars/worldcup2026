/**
 * Import official 2026 World Cup squads from Wikipedia (sourced from FIFA).
 * Run: node scripts/import-wikipedia-squads.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
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
    const teams = JSON.parse(fs.readFileSync(path.join(ROOT, 'football.teams.json'), 'utf8'));
    const byName = buildTeamIdMap(teams);

    console.log('Fetching Wikipedia squads…');
    const res = await fetch(WIKI_URL, { headers: { 'User-Agent': 'worldcup2026-app/1.0 (squad import)' } });
    if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);
    const wikitext = await res.text();

    const sections = parseSquads(wikitext);
    const players = {};
    const coaches = {};
    const missing = [];
    const stats = [];

    Object.entries(sections).forEach(([wikiName, body]) => {
        const teamId = resolveTeamId(wikiName, byName);
        if (!teamId) {
            missing.push(wikiName);
            return;
        }

        const coach = parseCoach(body);
        if (coach) coaches[teamId] = { head: coach, staff: [] };

        const lines = body.match(/\{\{nat fs g player\|[^}]+\}\}/g) || [];
        players[teamId] = lines.map(parsePlayerLine).filter((p) => p.name);
        stats.push({ wikiName, teamId, players: players[teamId].length, coach });
    });

    const playersPath = path.join(__dirname, 'squad-players-seed.json');
    const coachesPath = path.join(__dirname, 'squad-coaches.json');
    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
    fs.writeFileSync(coachesPath, JSON.stringify(coaches, null, 2));

    const teamCount = Object.keys(players).length;
    const playerTotal = Object.values(players).reduce((n, arr) => n + arr.length, 0);
    console.log(`✅ Imported ${teamCount} teams, ${playerTotal} players`);
    console.log(`   → ${playersPath}`);
    console.log(`   → ${coachesPath}`);

    const bad = stats.filter((s) => s.players !== 26);
    if (bad.length) {
        console.warn('⚠ Teams without 26 players:', bad.map((s) => `${s.wikiName}(${s.players})`).join(', '));
    }
    if (missing.length) {
        console.warn('⚠ Unmapped Wikipedia sections:', missing.join(', '));
    }

    const noCoach = teams.map((t) => String(t.id)).filter((id) => !coaches[id]);
    if (noCoach.length) {
        console.warn('⚠ Teams missing coach:', noCoach.join(', '));
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
