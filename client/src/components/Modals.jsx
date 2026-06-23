import { useEffect } from 'react';
import { useWorldCup } from '../context/WorldCupContext';
import { findGroupByTeamId, groupCode } from '../lib/groups';
import { flagSrc, flagOnError, findTeam } from '../lib/teams';
import { GROUP_COLORS, t } from '../i18n';
import { Icon, NoDataIcon } from './Icon';
import { GroupTable } from './GroupTable';

function CloseButton({ onClose }) {
  return (
    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
      <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function SquadModal({ teamId, onClose }) {
  const { teams, getSquad } = useWorldCup();
  const team = findTeam(teams, teamId);
  const squad = teamId ? getSquad(teamId) : null;
  const open = Boolean(teamId && team?.id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const color = GROUP_COLORS[team.groups] || '#64748b';
  const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
  (squad?.players || []).forEach((p) => {
    const pos = byPos[p.position] ? p.position : 'MID';
    byPos[pos].push(p);
  });
  const orderedPlayers = [...byPos.GK, ...byPos.DEF, ...byPos.MID, ...byPos.FWD];

  return (
    <div className="team-squad-modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="team-squad-content">
        <CloseButton onClose={onClose} />
        <div className="team-squad-header">
          <img src={flagSrc(team.flag, 'lg')} alt={team.name_en} onError={(e) => flagOnError(e, 'lg')} />
          <div>
            <h3>{team.name_en}</h3>
            <span style={{ color }}>
              {t.group} {team.groups || '-'} · {team.fifa_code || ''}
            </span>
          </div>
        </div>
        {!squad || (!squad.staff?.length && !squad.players?.length) ? (
          <div className="no-data" style={{ padding: '24px 0' }}>
            <NoDataIcon name="team" />
            <p>{t.no_squad_data}</p>
          </div>
        ) : (
          <>
            {squad.staff?.length ? (
              <div className="squad-section">
                <div className="squad-section-title">{t.coaching_staff}</div>
                <div className="squad-staff-list">
                  {squad.staff.map((s, i) => (
                    <div key={i} className="squad-staff-row">
                      <span className="role">{s.role}</span>
                      <span className="name">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {squad.players?.length ? (
              <div className="squad-section">
                <div className="squad-section-title">
                  {t.squad_players} ({squad.players.length})
                </div>
                <div className="squad-players-wrap">
                  <table className="squad-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t.squad_players}</th>
                        <th>{t.squad_pos}</th>
                        <th>{t.squad_club}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedPlayers.map((p, i) => (
                        <tr key={i}>
                          <td className="squad-num">{p.number || '—'}</td>
                          <td>{p.name}</td>
                          <td className="squad-pos">{p.position || '—'}</td>
                          <td className="squad-club">{p.club || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function StandingsModal({ teamId, onClose }) {
  const { teams, groups } = useWorldCup();
  const team = findTeam(teams, teamId);
  const group = teamId ? findGroupByTeamId(groups, teamId) : null;
  const open = Boolean(teamId && team?.id && group);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const code = groupCode(group);
  const color = GROUP_COLORS[code] || '#64748b';

  return (
    <div className="team-standings-modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="team-standings-content">
        <CloseButton onClose={onClose} />
        <div className="team-standings-team">
          <img src={flagSrc(team.flag, 'lg')} alt={team.name_en} onError={(e) => flagOnError(e, 'lg')} />
          <div>
            <h3>{team.name_en}</h3>
            <span>
              {t.group} {code} · {t.standings_title}
            </span>
          </div>
        </div>
        <div className="team-standings-card group-card" style={{ '--group-header-color': color }}>
          <div className="group-header">
            <span className="group-header-title">
              <Icon name="ball" size="sm" className="ui-icon-white" /> {t.group} {code}
            </span>
            <span className="group-icon">
              <Icon name="trophy" size="sm" className="ui-icon-white" />
            </span>
          </div>
          <div className="group-table-wrap">
            <GroupTable groupTeams={group.teams || []} teams={teams} highlightTeamId={teamId} />
          </div>
        </div>
      </div>
    </div>
  );
}
