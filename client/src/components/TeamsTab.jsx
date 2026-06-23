import { useState } from 'react';
import { useWorldCup } from '../context/WorldCupContext';
import { flagSrc, flagOnError } from '../lib/teams';
import { GROUP_COLORS, t } from '../i18n';
import { NoDataIcon } from './Icon';
import { LoadingBlock } from './shared';

export function TeamsTab({ onTeamClick }) {
  const { teams, loading, loadError } = useWorldCup();
  const [activeGroup, setActiveGroup] = useState('all');
  const groups = ['all', ...[...new Set(teams.map((t) => t.groups).filter(Boolean))].sort((a, b) => a.localeCompare(b))];
  const filtered = activeGroup === 'all' ? teams : teams.filter((t) => t.groups === activeGroup);

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.teams_title}</h2>
        <p>{t.teams_subtitle}</p>
      </div>
      <div className="tabs">
        {groups.map((g) => (
          <button key={g} type="button" className={`tab-btn${g === activeGroup ? ' active' : ''}`} onClick={() => setActiveGroup(g)}>
            {g === 'all' ? t.all_teams : `${t.group} ${g}`}
          </button>
        ))}
      </div>
      <div className="cards-grid">
        {loading ? (
          <LoadingBlock />
        ) : loadError ? (
          <div className="no-data">
            <NoDataIcon name="signal" />
            <p>{t.load_error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <NoDataIcon name="team" />
            <p>No teams found</p>
          </div>
        ) : (
          filtered.map((team) => (
            <div
              key={team.id}
              className="team-card"
              data-team-id={team.id}
              role="button"
              tabIndex={0}
              title={t.view_squad}
              onClick={() => onTeamClick(team.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTeamClick(team.id);
                }
              }}
            >
              <img className="team-flag" src={flagSrc(team.flag, 'lg')} alt={team.name_en} onError={(e) => flagOnError(e, 'lg')} />
              <span className="team-name">{team.name_en}</span>
              <span className="team-group" style={{ color: GROUP_COLORS[team.groups] || undefined }}>
                {t.group} {team.groups || '-'}
              </span>
              <span className="fifa-code">{team.fifa_code || ''}</span>
              <span className="team-card-hint">{t.view_squad}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
