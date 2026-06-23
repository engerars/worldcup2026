import { useCallback, useEffect, useMemo, useState } from 'react';
import { VALID_TABS, t } from './i18n';
import { useWorldCup } from './context/WorldCupContext';
import { Icon } from './components/Icon';
import { HomeTab } from './components/HomeTab';
import { LiveTab } from './components/LiveTab';
import { MatchesTab } from './components/MatchesTab';
import { TeamsTab } from './components/TeamsTab';
import { GroupsTab } from './components/GroupsTab';
import { BracketTab } from './components/BracketTab';
import { StadiumsTab } from './components/StadiumsTab';
import { SquadModal, StandingsModal } from './components/Modals';

function tabFromHash() {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'matches';
}

function LiveBadge({ count }) {
  if (!count) return null;
  return (
    <span className="live-tab-count" aria-label={`${count} live`}>
      {count}
    </span>
  );
}

export default function App() {
  const { cacheBannerAt, lastUpdatedAt, liveCount } = useWorldCup();
  const [activeTab, setActiveTab] = useState(tabFromHash);
  const [squadTeamId, setSquadTeamId] = useState(null);
  const [standingsTeamId, setStandingsTeamId] = useState(null);

  const updatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return '';
    const time = new Date(lastUpdatedAt).toLocaleTimeString('en-US');
    return t.last_updated.replace('{time}', time);
  }, [lastUpdatedAt]);

  const cacheBannerText = useMemo(() => {
    if (!cacheBannerAt) return '';
    return t.cache_offline.replace('{time}', new Date(cacheBannerAt).toLocaleString('en-US'));
  }, [cacheBannerAt]);

  const switchTab = useCallback((tabId) => {
    const valid = VALID_TABS.includes(tabId) ? tabId : 'matches';
    setActiveTab(valid);
    const url = new URL(window.location.href);
    if (valid === 'matches') {
      url.hash = '';
      history.replaceState(null, '', url);
    } else {
      url.hash = valid;
      history.replaceState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const onHash = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = t.page_title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t.meta_description);
  }, []);

  const navTabs = [
    { id: 'live', label: t.nav_live, live: true },
    { id: 'matches', label: t.nav_matches },
    { id: 'teams', label: t.nav_teams },
    { id: 'groups', label: t.nav_groups },
    { id: 'bracket', label: t.nav_bracket },
    { id: 'stadiums', label: t.nav_stadiums }
  ];

  const pageTabs = [{ id: 'home', label: t.nav_home }, ...navTabs];

  return (
    <>
      <div className="bg-pattern" />
      <header>
        <div className="container">
          <div className="header-content">
            <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); switchTab('home'); }}>
              <img src="/trophy.png" alt="FIFA World Cup 2026" className="logo-icon" />
              <span>{t.logo}</span>
            </a>
            <nav id="main-nav">
              {navTabs.map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  data-tab={tab.id}
                  className={`nav-tab${activeTab === tab.id ? ' active' : ''}${tab.live && liveCount > 0 ? ' has-live-matches' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    switchTab(tab.id);
                  }}
                >
                  {tab.live ? <span className="live-tab-dot" aria-hidden="true" /> : null}
                  <span className="live-tab-label">{tab.label}</span>
                  {tab.live ? <LiveBadge count={liveCount} /> : null}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {cacheBannerText ? (
        <div className="cache-banner offline show" aria-live="polite">
          {cacheBannerText}
        </div>
      ) : null}

      <main className="main-content">
        <div className="container">
          <div className="page-tabs" role="tablist">
            {pageTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`page-tab${activeTab === tab.id ? ' active' : ''}${tab.live && liveCount > 0 ? ' has-live-matches' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => switchTab(tab.id)}
              >
                {tab.live ? <span className="live-tab-dot" aria-hidden="true" /> : null}
                <span className="live-tab-label">{tab.label}</span>
                {tab.live ? <LiveBadge count={liveCount} /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="page-panels">
          <section className={`page-panel${activeTab === 'home' ? ' active' : ''}`} data-panel="home">
            {activeTab === 'home' ? <HomeTab /> : null}
          </section>
          <section className={`page-panel${activeTab === 'live' ? ' active' : ''}`} data-panel="live">
            {activeTab === 'live' ? <LiveTab updatedLabel={updatedLabel} /> : null}
          </section>
          <section className={`page-panel${activeTab === 'matches' ? ' active' : ''}`} data-panel="matches">
            {activeTab === 'matches' ? <MatchesTab updatedLabel={updatedLabel} isActive /> : null}
          </section>
          <section className={`page-panel${activeTab === 'teams' ? ' active' : ''}`} data-panel="teams">
            {activeTab === 'teams' ? <TeamsTab onTeamClick={setSquadTeamId} /> : null}
          </section>
          <section className={`page-panel${activeTab === 'groups' ? ' active' : ''}`} data-panel="groups">
            {activeTab === 'groups' ? <GroupsTab /> : null}
          </section>
          <section className={`page-panel${activeTab === 'bracket' ? ' active' : ''}`} data-panel="bracket">
            {activeTab === 'bracket' ? <BracketTab isActive onTeamClick={setStandingsTeamId} /> : null}
          </section>
          <section className={`page-panel${activeTab === 'stadiums' ? ' active' : ''}`} data-panel="stadiums">
            {activeTab === 'stadiums' ? <StadiumsTab /> : null}
          </section>
        </div>
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <p>{t.footer_text}</p>
            <div className="footer-links">
              <a href="/api-docs">{t.footer_api}</a>
              <a href="https://github.com/jp2435/worldcup2026" target="_blank" rel="noopener noreferrer">
                <Icon name="github" size="sm" /> {t.footer_github}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <SquadModal teamId={squadTeamId} onClose={() => setSquadTeamId(null)} />
      <StandingsModal teamId={standingsTeamId} onClose={() => setStandingsTeamId(null)} />
    </>
  );
}
