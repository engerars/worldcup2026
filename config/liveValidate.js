/**
 * Tunable rules for live payload validation (World Cup 2026 defaults).
 * Override via LIVE_VALIDATE_* env vars when upstream shape changes.
 */
function readInt(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : fallback;
}

function readFloat(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
}

function readBool(name, defaultTrue) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return defaultTrue;
    return raw !== 'false' && raw !== '0';
}

function getLiveValidateRules(overrides = {}) {
    const expectedGameCount = readInt('LIVE_VALIDATE_EXPECTED_GAMES', 104);
    const expectedGroupCount = readInt('LIVE_VALIDATE_EXPECTED_GROUPS', 12);

    return {
        expectedGameCount,
        expectedGroupCount,
        minGames: readInt('LIVE_VALIDATE_MIN_GAMES', Math.min(48, expectedGameCount)),
        maxGames: readInt('LIVE_VALIDATE_MAX_GAMES', Math.max(150, expectedGameCount + 20)),
        minGroups: readInt('LIVE_VALIDATE_MIN_GROUPS', Math.min(8, expectedGroupCount)),
        maxGroups: readInt('LIVE_VALIDATE_MAX_GROUPS', Math.max(16, expectedGroupCount + 4)),
        minGameRatio: readFloat('LIVE_VALIDATE_MIN_GAME_RATIO', 0.75),
        requireDistinctGroupCodes: readBool('LIVE_VALIDATE_STRICT_GROUPS', true),
        groupCodePattern: process.env.LIVE_VALIDATE_GROUP_PATTERN || '^[A-L]$',
        ...overrides
    };
}

module.exports = { getLiveValidateRules };
