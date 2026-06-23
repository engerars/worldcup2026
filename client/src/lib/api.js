const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

export const DATA_URLS = {
  teams: '/data/teams.json',
  games: '/data/games.json',
  stadiums: '/data/stadiums.json',
  groups: '/data/groups.json',
  squads: '/data/squads.json'
};

function fetchWithCacheBust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return fetch(`${url}${sep}_=${Date.now()}`, { cache: 'no-store' });
}

export async function fetchSquads() {
  let squads = {};
  try {
    const apiRes = await fetchWithCacheBust(`${API_BASE}/get/squads`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      return data.squads || {};
    }
  } catch (err) {
    console.warn('Squad API fetch failed:', err.message);
  }
  try {
    const staticRes = await fetchWithCacheBust(DATA_URLS.squads);
    if (staticRes.ok) {
      const data = await staticRes.json();
      return data.squads || {};
    }
  } catch (err) {
    console.warn('Squad static fetch failed:', err.message);
  }
  return squads;
}

export async function fetchLiveData() {
  const res = await fetchWithCacheBust(`${API_BASE}/get/live`);
  if (!res.ok) throw new Error('Live fetch failed');
  return res.json();
}

export async function fetchStaticMeta() {
  const [teamsRes, stadiumsRes] = await Promise.all([
    fetchWithCacheBust(DATA_URLS.teams),
    fetchWithCacheBust(DATA_URLS.stadiums)
  ]);
  const squads = await fetchSquads();
  if (!teamsRes.ok || !stadiumsRes.ok) {
    throw new Error('Static meta files not available');
  }
  const teams = await teamsRes.json();
  const stadiums = await stadiumsRes.json();
  return {
    teams: teams.teams || [],
    stadiums: stadiums.stadiums || [],
    squads
  };
}

export async function fetchAllStatic() {
  const responses = await Promise.all([
    fetchWithCacheBust(DATA_URLS.teams),
    fetchWithCacheBust(DATA_URLS.games),
    fetchWithCacheBust(DATA_URLS.stadiums),
    fetchWithCacheBust(DATA_URLS.groups)
  ]);
  if (responses.some((r) => !r.ok)) throw new Error('Static data not available');
  const squads = await fetchSquads();
  const parsed = await Promise.all(responses.map((r) => r.json()));
  return {
    teams: parsed[0].teams || [],
    games: parsed[1].games || [],
    stadiums: parsed[2].stadiums || [],
    groups: parsed[3].groups || [],
    squads
  };
}
