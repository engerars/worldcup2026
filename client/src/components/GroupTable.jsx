import { sortGroupTeams } from '../lib/groups';
import { flagSrc, flagOnError, findTeam } from '../lib/teams';
import { t } from '../i18n';

export function GroupTable({ groupTeams, teams, highlightTeamId }) {
  const sorted = sortGroupTeams(groupTeams);

  return (
    <table className="group-table">
      <colgroup>
        <col className="col-rank" />
        <col className="col-team" />
        <col className="col-stat" span="7" />
        <col className="col-pts" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th style={{ textAlign: 'left', paddingLeft: 15 }}>Team</th>
          <th>{t.mp}</th>
          <th>{t.w}</th>
          <th>{t.d}</th>
          <th>{t.l}</th>
          <th>{t.gf}</th>
          <th>{t.ga}</th>
          <th>{t.gd}</th>
          <th>{t.pts}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((teamInfo, index) => {
          const team = findTeam(teams, teamInfo.team_id);
          const gd = parseInt(teamInfo.gd) || 0;
          const gdClass = gd > 0 ? 'stat-positive' : gd < 0 ? 'stat-negative' : 'stat-zero';
          const highlighted = highlightTeamId && String(teamInfo.team_id) === String(highlightTeamId);
          return (
            <tr key={teamInfo.team_id} className={highlighted ? 'is-highlighted' : ''}>
              <td>
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
              </td>
              <td>
                <div className="team-cell">
                  <img src={flagSrc(team.flag, 'sm')} alt={team.name_en || ''} onError={(e) => flagOnError(e, 'sm')} />
                  <span className="team-name-text">{team.name_en || 'Unknown'}</span>
                </div>
              </td>
              <td>{teamInfo.mp || 0}</td>
              <td className="stat-positive">{teamInfo.w || 0}</td>
              <td className="stat-zero">{teamInfo.d || 0}</td>
              <td className="stat-negative">{teamInfo.l || 0}</td>
              <td>{teamInfo.gf || 0}</td>
              <td>{teamInfo.ga || 0}</td>
              <td className={gdClass}>
                {gd > 0 ? '+' : ''}
                {gd}
              </td>
              <td className="pts-cell">{teamInfo.pts || 0}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
