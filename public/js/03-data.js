// i18n apply, IndexedDB, live/static data loading
function applyTranslations() {
    currentLang = 'en';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.body.dir = 'ltr';
    
    // Update translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.tagName === 'OPTION') return;
        const key = el.getAttribute('data-i18n');
        if (translations.en[key]) {
            el.textContent = translations.en[key];
        }
    });
    
    // Update SEO
    document.getElementById('page-title').textContent = translations.en.page_title;
    document.getElementById('meta-description').content = translations.en.meta_description;
    document.getElementById('og-title').content = translations.en.hero_title;
    document.getElementById('og-description').content = translations.en.meta_description;
    document.getElementById('twitter-title').content = translations.en.hero_title;
    document.getElementById('twitter-description').content = translations.en.meta_description;
    
    // Re-render with new language
    if (teamsData.length > 0) renderTeams(teamsData);
    if (gamesData.length > 0) {
        renderMatches(gamesData);
        renderLiveMatches();
    }
    if (stadiumsData.length > 0) renderStadiums(stadiumsData);
    if (groupsData.length > 0) renderGroups(groupsData);
    if (gamesData.length > 0) renderBracket();
    updateCacheBannerText();
    updateScoresUpdatedLabel();
}

// ==================== INDEXEDDB CACHE ====================

const IDB = {
    DB_NAME: 'worldcup2026',
    DB_VERSION: 2,
    STORE: 'apiCache',

    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE)) {
                    db.createObjectStore(this.STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    get(key) {
        return this.open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        }));
    },

    set(key, value) {
        return this.open().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            tx.objectStore(this.STORE).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }));
    },

    async getAll() {
        const keys = ['teams', 'games', 'stadiums', 'groups', 'squads'];
        const results = await Promise.all(keys.map(k => this.get(k)));
        const cache = {};
        keys.forEach((k, i) => { if (results[i]) cache[k] = results[i]; });
        return cache;
    },

    saveAll({ teams, games, stadiums, groups, squads }) {
        const now = Date.now();
        const writes = [
            this.set('teams', { data: teams, cachedAt: now }),
            this.set('games', { data: games, cachedAt: now }),
            this.set('stadiums', { data: stadiums, cachedAt: now }),
            this.set('groups', { data: groups, cachedAt: now })
        ];
        if (squads) {
            writes.push(this.set('squads', { data: squads, cachedAt: now }));
        }
        return Promise.all(writes);
    }
};

let cacheBannerTime = null;

function formatCacheTime(ts) {
    return new Date(ts).toLocaleString('en-US');
}

function showCacheBanner(cachedAt) {
    cacheBannerTime = cachedAt;
    const banner = document.getElementById('cache-banner');
    if (!banner) return;
    banner.textContent = translations[currentLang].cache_offline.replace('{time}', formatCacheTime(cachedAt));
    banner.classList.add('show');
}

function hideCacheBanner() {
    cacheBannerTime = null;
    const banner = document.getElementById('cache-banner');
    if (banner) banner.classList.remove('show');
}

function updateCacheBannerText() {
    if (cacheBannerTime) showCacheBanner(cacheBannerTime);
}

function applyData(teams, games, stadiums, groups) {
    teamsData = teams;
    gamesData = games;
    stadiumsData = stadiums;
    groupsData = groups;
    renderTeams(teamsData);
    renderMatches(gamesData);
    renderLiveMatches();
    renderStadiums(stadiumsData);
    renderGroups(groupsData);
    renderBracket();
}

function showLoadError() {
    const msg = `<div class="no-data">${noDataIcon('signal')}<p>${translations[currentLang].load_error}</p></div>`;
    ['bracket-board', 'live-grid', 'matches-grid', 'teams-grid', 'groups-grid', 'stadiums-grid'].forEach(id => {
        document.getElementById(id).innerHTML = msg;
    });
}

function fetchWithCacheBust(url) {
    const sep = url.includes('?') ? '&' : '?';
    return fetch(`${url}${sep}_=${Date.now()}`, { cache: 'no-store' });
}

async function fetchSquads() {
    squadsData = {};
    try {
        const apiRes = await fetchWithCacheBust(`${API_BASE}/get/squads`);
        if (apiRes.ok) {
            const data = await apiRes.json();
            squadsData = data.squads || {};
            return;
        }
    } catch (err) {
        console.warn('Squad API fetch failed:', err.message);
    }
    try {
        const staticRes = await fetchWithCacheBust(DATA_URLS.squads);
        if (staticRes.ok) {
            const data = await staticRes.json();
            squadsData = data.squads || {};
        }
    } catch (err) {
        console.warn('Squad static fetch failed:', err.message);
    }
}

function isGameFinished(game) {
    const finished = String(game.finished || '').toUpperCase();
    const elapsed = String(game.time_elapsed || '').toLowerCase();
    return finished === 'TRUE' || elapsed === 'finished' || elapsed === 'ft';
}

function isGameLive(game) {
    if (isGameFinished(game)) return false;
    const elapsed = String(game.time_elapsed || '').toLowerCase();
    return elapsed && !['notstarted', 'ns', 'null', ''].includes(elapsed);
}

function shouldShowScore(game) {
    return isGameFinished(game) || isGameLive(game);
}

function sortGamesForDisplay(games) {
    return [...games].sort((a, b) => {
        const rank = (g) => {
            if (isGameLive(g)) return 0;
            if (isGameFinished(g)) return 1;
            return 2;
        };
        const diff = rank(a) - rank(b);
        if (diff !== 0) return diff;
        return String(a.local_date || '').localeCompare(String(b.local_date || ''));
    });
}

function updateScoresUpdatedLabel() {
    if (!lastLiveUpdatedAt) return;
    const time = new Date(lastLiveUpdatedAt).toLocaleTimeString('en-US');
    const text = translations[currentLang].last_updated.replace('{time}', time);
    ['scores-updated', 'live-scores-updated'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.classList.add('live-ok');
    });
}

function updateLiveTabBadge(count) {
    document.querySelectorAll('.page-tab[data-tab="live"], #main-nav a[data-tab="live"]').forEach(el => {
        el.classList.toggle('has-live-matches', count > 0);
        const badge = el.querySelector('.live-tab-count');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.hidden = false;
            } else {
                badge.hidden = true;
            }
        }
    });
}

function applyLivePayload(data) {
    if (data.games) gamesData = data.games;
    if (data.groups) groupsData = data.groups;
    lastLiveUpdatedAt = data.updatedAt || Date.now();
    lastLiveFingerprint = liveFingerprint(gamesData, groupsData);

    renderMatches(gamesData);
    renderLiveMatches();
    renderGroups(groupsData);
    renderBracket();
    updateScoresUpdatedLabel();
}

async function fetchLiveData() {
    const res = await fetchWithCacheBust(`${API_BASE}/get/live`);
    if (!res.ok) throw new Error('Live fetch failed');
    return res.json();
}

function liveFingerprint(games, groups) {
    const g = games.map(x => `${x.id}:${x.home_score}:${x.away_score}:${x.finished}:${x.time_elapsed}`).join('|');
    const t = groups.map(x => `${x.group}:${(x.teams || []).map(tt => `${tt.team_id}:${tt.pts}:${tt.gf}:${tt.ga}`).join(',')}`).join('|');
    return g + '::' + t;
}

async function refreshLiveScores() {
    try {
        const data = await fetchLiveData();
        const fp = liveFingerprint(data.games || [], data.groups || []);
        if (fp === lastLiveFingerprint) {
            updateScoresUpdatedLabel();
            return;
        }

        applyLivePayload(data);

        try {
            await IDB.saveAll({
                teams: teamsData,
                games: gamesData,
                stadiums: stadiumsData,
                groups: groupsData,
                squads: squadsData
            });
        } catch (err) {
            console.warn('IndexedDB live update failed:', err);
        }
    } catch (err) {
        console.warn('Live score refresh failed:', err);
    }
}

function startLiveScorePolling() {
    if (livePollTimer) clearInterval(livePollTimer);
    refreshLiveScores();
    livePollTimer = setInterval(refreshLiveScores, LIVE_POLL_MS);

    if (!visibilityListenerAdded) {
        visibilityListenerAdded = true;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (livePollTimer) clearInterval(livePollTimer);
                livePollTimer = null;
            } else if (!livePollTimer) {
                refreshLiveScores();
                livePollTimer = setInterval(refreshLiveScores, LIVE_POLL_MS);
            }
        });
    }
}

// Countdown Timer
function startCountdown() {
    const worldCupStart = new Date('2026-06-11T00:00:00').getTime();
    
    function update() {
        const now = new Date().getTime();
        const diff = worldCupStart - now;
        
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        }
    }
    
    update();
    setInterval(update, 1000);
}

// Load All Data — live scores first, IndexedDB fallback
async function fetchStaticMeta() {
    const [teamsRes, stadiumsRes] = await Promise.all([
        fetchWithCacheBust(DATA_URLS.teams),
        fetchWithCacheBust(DATA_URLS.stadiums)
    ]);
    await fetchSquads();
    if (!teamsRes.ok || !stadiumsRes.ok) {
        throw new Error('Static meta files not available');
    }
    const teams = await teamsRes.json();
    const stadiums = await stadiumsRes.json();
    return {
        teams: teams.teams || [],
        stadiums: stadiums.stadiums || []
    };
}

async function loadAllData() {
    let showedCache = false;

    try {
        const [liveData, meta] = await Promise.all([
            fetchLiveData(),
            fetchStaticMeta()
        ]);

        teamsData = meta.teams;
        stadiumsData = meta.stadiums;
        applyLivePayload(liveData);
        renderTeams(teamsData);
        renderStadiums(stadiumsData);

        await IDB.saveAll({
            teams: teamsData,
            games: gamesData,
            stadiums: stadiumsData,
            groups: groupsData,
            squads: squadsData
        });
        hideCacheBanner();
        return;
    } catch (liveErr) {
        console.warn('Live load failed, trying cache:', liveErr.message);
    }

    try {
        const cache = await IDB.getAll();
        if (cache.teams && cache.games && cache.stadiums && cache.groups) {
            if (cache.squads) squadsData = cache.squads.data || {};
            applyData(
                cache.teams.data,
                cache.games.data,
                cache.stadiums.data,
                cache.groups.data
            );
            lastLiveUpdatedAt = Math.max(
                cache.teams.cachedAt,
                cache.games.cachedAt,
                cache.stadiums.cachedAt,
                cache.groups.cachedAt
            );
            updateScoresUpdatedLabel();
            showedCache = true;
        }
    } catch (err) {
        console.warn('IndexedDB read failed:', err);
    }

    try {
        const responses = await Promise.all([
            fetchWithCacheBust(DATA_URLS.teams),
            fetchWithCacheBust(DATA_URLS.games),
            fetchWithCacheBust(DATA_URLS.stadiums),
            fetchWithCacheBust(DATA_URLS.groups)
        ]);
        if (responses.some(r => !r.ok)) throw new Error('Static data not available');

        await fetchSquads();
        const parsed = await Promise.all(responses.map(r => r.json()));
        applyData(
            parsed[0].teams || [],
            parsed[1].games || [],
            parsed[2].stadiums || [],
            parsed[3].groups || []
        );
        lastLiveUpdatedAt = Date.now();
        updateScoresUpdatedLabel();

        await IDB.saveAll({
            teams: teamsData,
            games: gamesData,
            stadiums: stadiumsData,
            groups: groupsData,
            squads: squadsData
        });
        hideCacheBanner();
    } catch (err) {
        console.error('Error loading data:', err);
        if (showedCache) {
            showCacheBanner(lastLiveUpdatedAt);
        } else {
            showLoadError();
        }
    }
}
