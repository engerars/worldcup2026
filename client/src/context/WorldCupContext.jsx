import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import IDB from '../lib/idb';
import { fetchAllStatic, fetchLiveData, fetchStaticMeta } from '../lib/api';
import { isGameLive, liveFingerprint } from '../lib/matches';
import { sortGroups } from '../lib/groups';
import { LIVE_POLL_MS } from '../i18n';

const WorldCupContext = createContext(null);

export function WorldCupProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [groups, setGroups] = useState([]);
  const [squads, setSquads] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cacheBannerAt, setCacheBannerAt] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const fingerprintRef = useRef('');
  const dataRef = useRef({ teams: [], games: [], stadiums: [], groups: [], squads: {} });

  useEffect(() => {
    dataRef.current = { teams, games, stadiums, groups, squads };
  }, [teams, games, stadiums, groups, squads]);

  const refreshLive = useCallback(async () => {
    try {
      const data = await fetchLiveData();
      const fp = liveFingerprint(data.games || [], data.groups || []);
      if (fp === fingerprintRef.current) return;
      fingerprintRef.current = fp;
      if (data.games) setGames(data.games);
      if (data.groups) setGroups(sortGroups(data.groups || []));
      setLastUpdatedAt(data.updatedAt || Date.now());
      const snap = dataRef.current;
      await IDB.saveAll({
        teams: snap.teams,
        games: data.games || snap.games,
        stadiums: snap.stadiums,
        groups: data.groups || snap.groups,
        squads: snap.squads
      });
    } catch (err) {
      console.warn('Live score refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;

    async function load() {
      setLoading(true);
      setLoadError(false);
      let showedCache = false;
      let cacheTime = null;

      try {
        const [liveData, meta] = await Promise.all([fetchLiveData(), fetchStaticMeta()]);
        if (cancelled) return;
        setTeams(meta.teams);
        setStadiums(meta.stadiums);
        setSquads(meta.squads);
        setGames(liveData.games || []);
        setGroups(sortGroups(liveData.groups || []));
        fingerprintRef.current = liveFingerprint(liveData.games || [], liveData.groups || []);
        setLastUpdatedAt(liveData.updatedAt || Date.now());
        await IDB.saveAll({
          teams: meta.teams,
          games: liveData.games || [],
          stadiums: meta.stadiums,
          groups: liveData.groups || [],
          squads: meta.squads
        });
        setCacheBannerAt(null);
        setLoading(false);
        return;
      } catch (liveErr) {
        console.warn('Live load failed, trying cache:', liveErr.message);
      }

      try {
        const cache = await IDB.getAll();
        if (cache.teams && cache.games && cache.stadiums && cache.groups) {
          if (cache.squads) setSquads(cache.squads.data || {});
          setTeams(cache.teams.data);
          setGames(cache.games.data);
          setStadiums(cache.stadiums.data);
          setGroups(sortGroups(cache.groups.data));
          cacheTime = Math.max(cache.teams.cachedAt, cache.games.cachedAt, cache.stadiums.cachedAt, cache.groups.cachedAt);
          setLastUpdatedAt(cacheTime);
          fingerprintRef.current = liveFingerprint(cache.games.data, cache.groups.data);
          showedCache = true;
        }
      } catch (err) {
        console.warn('IndexedDB read failed:', err);
      }

      try {
        const staticData = await fetchAllStatic();
        if (cancelled) return;
        setTeams(staticData.teams);
        setGames(staticData.games);
        setStadiums(staticData.stadiums);
        setGroups(sortGroups(staticData.groups));
        setSquads(staticData.squads);
        setLastUpdatedAt(Date.now());
        fingerprintRef.current = liveFingerprint(staticData.games, staticData.groups);
        await IDB.saveAll(staticData);
        setCacheBannerAt(null);
      } catch (err) {
        console.error('Error loading data:', err);
        if (showedCache) {
          setCacheBannerAt(cacheTime);
        } else {
          setLoadError(true);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();

    const startPoll = () => {
      refreshLive();
      pollTimer = setInterval(refreshLive, LIVE_POLL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
      } else if (!pollTimer) {
        startPoll();
      }
    };

    startPoll();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshLive]);

  const liveCount = useMemo(() => games.filter(isGameLive).length, [games]);

  const value = {
    teams,
    games,
    stadiums,
    groups,
    squads,
    loading,
    loadError,
    cacheBannerAt,
    lastUpdatedAt,
    liveCount,
    getSquad: (teamId) => squads[String(teamId)] || null
  };

  return <WorldCupContext.Provider value={value}>{children}</WorldCupContext.Provider>;
}

export function useWorldCup() {
  const ctx = useContext(WorldCupContext);
  if (!ctx) throw new Error('useWorldCup must be used within WorldCupProvider');
  return ctx;
}
