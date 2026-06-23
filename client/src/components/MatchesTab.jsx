import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorldCup } from '../context/WorldCupContext';
import {
  focusMatchFilters,
  formatMatchDateHeader,
  groupGamesByDate,
  parseGameDateTime,
  scrollToFocusMatch,
  sortGamesForDisplay
} from '../lib/matches';
import { NoDataIcon } from './Icon';
import { Icon } from './Icon';
import { LoadingBlock, MatchCard, MatchListRow } from './shared';
import { t } from '../i18n';

function getFilteredGames(games, groupFilter, dateFilter) {
  let list = groupFilter === 'all' ? games : games.filter((g) => g.group === groupFilter);
  if (dateFilter !== 'all') {
    list = list.filter((g) => parseGameDateTime(g).dateKey === dateFilter);
  }
  return list;
}

export function MatchesTab({ updatedLabel, isActive }) {
  const { games, teams, stadiums, loading, loadError } = useWorldCup();
  const [groupFilter, setGroupFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('matchesViewMode') || 'list');
  const gridRef = useRef(null);
  const scrollPendingRef = useRef(false);
  const pendingFocusRef = useRef(null);
  const wasActiveRef = useRef(false);
  const initialFocusDoneRef = useRef(false);

  const groups = useMemo(() => ['all', ...[...new Set(games.map((g) => g.group).filter(Boolean))].sort()], [games]);

  const gamesForGroup = useMemo(
    () => (groupFilter === 'all' ? games : games.filter((g) => g.group === groupFilter)),
    [games, groupFilter]
  );

  const dateOptions = useMemo(() => {
    const dateMap = new Map();
    for (const game of gamesForGroup) {
      const { dateKey } = parseGameDateTime(game);
      if (dateKey !== 'unknown' && !dateMap.has(dateKey)) dateMap.set(dateKey, game);
    }
    return [...dateMap.keys()].sort();
  }, [gamesForGroup]);

  const filtered = useMemo(() => getFilteredGames(games, groupFilter, dateFilter), [games, groupFilter, dateFilter]);

  const focusMatchesTab = useCallback(() => {
    if (!games.length) return;
    const next = focusMatchFilters(games);
    pendingFocusRef.current = next;
    if (next) {
      setGroupFilter(next.groupFilter);
      setDateFilter(next.dateFilter);
    }
    scrollPendingRef.current = true;
  }, [games]);

  useEffect(() => {
    if (!isActive || !games.length) return;
    if (!wasActiveRef.current || !initialFocusDoneRef.current) {
      focusMatchesTab();
      initialFocusDoneRef.current = true;
    }
    wasActiveRef.current = isActive;
  }, [isActive, games.length, focusMatchesTab]);

  useEffect(() => {
    if (!scrollPendingRef.current || !isActive || loading) return;
    const pending = pendingFocusRef.current;
    if (pending?.dateFilter && pending.dateFilter !== 'all' && dateFilter !== pending.dateFilter) {
      return;
    }
    pendingFocusRef.current = null;
    const id = requestAnimationFrame(() => {
      scrollToFocusMatch(filtered, viewMode, gridRef.current);
      scrollPendingRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [filtered, dateFilter, viewMode, isActive, loading]);

  useEffect(() => {
    if (dateFilter !== 'all' && !dateOptions.includes(dateFilter)) setDateFilter('all');
  }, [dateFilter, dateOptions]);

  useEffect(() => {
    if (!groupFilter || !groups.includes(groupFilter)) setGroupFilter('all');
  }, [groupFilter, groups]);

  const setMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('matchesViewMode', mode);
  };

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.matches_title}</h2>
        <p>{t.matches_subtitle}</p>
        {updatedLabel && <span className="scores-updated live-ok">{updatedLabel}</span>}
      </div>
      <div className="matches-controls">
        <div className="matches-filter-bar">
          <div className="match-filter-field">
            <label htmlFor="match-group-filter">{t.filter_group}</label>
            <select
              id="match-group-filter"
              className="match-filter-select"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g === 'all' ? t.all_matches : `${t.group} ${g}`}
                </option>
              ))}
            </select>
          </div>
          <div className="match-filter-field">
            <label htmlFor="match-date-filter">{t.filter_date}</label>
            <select
              id="match-date-filter"
              className="match-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">{t.all_dates}</option>
              {dateOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMatchDateHeader(key)}
                </option>
              ))}
            </select>
          </div>
          <div className="match-view-toggle" role="group" aria-label="Match view">
            <button type="button" className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} aria-pressed={viewMode === 'grid'} onClick={() => setMode('grid')}>
              <Icon name="grid" size="sm" />
              <span>{t.view_grid}</span>
            </button>
            <button type="button" className={`view-btn${viewMode === 'list' ? ' active' : ''}`} aria-pressed={viewMode === 'list'} onClick={() => setMode('list')}>
              <Icon name="list" size="sm" />
              <span>{t.view_list}</span>
            </button>
          </div>
        </div>
      </div>
      <div ref={gridRef} className={`cards-grid${viewMode === 'list' ? ' matches-list-view' : ''}`} id="matches-grid">
        {loading ? (
          <LoadingBlock />
        ) : loadError ? (
          <div className="no-data">
            <NoDataIcon name="signal" />
            <p>{t.load_error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <NoDataIcon name="ball" />
            <p>{t.no_matches_found}</p>
          </div>
        ) : viewMode === 'list' ? (
          groupGamesByDate(filtered).map(({ dateKey, games: dayGames }) => (
            <div key={dateKey} className="match-date-group" data-date-key={dateKey}>
              <div className="match-date-header">
                <span>{formatMatchDateHeader(dateKey)}</span>
                <span className="match-date-count">{t.matches_on_date.replace('{count}', dayGames.length)}</span>
              </div>
              {dayGames.map((game, i) => (
                <MatchListRow key={game.id} game={game} teams={teams} stadiums={stadiums} index={i} />
              ))}
            </div>
          ))
        ) : (
          sortGamesForDisplay(filtered).map((game, i) => (
            <MatchCard key={game.id} game={game} teams={teams} stadiums={stadiums} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
