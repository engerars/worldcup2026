import { useWorldCup } from '../context/WorldCupContext';
import { isGameLive, sortGamesForDisplay } from '../lib/matches';
import { NoDataIcon } from './Icon';
import { LoadingBlock, MatchCard } from './shared';
import { t } from '../i18n';

export function LiveTab({ updatedLabel }) {
  const { games, teams, stadiums, loading, loadError } = useWorldCup();
  const liveGames = sortGamesForDisplay(games.filter(isGameLive));

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.live_title}</h2>
        <p>{t.live_subtitle}</p>
        {updatedLabel && <span className="scores-updated live-ok">{updatedLabel}</span>}
      </div>
      <div className="cards-grid">
        {loading ? (
          <LoadingBlock />
        ) : loadError ? (
          <div className="no-data">
            <NoDataIcon name="signal" />
            <p>{t.load_error}</p>
          </div>
        ) : liveGames.length === 0 ? (
          <div className="no-data live-empty">
            <NoDataIcon name="live" />
            <p>{t.no_live_matches}</p>
          </div>
        ) : (
          liveGames.map((game, i) => <MatchCard key={game.id} game={game} teams={teams} stadiums={stadiums} index={i} />)
        )}
      </div>
    </div>
  );
}
