export function isGameFinished(game) {
  const finished = String(game.finished || '').toUpperCase();
  const elapsed = String(game.time_elapsed || '').toLowerCase();
  return finished === 'TRUE' || elapsed === 'finished' || elapsed === 'ft';
}

export function isGameLive(game) {
  if (isGameFinished(game)) return false;
  const elapsed = String(game.time_elapsed || '').toLowerCase();
  return elapsed && !['notstarted', 'ns', 'null', ''].includes(elapsed);
}

export function shouldShowScore(game) {
  return isGameFinished(game) || isGameLive(game);
}

export function sortGamesForDisplay(games) {
  return [...games].sort((a, b) => {
    const rank = (g) => {
      if (isGameLive(g)) return 0;
      if (isGameFinished(g)) return 1;
      return 2;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return String(a.local_date || '').localeCompare(String(b.local_date || ''));
  });
}

export function sortGamesForList(games) {
  return [...games].sort((a, b) => parseGameDateTime(a).timestamp - parseGameDateTime(b).timestamp);
}

export function parseGameDateTime(game) {
  const local = game.local_date || '';
  const m = local.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) {
    return { timestamp: 0, dateKey: 'unknown', timeLabel: '--:--' };
  }
  const month = +m[1];
  const day = +m[2];
  const year = +m[3];
  const hour = +m[4];
  const min = +m[5];
  return {
    timestamp: new Date(year, month - 1, day, hour, min).getTime(),
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  };
}

export function getLocalTodayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function formatMatchDateHeader(dateKey) {
  if (dateKey === 'unknown') return 'All Matches';
  const [y, mo, d] = dateKey.split('-');
  const dt = new Date(+y, +mo - 1, +d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatMatchDateShort(game) {
  const { dateKey } = parseGameDateTime(game);
  if (dateKey === 'unknown') return '';
  const [y, mo, d] = dateKey.split('-');
  return new Date(+y, +mo - 1, +d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function groupGamesByDate(games) {
  const groups = [];
  let current = null;
  for (const game of sortGamesForList(games)) {
    const { dateKey } = parseGameDateTime(game);
    if (!current || current.dateKey !== dateKey) {
      current = { dateKey, games: [] };
      groups.push(current);
    }
    current.games.push(game);
  }
  return groups;
}

export function findFocusMatch(games) {
  const pool = games && games.length ? games : [];
  if (!pool.length) return null;

  const live = sortGamesForList(pool.filter(isGameLive));
  if (live.length) return live[0];

  const todayKey = getLocalTodayKey();
  const todayUnfinished = sortGamesForList(
    pool.filter((g) => !isGameFinished(g) && !isGameLive(g) && parseGameDateTime(g).dateKey === todayKey)
  );
  if (todayUnfinished.length) {
    const now = Date.now();
    const nextToday = todayUnfinished.find((g) => parseGameDateTime(g).timestamp >= now);
    return nextToday || todayUnfinished[todayUnfinished.length - 1];
  }

  const upcoming = sortGamesForList(pool.filter((g) => !isGameFinished(g) && !isGameLive(g)));
  const now = Date.now();
  const next = upcoming.find((g) => parseGameDateTime(g).timestamp >= now);
  if (next) return next;

  return upcoming[0] || null;
}

export function liveFingerprint(games, groups) {
  const g = games.map((x) => `${x.id}:${x.home_score}:${x.away_score}:${x.finished}:${x.time_elapsed}`).join('|');
  const t = groups
    .map((x) => `${x.group}:${(x.teams || []).map((tt) => `${tt.team_id}:${tt.pts}:${tt.gf}:${tt.ga}`).join(',')}`)
    .join('|');
  return g + '::' + t;
}

export function getMatchesScrollOffset() {
  const tabs = document.querySelector('.page-tabs');
  const tabsH = tabs ? tabs.getBoundingClientRect().height : 0;
  return 68 + tabsH + 16;
}

export function scrollToElementWithOffset(el, offset) {
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function scrollToFocusMatch(games, viewMode, container) {
  const focus = findFocusMatch(games);
  if (!focus) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const root = container || document;
  const el = root.querySelector(`[data-match-id="${String(focus.id)}"]`);
  if (!el) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const offset = getMatchesScrollOffset() + (viewMode === 'list' ? 44 : 0);
  scrollToElementWithOffset(el, offset);
  el.classList.add('match-focus-highlight');
  setTimeout(() => el.classList.remove('match-focus-highlight'), 2000);
}

export function focusMatchFilters(games) {
  const focus = findFocusMatch(games);
  if (!focus) return null;
  const dateKey = parseGameDateTime(focus).dateKey;
  return {
    groupFilter: 'all',
    dateFilter: dateKey !== 'unknown' ? dateKey : 'all'
  };
}
