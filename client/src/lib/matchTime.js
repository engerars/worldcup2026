/**
 * Browser copy of lib/matchTime.js — keep logic in sync with the server module.
 */

const STADIUM_TIMEZONES = {
  1: 'America/Mexico_City',
  2: 'America/Mexico_City',
  3: 'America/Monterrey',
  4: 'America/Chicago',
  5: 'America/Chicago',
  6: 'America/Chicago',
  7: 'America/New_York',
  8: 'America/New_York',
  9: 'America/New_York',
  10: 'America/New_York',
  11: 'America/New_York',
  12: 'America/Toronto',
  13: 'America/Vancouver',
  14: 'America/Los_Angeles',
  15: 'America/Los_Angeles',
  16: 'America/Los_Angeles'
};

function parseLocalDateParts(local) {
  const m = String(local || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return {
    month: +m[1],
    day: +m[2],
    year: +m[3],
    hour: +m[4],
    minute: +m[5]
  };
}

function getZonedParts(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date(timestamp));
  const pick = (type) => parts.find((p) => p.type === type)?.value;
  let hour = +pick('hour');
  if (hour === 24) hour = 0;
  return {
    year: +pick('year'),
    month: +pick('month'),
    day: +pick('day'),
    hour,
    minute: +pick('minute')
  };
}

function wallTimeInZoneToUtc({ year, month, day, hour, minute }, timeZone) {
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let utc = desired;
  for (let i = 0; i < 6; i++) {
    const zoned = getZonedParts(utc, timeZone);
    const displayed = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute);
    const diff = desired - displayed;
    if (diff === 0) break;
    utc += diff;
  }
  return utc;
}

function getStadiumTimeZone(stadiumId) {
  if (stadiumId === undefined || stadiumId === null || stadiumId === '') return null;
  return STADIUM_TIMEZONES[String(stadiumId)] || null;
}

export function getKickoffTimestamp(game) {
  if (!game) return 0;
  const existing = Number(game.kickoff_ts);
  if (Number.isFinite(existing) && existing > 0) return existing;

  const parts = parseLocalDateParts(game.local_date);
  if (!parts) return 0;

  const stadiumTz = getStadiumTimeZone(game.stadium_id);
  if (stadiumTz) {
    return wallTimeInZoneToUtc(parts, stadiumTz);
  }

  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute).getTime();
}

export function enrichGameKickoff(game) {
  if (!game) return game;
  const kickoff_ts = getKickoffTimestamp(game);
  if (!kickoff_ts) return game;
  if (Number(game.kickoff_ts) === kickoff_ts) return game;
  return { ...game, kickoff_ts };
}
