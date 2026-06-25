const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getKickoffTimestamp, enrichGameKickoff } = require('../lib/matchTime');

describe('matchTime', () => {
    it('converts Mexico City kickoff to UTC', () => {
        const ts = getKickoffTimestamp({
            local_date: '06/11/2026 13:00',
            stadium_id: '1'
        });
        assert.equal(new Date(ts).toISOString(), '2026-06-11T19:00:00.000Z');
    });

    it('formats Vancouver evening kickoff for Vietnam', () => {
        const ts = getKickoffTimestamp({
            local_date: '06/13/2026 21:00',
            stadium_id: '13'
        });
        const vn = new Date(ts).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });
        assert.equal(vn, '14/06/2026, 11:00:00');
    });

    it('enriches games with kickoff_ts', () => {
        const game = enrichGameKickoff({
            id: '1',
            local_date: '06/11/2026 13:00',
            stadium_id: '1'
        });
        assert.equal(game.kickoff_ts, Date.parse('2026-06-11T19:00:00.000Z'));
    });
});
