import { useEffect, useRef } from 'react';
import { useWorldCup } from '../context/WorldCupContext';
import { BRACKET, bracketSlotName, drawBracketLinks } from '../lib/bracket';
import { isGameFinished, isGameLive, shouldShowScore } from '../lib/matches';
import { flagSrc, flagOnError } from '../lib/teams';
import { GROUP_COLORS, t } from '../i18n';
import { NoDataIcon } from './Icon';
import { LoadingBlock } from './shared';

function BracketSlotRow({ game, side, white, teams, onTeamClick }) {
  const teamId = game ? (side === 'home' ? game.home_team_id : game.away_team_id) : null;
  const known = teamId && String(teamId) !== '0';
  const name = game ? bracketSlotName(game, side, teams) : 'TBD';
  const team = known ? teams.find((t) => String(t.id) === String(teamId)) : null;
  const score =
    game && shouldShowScore(game) ? (
      <span className={white ? 'seed-score' : 'adv-score'}>{(side === 'home' ? game.home_score : game.away_score) || 0}</span>
    ) : null;
  const rowClass = white ? 'bracket-seed-row' : `adv-row${known ? '' : ' seed'}`;

  const props = known
    ? {
        className: `${rowClass} bracket-team-slot`,
        'data-team-id': teamId,
        role: 'button',
        tabIndex: 0,
        title: t.standings_title,
        onClick: () => onTeamClick(teamId),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTeamClick(teamId);
          }
        }
      }
    : { className: rowClass };

  return (
    <div {...props}>
      {known && team ? <img src={flagSrc(team.flag, 'sm')} alt="" onError={(e) => flagOnError(e, 'sm')} /> : null}
      <span className="seed-name">{name}</span>
      {score}
    </div>
  );
}

function BracketMatch({ id, kind, games, teams, onTeamClick }) {
  const game = games.find((g) => String(g.id) === String(id));
  const live = game && isGameLive(game);
  const finished = game && isGameFinished(game);
  const stateClass = `${live ? ' is-live' : ''}${finished ? ' is-finished' : ''}`;
  const extra = kind === 'final' ? ' final' : '';

  return (
    <div className={`bracket-match ${kind === 'r32' ? 'r32' : `adv${extra}`}${stateClass}`} data-match-id={id} title={`Match ${id}`}>
      <BracketSlotRow game={game} side="home" white={kind === 'r32'} teams={teams} onTeamClick={onTeamClick} />
      <BracketSlotRow game={game} side="away" white={kind === 'r32'} teams={teams} onTeamClick={onTeamClick} />
    </div>
  );
}

function BracketCol({ ids, kind, games, teams, onTeamClick, extraClass = '' }) {
  return (
    <div className={`bracket-col ${extraClass}`}>
      {ids.map((id) => (
        <BracketMatch key={id} id={id} kind={kind} games={games} teams={teams} onTeamClick={onTeamClick} />
      ))}
    </div>
  );
}

function BracketGroupCard({ letter, teams }) {
  const color = GROUP_COLORS[letter] || '#64748b';
  const groupTeams = teams.filter((t) => t.groups === letter).slice(0, 4);
  const placeholders = Math.max(0, 4 - groupTeams.length);

  return (
    <div className="bracket-group-card" style={{ '--gc': color }}>
      <div className="bracket-group-flags">
        {groupTeams.map((team) => (
          <img key={team.id} src={flagSrc(team.flag, 'sm')} alt="" onError={(e) => flagOnError(e, 'sm')} />
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <span key={i} style={{ height: 22 }} />
        ))}
      </div>
      <div className="bracket-group-label">
        {t.group} {letter}
      </div>
    </div>
  );
}

export function BracketTab({ isActive, onTeamClick }) {
  const { games, teams, loading, loadError } = useWorldCup();
  const stageRef = useRef(null);
  const svgRef = useRef(null);

  const scheduleLinks = () => {
    requestAnimationFrame(() => {
      drawBracketLinks(stageRef.current, svgRef.current);
      setTimeout(() => drawBracketLinks(stageRef.current, svgRef.current), 90);
    });
  };

  useEffect(() => {
    if (!isActive || loading || !games.length) return;
    scheduleLinks();
    const onResize = () => setTimeout(scheduleLinks, 120);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isActive, loading, games, teams]);

  if (loading) return <LoadingBlock />;
  if (loadError)
    return (
      <div className="no-data">
        <NoDataIcon name="signal" />
        <p>{t.load_error}</p>
      </div>
    );
  if (!games.length || !teams.length) return <LoadingBlock />;

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.bracket_title}</h2>
        <p>{t.bracket_subtitle}</p>
      </div>
      <div id="bracket-board">
        <div className="bracket-arena">
        <div className="bracket-stage" ref={stageRef}>
          <svg className="bracket-svg" ref={svgRef} aria-hidden="true" />
          <div className="bracket-flex">
            <div className="bracket-side left">
              <div className="bracket-col col-groups">
                {BRACKET.leftGroups.map((letter) => (
                  <BracketGroupCard key={letter} letter={letter} teams={teams} />
                ))}
              </div>
              <BracketCol ids={BRACKET.leftR32} kind="r32" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={BRACKET.leftR16} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={BRACKET.leftQF} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={[BRACKET.leftSF]} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
            </div>
            <div className="bracket-center">
              <div className="bracket-champion-label">{t.bracket_champion}</div>
              <div className="bracket-final-wrap">
                <BracketMatch id={BRACKET.final} kind="final" games={games} teams={teams} onTeamClick={onTeamClick} />
              </div>
              <div className="bracket-trophy">
                <img src="/trophy.png" alt="FIFA World Cup Trophy" />
              </div>
              <div className="bracket-bronze-label">{t.bracket_bronze}</div>
              <div className="bracket-third-wrap">
                <BracketMatch id={BRACKET.third} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              </div>
            </div>
            <div className="bracket-side right">
              <BracketCol ids={[BRACKET.rightSF]} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={BRACKET.rightQF} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={BRACKET.rightR16} kind="adv" games={games} teams={teams} onTeamClick={onTeamClick} />
              <BracketCol ids={BRACKET.rightR32} kind="r32" games={games} teams={teams} onTeamClick={onTeamClick} />
              <div className="bracket-col col-groups">
                {BRACKET.rightGroups.map((letter) => (
                  <BracketGroupCard key={letter} letter={letter} teams={teams} />
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
