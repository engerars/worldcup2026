import { useEffect, useState } from 'react';
import { isGameFinished, isGameLive, shouldShowScore, parseGameDateTime, formatMatchDateShort } from '../lib/matches';
import { flagSrc, flagOnError, findTeam, findStadium } from '../lib/teams';
import { t } from '../i18n';
import { Icon } from './Icon';

export function MatchCard({ game, teams, stadiums, index = 0 }) {
  const homeTeam = findTeam(teams, game.home_team_id);
  const awayTeam = findTeam(teams, game.away_team_id);
  const stadium = findStadium(stadiums, game.stadium_id);
  const homeName = game.home_team_name_en || homeTeam.name_en || 'TBD';
  const awayName = game.away_team_name_en || awayTeam.name_en || 'TBD';
  const live = isGameLive(game);
  const finished = isGameFinished(game);
  const statusLabel = live
    ? `${t.live}${game.time_elapsed && !isNaN(game.time_elapsed) ? ` ${game.time_elapsed}'` : ''}`
    : finished
      ? t.status_ft
      : null;

  return (
    <div className={`match-card${live ? ' is-live' : ''}`} data-match-id={game.id} style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
      <div className="match-header">
        <span className="match-group">
          {t.group} {game.group || '-'}
        </span>
        <span>{statusLabel ? (live ? <span className="live-badge">{statusLabel}</span> : <span className="match-minute">{statusLabel}</span>) : `${t.matchday} ${game.matchday || '-'}`}</span>
      </div>
      <div className="match-teams">
        <div className="match-team">
          <img className="team-flag" src={flagSrc(homeTeam.flag, 'sm')} alt={homeName} onError={(e) => flagOnError(e, 'sm')} />
          <span className="team-name">{homeName}</span>
        </div>
        <span className="match-vs">{t.vs}</span>
        <div className="match-team">
          <img className="team-flag" src={flagSrc(awayTeam.flag, 'sm')} alt={awayName} onError={(e) => flagOnError(e, 'sm')} />
          <span className="team-name">{awayName}</span>
        </div>
      </div>
      {shouldShowScore(game) && (
        <div className="match-score">
          <span className="score">{game.home_score || 0}</span>
          <span>-</span>
          <span className="score">{game.away_score || 0}</span>
        </div>
      )}
      <div className="match-info">
        <span>{game.local_date || ''}</span>
        <span className="match-stadium">
          <Icon name="stadium" size="xs" /> {stadium.name_en || ''}
        </span>
      </div>
    </div>
  );
}

export function MatchListRow({ game, teams, stadiums, index = 0, showDate = false }) {
  const homeTeam = findTeam(teams, game.home_team_id);
  const awayTeam = findTeam(teams, game.away_team_id);
  const stadium = findStadium(stadiums, game.stadium_id);
  const homeName = game.home_team_name_en || homeTeam.name_en || 'TBD';
  const awayName = game.away_team_name_en || awayTeam.name_en || 'TBD';
  const { timeLabel } = parseGameDateTime(game);
  const dateLabel = showDate ? formatMatchDateShort(game) : '';
  const live = isGameLive(game);
  const finished = isGameFinished(game);

  const centerContent = shouldShowScore(game) ? (
    <span className="match-list-score">
      {game.home_score || 0} - {game.away_score || 0}
    </span>
  ) : (
    <span className="match-list-vs">{t.vs}</span>
  );

  const statusLabel = live ? (
    <span className="live-badge">
      {t.live}
      {game.time_elapsed && !isNaN(game.time_elapsed) ? ` ${game.time_elapsed}'` : ''}
    </span>
  ) : finished ? (
    <span className="match-minute">{t.status_ft}</span>
  ) : null;

  return (
    <div className={`match-list-row${live ? ' is-live' : ''}`} data-match-id={game.id} style={{ animationDelay: `${Math.min(index * 0.03, 0.4)}s` }}>
      <div className="match-list-time">
        {dateLabel ? <span className="match-list-date">{dateLabel}</span> : null}
        <span className="match-list-clock">{timeLabel}</span>
      </div>
      <div className="match-list-team home">
        <img className="team-flag" src={flagSrc(homeTeam.flag, 'sm')} alt={homeName} onError={(e) => flagOnError(e, 'sm')} />
        <span className="team-name">{homeName}</span>
      </div>
      <div className="match-list-center">{centerContent}</div>
      <div className="match-list-team away">
        <img className="team-flag" src={flagSrc(awayTeam.flag, 'sm')} alt={awayName} onError={(e) => flagOnError(e, 'sm')} />
        <span className="team-name">{awayName}</span>
      </div>
      <div className="match-list-status">
        {statusLabel || (
          <span className="match-group">
            {t.group} {game.group || '-'}
          </span>
        )}
      </div>
      <div className="match-list-meta">
        <span className="match-group">
          {t.group} {game.group || '-'}
        </span>
        <span>
          {t.matchday} {game.matchday || '-'}
        </span>
        <span className="match-stadium">
          <Icon name="stadium" size="xs" /> {stadium.name_en || ''}
        </span>
      </div>
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{t.loading}</span>
    </div>
  );
}

export function useCountdown(target = '2026-06-11T00:00:00') {
  const [parts, setParts] = useState({ days: '---', hours: '--', minutes: '--', seconds: '--' });

  useEffect(() => {
    const worldCupStart = new Date(target).getTime();
    function update() {
      const diff = worldCupStart - Date.now();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setParts({
          days: String(days),
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        });
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  return parts;
}
