/**
 * Validate upstream live payload before overwriting local match/standings data.
 */
const EXPECTED_GROUP_COUNT = 12;
const EXPECTED_GAME_COUNT = 104;
const MIN_GAMES = 48;
const MAX_GAMES = 150;
const MIN_GROUPS = 8;
const MAX_GROUPS = 16;

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function groupCode(group) {
    return String(group.group || group.name || '').trim().toUpperCase();
}

function validateGame(game, index, validTeamIds) {
    const errors = [];
    if (!game || typeof game !== 'object') {
        errors.push(`games[${index}]: not an object`);
        return errors;
    }
    if (!isNonEmptyString(game.id)) errors.push(`games[${index}]: missing id`);
    if (!isNonEmptyString(game.home_team_id)) errors.push(`games[${index}]: missing home_team_id`);
    if (!isNonEmptyString(game.away_team_id)) errors.push(`games[${index}]: missing away_team_id`);
    if (validTeamIds) {
        if (game.home_team_id !== '0' && !validTeamIds.has(String(game.home_team_id))) {
            errors.push(`games[${index}]: unknown home_team_id ${game.home_team_id}`);
        }
        if (game.away_team_id !== '0' && !validTeamIds.has(String(game.away_team_id))) {
            errors.push(`games[${index}]: unknown away_team_id ${game.away_team_id}`);
        }
    }
    return errors;
}

function validateGroup(group, index, validTeamIds) {
    const errors = [];
    if (!group || typeof group !== 'object') {
        errors.push(`groups[${index}]: not an object`);
        return errors;
    }
    const code = groupCode(group);
    if (!/^[A-L]$/.test(code)) errors.push(`groups[${index}]: invalid group code "${code}"`);
    if (!Array.isArray(group.teams) || group.teams.length === 0) {
        errors.push(`groups[${index}]: teams must be a non-empty array`);
        return errors;
    }
    group.teams.forEach((row, rowIndex) => {
        if (!row || !isNonEmptyString(row.team_id)) {
            errors.push(`groups[${index}].teams[${rowIndex}]: missing team_id`);
        } else if (validTeamIds && !validTeamIds.has(String(row.team_id))) {
            errors.push(`groups[${index}].teams[${rowIndex}]: unknown team_id ${row.team_id}`);
        }
    });
    return errors;
}

/**
 * @param {{ games?: unknown, groups?: unknown, teams?: Array<{ id: string }>, currentGames?: unknown[] }} payload
 * @returns {{ ok: true, games: object[], groups: object[] } | { ok: false, errors: string[] }}
 */
function validateLivePayload(payload = {}) {
    const errors = [];
    const { games, groups, teams, currentGames } = payload;

    if (!Array.isArray(games)) {
        return { ok: false, errors: ['games must be an array'] };
    }
    if (!Array.isArray(groups)) {
        return { ok: false, errors: ['groups must be an array'] };
    }

    if (games.length < MIN_GAMES || games.length > MAX_GAMES) {
        errors.push(`games length ${games.length} outside allowed range ${MIN_GAMES}-${MAX_GAMES}`);
    }
    if (groups.length < MIN_GROUPS || groups.length > MAX_GROUPS) {
        errors.push(`groups length ${groups.length} outside allowed range ${MIN_GROUPS}-${MAX_GROUPS}`);
    }

    const currentCount = Array.isArray(currentGames) ? currentGames.length : EXPECTED_GAME_COUNT;
    const baseline = currentCount > 0 ? currentCount : EXPECTED_GAME_COUNT;
    const minAllowed = Math.floor(baseline * 0.75);
    if (games.length < minAllowed) {
        errors.push(`games length ${games.length} is below 75% of current baseline (${baseline})`);
    }

    const validTeamIds = Array.isArray(teams)
        ? new Set(teams.map((t) => String(t.id)))
        : null;

    games.forEach((game, index) => {
        errors.push(...validateGame(game, index, validTeamIds));
    });
    groups.forEach((group, index) => {
        errors.push(...validateGroup(group, index, validTeamIds));
    });

    const codes = new Set(groups.map(groupCode).filter(Boolean));
    if (codes.size !== groups.length) {
        errors.push('groups contain duplicate or empty group codes');
    }
    if (groups.length === EXPECTED_GROUP_COUNT && codes.size !== EXPECTED_GROUP_COUNT) {
        errors.push(`expected ${EXPECTED_GROUP_COUNT} distinct group codes A-L`);
    }

    if (errors.length) {
        return { ok: false, errors };
    }
    return { ok: true, games, groups };
}

module.exports = {
    validateLivePayload,
    EXPECTED_GAME_COUNT,
    EXPECTED_GROUP_COUNT
};
