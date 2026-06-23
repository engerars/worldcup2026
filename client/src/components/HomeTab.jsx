import { Icon } from './Icon';
import { LoadingBlock, useCountdown } from './shared';
import { useWorldCup } from '../context/WorldCupContext';
import { t } from '../i18n';

export function HomeTab() {
  const { loading } = useWorldCup();
  const countdown = useCountdown();

  if (loading) return <LoadingBlock />;

  return (
    <div className="hero">
      <div className="container">
        <div className="hero-badge">
          <Icon name="trophy" size="sm" className="ui-icon-primary" />
          <span>{t.hero_badge}</span>
        </div>
        <h1>{t.hero_title}</h1>
        <p>{t.hero_subtitle}</p>
        <div className="countdown">
          <div className="countdown-item">
            <span className="countdown-value">{countdown.days}</span>
            <span className="countdown-label">{t.days}</span>
          </div>
          <div className="countdown-item">
            <span className="countdown-value">{countdown.hours}</span>
            <span className="countdown-label">{t.hours}</span>
          </div>
          <div className="countdown-item">
            <span className="countdown-value">{countdown.minutes}</span>
            <span className="countdown-label">{t.minutes}</span>
          </div>
          <div className="countdown-item">
            <span className="countdown-value">{countdown.seconds}</span>
            <span className="countdown-label">{t.seconds}</span>
          </div>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">48</div>
            <div className="stat-label">{t.stat_teams}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">12</div>
            <div className="stat-label">{t.stat_groups}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">104</div>
            <div className="stat-label">{t.stat_matches}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">16</div>
            <div className="stat-label">{t.stat_stadiums}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
