import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useWorldCup } from '../context/WorldCupContext';
import { groupCode } from '../lib/groups';
import { sortGamesForList } from '../lib/matches';
import { GROUP_COLORS, t } from '../i18n';
import { Icon, NoDataIcon } from './Icon';
import { GroupTable } from './GroupTable';
import { MatchListRow } from './shared';

export function GroupFocusOverlay({ group, onClose }) {
  const { games, teams, stadiums } = useWorldCup();
  const code = groupCode(group);
  const color = GROUP_COLORS[code] || '#64748b';

  const groupGames = useMemo(() => {
    const upper = code.toUpperCase();
    return sortGamesForList(games.filter((g) => String(g.group || '').toUpperCase() === upper));
  }, [games, code]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('group-focus-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.classList.remove('group-focus-open');
    };
  }, [onClose]);

  return createPortal(
    <div className="group-focus-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="group-focus-panel" style={{ '--group-header-color': color }}>
        <div className="group-card group-focus-card">
          <div className="group-header">
            <span className="group-header-title">
              <Icon name="ball" size="sm" className="ui-icon-white" /> {t.group} {code}
            </span>
            <div className="group-header-actions">
              <span className="group-icon" aria-hidden="true">
                <Icon name="trophy" size="sm" className="ui-icon-white" />
              </span>
              <button type="button" className="group-focus-close" onClick={onClose} aria-label="Close">
                <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="group-table-wrap">
            <GroupTable groupTeams={group.teams || []} teams={teams} />
          </div>
        </div>

        <div className="group-focus-matches">
          <div className="group-focus-matches-head">
            <h3>{t.group_matches_title}</h3>
            <span>{t.matches_on_date.replace('{count}', String(groupGames.length))}</span>
          </div>
          {groupGames.length === 0 ? (
            <div className="no-data group-focus-empty">
              <NoDataIcon name="ball" />
              <p>{t.no_matches_found}</p>
            </div>
          ) : (
            <div className="group-focus-match-list">
              {groupGames.map((game, i) => (
                <MatchListRow key={game.id} game={game} teams={teams} stadiums={stadiums} index={i} showDate />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
