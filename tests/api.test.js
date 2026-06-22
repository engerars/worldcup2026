const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateLivePayload, EXPECTED_GAME_COUNT } = require('../data/validateLiveData');
const store = require('../data/store');

const teams = store.getAllTeams();
const games = store.getStore().games;
const groups = store.getStore().groups;

describe('validateLivePayload', () => {
    it('accepts current bundled data', () => {
        const result = validateLivePayload({ games, groups, teams, currentGames: games });
        assert.equal(result.ok, true);
    });

    it('rejects non-array games', () => {
        const result = validateLivePayload({ games: {}, groups, teams });
        assert.equal(result.ok, false);
    });

    it('rejects truncated game list', () => {
        const result = validateLivePayload({
            games: games.slice(0, 10),
            groups,
            teams,
            currentGames: games
        });
        assert.equal(result.ok, false);
    });

    it('rejects unknown team id in game', () => {
        const bad = games.map((g, i) => (i === 0 ? { ...g, home_team_id: '9999' } : g));
        const result = validateLivePayload({ games: bad, groups, teams, currentGames: games });
        assert.equal(result.ok, false);
    });
});

describe('getTeamByName', () => {
    it('matches case-insensitive English name', () => {
        assert.equal(store.getTeamByName('mexico')?.name_en, 'Mexico');
        assert.equal(store.getTeamByName('UNITED STATES')?.name_en, 'United States');
    });

    it('matches FIFA code', () => {
        assert.equal(store.getTeamByName('bra')?.name_en, 'Brazil');
    });

    it('matches multi-word names', () => {
        assert.equal(store.getTeamByName('Bosnia and Herzegovina')?.fifa_code, 'BIH');
    });

    it('returns null for unknown team', () => {
        assert.equal(store.getTeamByName('Atlantis'), null);
    });
});

describe('getAllGroups', () => {
    it('returns 12 groups sorted A-L', () => {
        const sorted = store.getAllGroups();
        assert.equal(sorted.length, 12);
        const codes = sorted.map((g) => (g.name || g.group).toUpperCase());
        assert.deepEqual(codes, 'ABCDEFGHIJKL'.split(''));
    });
});

describe('squads', () => {
    it('Mexico squad has 26 players', () => {
        const squad = store.getSquadByTeamId('1');
        assert.ok(squad);
        assert.equal(squad.players.length, 26);
    });
});
