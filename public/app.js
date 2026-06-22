// Translations
        const translations = {
            en: {
                logo: 'World Cup 2026',
                nav_home: 'Home',
                nav_matches: 'Matches',
                nav_live: 'Live',
                nav_teams: 'Teams',
                nav_groups: 'Groups',
                nav_bracket: 'Bracket',
                nav_stadiums: 'Stadiums',
                hero_badge: 'June 11 - July 19, 2026',
                hero_title: 'FIFA World Cup 2026',
                hero_subtitle: 'The biggest sporting event in the world — 48 teams, 104 matches in USA, Canada & Mexico. Live scores, match schedule & free open REST API.',
                days: 'Days',
                hours: 'Hours',
                minutes: 'Minutes',
                seconds: 'Seconds',
                stat_teams: 'Teams',
                stat_groups: 'Groups',
                stat_matches: 'Matches',
                stat_stadiums: 'Stadiums',
                matches_title: 'Match Schedule',
                matches_subtitle: 'View schedule and results of all World Cup matches',
                live_title: 'Live Matches',
                live_subtitle: 'Real-time scores for matches in progress',
                no_live_matches: 'No matches are live right now',
                teams_title: 'Participating Teams',
                teams_subtitle: '48 best football teams in the world',
                groups_title: 'Group Standings',
                groups_subtitle: 'Team rankings in the group stage',
                bracket_title: 'Knockout Bracket',
                bracket_subtitle: 'Road to the World Cup Final — USA, Canada & Mexico 2026',
                bracket_champion: 'WORLD CHAMPIONS',
                bracket_bronze: 'BRONZE WINNER',
                standings_title: 'Group Standings',
                coaching_staff: 'Coaching Staff',
                squad_players: 'Players',
                squad_pos: 'Pos',
                squad_club: 'Club',
                view_squad: 'View squad',
                no_squad_data: 'Squad data not available yet',
                stadiums_title: 'Stadiums',
                stadiums_subtitle: 'World Cup 2026 Venues',
                loading: 'Loading...',
                load_error: 'Could not load data. Please check your connection.',
                cache_offline: 'Showing offline data (IndexedDB) — last updated: {time}',
                live: 'LIVE',
                status_ft: 'FT',
                last_updated: 'Scores updated: {time}',
                footer_text: 'All rights reserved © 2026',
                footer_api: 'API Documentation',
                footer_github: 'GitHub',
                all_matches: 'All Matches',
                all_teams: 'All Teams',
                view_grid: 'Grid',
                view_list: 'List',
                filter_group: 'Group',
                filter_date: 'Date',
                all_dates: 'All dates',
                no_matches_found: 'No matches found',
                matches_on_date: '{count} matches',
                group: 'Group',
                vs: 'VS',
                matchday: 'Matchday',
                capacity: 'Capacity',
                mp: 'MP',
                w: 'W',
                d: 'D',
                l: 'L',
                gf: 'GF',
                ga: 'GA',
                gd: 'GD',
                pts: 'PTS',
                page_title: 'FIFA World Cup 2026 | Live Scores, Schedule, Free API & Group Standings',
                meta_description: 'FIFA World Cup 2026 live scores, match schedule & free REST API. Track 48 teams, 104 matches in real-time. Free World Cup data API — groups, standings, fixtures, teams. USA, Canada & Mexico.',
            }
        };

        let currentLang = 'en';
        let teamsData = [];
        let gamesData = [];
        let stadiumsData = [];
        let groupsData = [];
        let squadsData = {};

        const API_BASE = window.location.origin;
        const DATA_URLS = {
            teams: '/data/teams.json',
            games: '/data/games.json',
            stadiums: '/data/stadiums.json',
            groups: '/data/groups.json',
            squads: '/data/squads.json'
        };
        const LIVE_POLL_MS = 15000;
        let livePollTimer = null;
        let lastLiveFingerprint = '';
        let lastLiveUpdatedAt = null;
        let activeMatchFilter = 'all';
        let activeMatchDateFilter = 'all';
        let matchesViewMode = localStorage.getItem('matchesViewMode') || 'list';
        let matchViewToggleInitialized = false;
        let matchFiltersInitialized = false;
        let visibilityListenerAdded = false;
        let scrollMatchesOnNextRender = false;
        let matchesInitialFocusDone = false;

        let activePageTab = 'matches';

        const ICON_PATHS = {
            trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
            ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3a15.3 15.3 0 0 0 4 8 15.3 15.3 0 0 0-4 8 15.3 15.3 0 0 0-4-8 15.3 15.3 0 0 0 4-8Z"/><path d="M3 12h18"/>',
            stadium: '<path d="M4 12h16"/><path d="M6 8v8"/><path d="M18 8v8"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><ellipse cx="12" cy="12" rx="10" ry="6"/>',
            live: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 7V4"/><circle cx="12" cy="14" r="2.5" fill="currentColor" stroke="none"/>',
            chart: '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>',
            team: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" y1="22" x2="4" y2="15"/>',
            users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            signal: '<path d="M2 8.82a16 16 0 0 1 20 0"/><path d="M5 12.86a11 11 0 0 1 14 0"/><path d="M8.5 16.429a6 6 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/><line x1="2" y1="2" x2="22" y2="22"/>',
            grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
            list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
            github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 18 4.77 5.07 5.07 0 0 0 17.91 1S16.73.65 13 2.48a13.38 13.38 0 0 0-7 0C2.27.65 1.09 1 1.09 1A5.07 5.07 0 0 0 1 4.77 5.44 5.44 0 0 0 3.5 8.55c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
            star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
        };

        function icon(name, size = 'md', extraClass = '') {
            const body = ICON_PATHS[name] || '';
            const fillNone = name === 'live' ? '' : ' fill="none"';
            const svg = `<svg viewBox="0 0 24 24"${fillNone} stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
            const cls = ['ui-icon', `ui-icon-${size}`, extraClass].filter(Boolean).join(' ');
            return `<span class="${cls}" aria-hidden="true">${svg}</span>`;
        }

        function noDataIcon(name) {
            return `<div class="no-data-icon">${icon(name, 'xl')}</div>`;
        }

        function mountIcon(elId, name, size = 'md', extraClass = '') {
            const el = document.getElementById(elId);
            if (!el) return;
            const body = ICON_PATHS[name] || '';
            el.className = ['ui-icon', `ui-icon-${size}`, extraClass].filter(Boolean).join(' ');
            el.setAttribute('aria-hidden', 'true');
            const fillAttr = name === 'live' ? '' : ' fill="none"';
            el.innerHTML = `<svg viewBox="0 0 24 24"${fillAttr} stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
        }

        function initStaticIcons() {
            mountIcon('hero-badge-icon', 'trophy', 'sm', 'ui-icon-primary');
            mountIcon('view-grid-icon', 'grid', 'sm');
            mountIcon('view-list-icon', 'list', 'sm');
            mountIcon('footer-github-icon', 'github', 'sm');
        }

        function flagDataUri(w, h) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="6" fill="#E2E8F0"/><rect x="${w * 0.18}" y="${h * 0.22}" width="${w * 0.64}" height="${h * 0.56}" rx="3" fill="#CBD5E1"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.12}" fill="#94A3B8"/></svg>`;
            return 'data:image/svg+xml,' + encodeURIComponent(svg);
        }

        const FLAG_PLACEHOLDER_SM = flagDataUri(60, 40);
        const FLAG_PLACEHOLDER_LG = flagDataUri(80, 55);

        function flagSrc(url, size) {
            return url || (size === 'lg' ? FLAG_PLACEHOLDER_LG : FLAG_PLACEHOLDER_SM);
        }

        window.flagOnError = function(img, size) {
            img.onerror = null;
            img.src = size === 'lg' ? FLAG_PLACEHOLDER_LG : FLAG_PLACEHOLDER_SM;
        };

        function switchPageTab(tabId) {
            const valid = ['home', 'live', 'matches', 'teams', 'groups', 'bracket', 'stadiums'];
            if (!valid.includes(tabId)) tabId = 'matches';
            activePageTab = tabId;

            document.querySelectorAll('.page-panel').forEach(panel => {
                const active = panel.dataset.panel === tabId;
                panel.classList.toggle('active', active);
            });

            document.querySelectorAll('.page-tab').forEach(btn => {
                const active = btn.dataset.tab === tabId;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
            });

            document.querySelectorAll('#main-nav a[data-tab]').forEach(link => {
                link.classList.toggle('active', link.dataset.tab === tabId);
            });

            const url = new URL(window.location);
            if (tabId === 'matches') {
                url.hash = '';
                history.replaceState(null, '', url);
                focusMatchesTab();
            } else {
                url.hash = tabId;
                history.replaceState(null, '', url);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            if (tabId === 'bracket') scheduleBracketLinks();
        }

        function findFocusMatch(games) {
            const pool = games && games.length ? games : gamesData;
            if (!pool.length) return null;

            const live = sortGamesForList(pool.filter(isGameLive));
            if (live.length) return live[0];

            const todayKey = getLocalTodayKey();
            const todayUnfinished = sortGamesForList(
                pool.filter(g => !isGameFinished(g) && !isGameLive(g) && parseGameDateTime(g).dateKey === todayKey)
            );
            if (todayUnfinished.length) {
                const now = Date.now();
                const nextToday = todayUnfinished.find(g => parseGameDateTime(g).timestamp >= now);
                return nextToday || todayUnfinished[todayUnfinished.length - 1];
            }

            const upcoming = sortGamesForList(pool.filter(g => !isGameFinished(g) && !isGameLive(g)));
            const now = Date.now();
            const next = upcoming.find(g => parseGameDateTime(g).timestamp >= now);
            if (next) return next;

            return upcoming[0] || null;
        }

        function adjustFiltersForFocusMatch() {
            const focus = findFocusMatch(gamesData);
            if (!focus) return false;

            let changed = false;
            const dateKey = parseGameDateTime(focus).dateKey;

            if (activeMatchFilter !== 'all') {
                activeMatchFilter = 'all';
                const groupSelect = document.getElementById('match-group-filter');
                if (groupSelect) groupSelect.value = 'all';
                changed = true;
            }
            if (dateKey !== 'unknown' && activeMatchDateFilter !== dateKey) {
                activeMatchDateFilter = dateKey;
                const dateSelect = document.getElementById('match-date-filter');
                if (dateSelect) dateSelect.value = dateKey;
                changed = true;
            }
            if (changed) renderMatchDateFilter();
            return changed;
        }

        function getMatchesScrollOffset() {
            const tabs = document.querySelector('.page-tabs');
            const tabsH = tabs ? tabs.getBoundingClientRect().height : 0;
            return 68 + tabsH + 16;
        }

        function scrollToElementWithOffset(el, offset) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }

        function scrollToFocusMatch() {
            const focus = findFocusMatch(getFilteredMatches());
            if (!focus) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const el = document.querySelector(`#matches-grid [data-match-id="${String(focus.id)}"]`);
            if (!el) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const offset = getMatchesScrollOffset() + (matchesViewMode === 'list' ? 44 : 0);
            scrollToElementWithOffset(el, offset);
            el.classList.add('match-focus-highlight');
            setTimeout(() => el.classList.remove('match-focus-highlight'), 2000);
        }

        function focusMatchesTab() {
            if (!gamesData.length) return;
            adjustFiltersForFocusMatch();
            scrollMatchesOnNextRender = true;
            renderMatchesDisplay(getFilteredMatches());
        }

        function initPageTabs() {
            document.querySelectorAll('.page-tab, #main-nav a[data-tab]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchPageTab(el.dataset.tab);
                });
            });

            document.getElementById('logo-home')?.addEventListener('click', (e) => {
                e.preventDefault();
                switchPageTab('home');
            });

            const hashTab = window.location.hash.replace('#', '');
            if (['home', 'live', 'teams', 'groups', 'bracket', 'stadiums'].includes(hashTab)) {
                switchPageTab(hashTab);
            }

            window.addEventListener('hashchange', () => {
                const tab = window.location.hash.replace('#', '');
                switchPageTab(tab || 'matches');
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            applyTranslations();
            initPageTabs();
            initStaticIcons();
            initMatchFilters();
            initMatchViewToggle();
            updateMatchViewToggleUI();
            initBracketTeamClicks();
            initTeamSquadClicks();
            startCountdown();
            loadAllData().then(() => startLiveScorePolling());
        });

        // Apply English UI text (single-language app)
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

        function sortGamesForList(games) {
            return [...games].sort((a, b) => parseGameDateTime(a).timestamp - parseGameDateTime(b).timestamp);
        }

        function parseGameDateTime(game) {
            const local = game.local_date || '';
            const m = local.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
            if (!m) {
                return { timestamp: 0, dateKey: 'unknown', timeLabel: '--:--' };
            }
            const month = +m[1];
            const day = +m[2];
            const year = +m[3];
            const hour = +m[4];
            const min = +m[5];
            return {
                timestamp: new Date(year, month - 1, day, hour, min).getTime(),
                dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                timeLabel: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
            };
        }

        function getLocalTodayKey() {
            const n = new Date();
            return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        }

        function formatMatchDateHeader(dateKey, gamesInGroup) {
            if (dateKey === 'unknown') {
                return translations[currentLang].all_matches;
            }
            const [y, mo, d] = dateKey.split('-');
            const dt = new Date(+y, +mo - 1, +d);
            return dt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        function groupGamesByDate(games) {
            const groups = [];
            let current = null;
            for (const game of sortGamesForList(games)) {
                const { dateKey } = parseGameDateTime(game);
                if (!current || current.dateKey !== dateKey) {
                    current = { dateKey, games: [] };
                    groups.push(current);
                }
                current.games.push(game);
            }
            return groups;
        }

        function getGamesForGroupFilter() {
            return activeMatchFilter === 'all'
                ? gamesData
                : gamesData.filter(g => g.group === activeMatchFilter);
        }

        function getFilteredMatches() {
            let games = getGamesForGroupFilter();
            if (activeMatchDateFilter !== 'all') {
                games = games.filter(g => parseGameDateTime(g).dateKey === activeMatchDateFilter);
            }
            return games;
        }

        function formatDateOptionLabel(dateKey, sampleGame) {
            if (dateKey === 'all') return translations[currentLang].all_dates;
            return formatMatchDateHeader(dateKey, sampleGame ? [sampleGame] : []);
        }

        function renderMatchGroupFilter(games) {
            const select = document.getElementById('match-group-filter');
            if (!select) return;

            const groups = ['all', ...[...new Set(games.map(g => g.group).filter(Boolean))].sort()];
            if (!groups.includes(activeMatchFilter)) activeMatchFilter = 'all';

            select.innerHTML = groups.map(g => `
                <option value="${g}" ${g === activeMatchFilter ? 'selected' : ''}>
                    ${g === 'all' ? translations[currentLang].all_matches : translations[currentLang].group + ' ' + g}
                </option>
            `).join('');
        }

        function renderMatchDateFilter() {
            const select = document.getElementById('match-date-filter');
            if (!select) return;

            const games = getGamesForGroupFilter();
            const dateMap = new Map();
            for (const game of games) {
                const { dateKey } = parseGameDateTime(game);
                if (dateKey !== 'unknown' && !dateMap.has(dateKey)) {
                    dateMap.set(dateKey, game);
                }
            }
            const dateKeys = [...dateMap.keys()].sort();

            if (activeMatchDateFilter !== 'all' && !dateKeys.includes(activeMatchDateFilter)) {
                activeMatchDateFilter = 'all';
            }

            const options = [
                { key: 'all', label: translations[currentLang].all_dates },
                ...dateKeys.map(key => ({
                    key,
                    label: formatDateOptionLabel(key, dateMap.get(key))
                }))
            ];

            select.innerHTML = options.map(({ key, label }) => `
                <option value="${key}" ${key === activeMatchDateFilter ? 'selected' : ''}>${label}</option>
            `).join('');
        }

        function initMatchFilters() {
            if (matchFiltersInitialized) return;

            document.getElementById('match-group-filter')?.addEventListener('change', (e) => {
                activeMatchFilter = e.target.value;
                renderMatchDateFilter();
                renderMatchesDisplay(getFilteredMatches());
            });

            document.getElementById('match-date-filter')?.addEventListener('change', (e) => {
                activeMatchDateFilter = e.target.value;
                renderMatchesDisplay(getFilteredMatches());
            });

            matchFiltersInitialized = true;
        }

        function initMatchViewToggle() {
            if (matchViewToggleInitialized) return;
            const toggle = document.getElementById('match-view-toggle');
            if (!toggle) return;
            toggle.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => setMatchViewMode(btn.dataset.view));
            });
            matchViewToggleInitialized = true;
        }

        function setMatchViewMode(mode) {
            if (mode !== 'grid' && mode !== 'list') return;
            matchesViewMode = mode;
            localStorage.setItem('matchesViewMode', mode);
            updateMatchViewToggleUI();
            renderMatchesDisplay(getFilteredMatches());
        }

        function updateMatchViewToggleUI() {
            document.querySelectorAll('#match-view-toggle .view-btn').forEach(btn => {
                const active = btn.dataset.view === matchesViewMode;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        }

        // Render Matches
        function renderMatches(games) {
            if (activePageTab === 'matches' && !matchesInitialFocusDone && games.length) {
                matchesInitialFocusDone = true;
                adjustFiltersForFocusMatch();
                scrollMatchesOnNextRender = true;
            }
            renderMatchGroupFilter(games);
            renderMatchDateFilter();
            updateMatchViewToggleUI();
            renderMatchesDisplay(getFilteredMatches());
        }

        function renderMatchesDisplay(games) {
            const grid = document.getElementById('matches-grid');
            if (!grid) return;

            if (games.length === 0) {
                grid.classList.remove('matches-list-view');
                grid.innerHTML = `<div class="no-data">${noDataIcon('ball')}<p>${translations[currentLang].no_matches_found}</p></div>`;
                return;
            }

            if (matchesViewMode === 'list') {
                grid.classList.add('matches-list-view');
                grid.innerHTML = renderMatchListHTML(games);
            } else {
                grid.classList.remove('matches-list-view');
                renderMatchCards(sortGamesForDisplay(games), 'matches-grid');
            }

            if (scrollMatchesOnNextRender) {
                scrollMatchesOnNextRender = false;
                requestAnimationFrame(() => scrollToFocusMatch());
            }
        }

        function getMatchListRowHTML(game, i) {
            const homeTeam = teamsData.find(t => t.id === game.home_team_id) || {};
            const awayTeam = teamsData.find(t => t.id === game.away_team_id) || {};
            const stadium = stadiumsData.find(s => s.id === game.stadium_id) || {};

            const homeName = game.home_team_name_en || homeTeam.name_en || 'TBD';
            const awayName = game.away_team_name_en || awayTeam.name_en || 'TBD';
            const stadiumName = stadium.name_en || '';
            const { timeLabel } = parseGameDateTime(game);
            const live = isGameLive(game);
            const finished = isGameFinished(game);
            const statusLabel = live
                ? `<span class="live-badge">${translations[currentLang].live}${game.time_elapsed && !isNaN(game.time_elapsed) ? ` ${game.time_elapsed}'` : ''}</span>`
                : (finished ? `<span class="match-minute">${translations[currentLang].status_ft}</span>` : '');

            const centerContent = shouldShowScore(game)
                ? `<span class="match-list-score">${game.home_score || 0} - ${game.away_score || 0}</span>`
                : `<span class="match-list-vs">${translations[currentLang].vs}</span>`;

            return `
                <div class="match-list-row${live ? ' is-live' : ''}" data-match-id="${game.id}" style="animation-delay:${Math.min(i * 0.03, 0.4)}s">
                    <div class="match-list-time">${timeLabel}</div>
                    <div class="match-list-team home">
                        <img class="team-flag" src="${flagSrc(homeTeam.flag, 'sm')}" alt="${homeName}" onerror="flagOnError(this,'sm')">
                        <span class="team-name">${homeName}</span>
                    </div>
                    <div class="match-list-center">${centerContent}</div>
                    <div class="match-list-team away">
                        <img class="team-flag" src="${flagSrc(awayTeam.flag, 'sm')}" alt="${awayName}" onerror="flagOnError(this,'sm')">
                        <span class="team-name">${awayName}</span>
                    </div>
                    <div class="match-list-status">${statusLabel || `<span class="match-group">${translations[currentLang].group} ${game.group || '-'}</span>`}</div>
                    <div class="match-list-meta">
                        <span class="match-group">${translations[currentLang].group} ${game.group || '-'}</span>
                        <span>${translations[currentLang].matchday} ${game.matchday || '-'}</span>
                        <span class="match-stadium">${icon('stadium', 'xs')} ${stadiumName}</span>
                    </div>
                </div>
            `;
        }

        function renderMatchListHTML(games) {
            return groupGamesByDate(games).map(({ dateKey, games: dayGames }) => {
                const header = formatMatchDateHeader(dateKey, dayGames);
                const countLabel = translations[currentLang].matches_on_date.replace('{count}', dayGames.length);
                return `
                    <div class="match-date-group" data-date-key="${dateKey}">
                        <div class="match-date-header">
                            <span>${header}</span>
                            <span class="match-date-count">${countLabel}</span>
                        </div>
                        ${dayGames.map((game, i) => getMatchListRowHTML(game, i)).join('')}
                    </div>
                `;
            }).join('');
        }

        function getMatchCardHTML(game, i) {
            const homeTeam = teamsData.find(t => t.id === game.home_team_id) || {};
            const awayTeam = teamsData.find(t => t.id === game.away_team_id) || {};
            const stadium = stadiumsData.find(s => s.id === game.stadium_id) || {};

            const homeName = game.home_team_name_en || homeTeam.name_en || 'TBD';
            const awayName = game.away_team_name_en || awayTeam.name_en || 'TBD';
            const stadiumName = stadium.name_en || '';
            const dateStr = game.local_date || '';
            const live = isGameLive(game);
            const finished = isGameFinished(game);
            const statusLabel = live
                ? `<span class="live-badge">${translations[currentLang].live}${game.time_elapsed && !isNaN(game.time_elapsed) ? ` ${game.time_elapsed}'` : ''}</span>`
                : (finished ? `<span class="match-minute">${translations[currentLang].status_ft}</span>` : '');

            return `
                <div class="match-card${live ? ' is-live' : ''}" data-match-id="${game.id}" style="animation-delay:${Math.min(i * 0.05, 0.5)}s">
                    <div class="match-header">
                        <span class="match-group">${translations[currentLang].group} ${game.group || '-'}</span>
                        <span>${statusLabel || `${translations[currentLang].matchday} ${game.matchday || '-'}`}</span>
                    </div>
                    <div class="match-teams">
                        <div class="match-team">
                            <img class="team-flag" src="${flagSrc(homeTeam.flag, 'sm')}" alt="${homeName}" onerror="flagOnError(this,'sm')">
                            <span class="team-name">${homeName}</span>
                        </div>
                        <span class="match-vs">${translations[currentLang].vs}</span>
                        <div class="match-team">
                            <img class="team-flag" src="${flagSrc(awayTeam.flag, 'sm')}" alt="${awayName}" onerror="flagOnError(this,'sm')">
                            <span class="team-name">${awayName}</span>
                        </div>
                    </div>
                    ${shouldShowScore(game) ? `
                        <div class="match-score">
                            <span class="score">${game.home_score || 0}</span>
                            <span>-</span>
                            <span class="score">${game.away_score || 0}</span>
                        </div>
                    ` : ''}
                    <div class="match-info">
                        <span>${dateStr}</span>
                        <span class="match-stadium">${icon('stadium', 'xs')} ${stadiumName}</span>
                    </div>
                </div>
            `;
        }

        function renderMatchCards(games, gridId = 'matches-grid') {
            const grid = document.getElementById(gridId);
            if (!grid) return;

            if (games.length === 0) {
                grid.innerHTML = `<div class="no-data">${noDataIcon('ball')}<p>No matches found</p></div>`;
                return;
            }

            grid.innerHTML = games.map((game, i) => getMatchCardHTML(game, i)).join('');
        }

        function renderLiveMatches() {
            const liveGames = sortGamesForDisplay(gamesData.filter(isGameLive));
            updateLiveTabBadge(liveGames.length);

            const grid = document.getElementById('live-grid');
            if (!grid) return;

            if (liveGames.length === 0) {
                grid.innerHTML = `
                    <div class="no-data live-empty">
                        ${noDataIcon('live')}
                        <p>${translations[currentLang].no_live_matches}</p>
                    </div>
                `;
                return;
            }

            renderMatchCards(liveGames, 'live-grid');
        }

        // Render Teams
        function renderTeams(teams) {
            const grid = document.getElementById('teams-grid');
            const tabsContainer = document.getElementById('team-tabs');
            
            // Create tabs
            const groups = ['all', ...[...new Set(teams.map(t => t.groups).filter(Boolean))].sort((a, b) => a.localeCompare(b))];
            tabsContainer.innerHTML = groups.map(g => `
                <button class="tab-btn ${g === 'all' ? 'active' : ''}" onclick="filterTeams('${g}')">
                    ${g === 'all' ? translations[currentLang].all_teams : translations[currentLang].group + ' ' + g}
                </button>
            `).join('');
            
            renderTeamCards(teams);
        }

        function filterTeams(group) {
            document.querySelectorAll('#team-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const filtered = group === 'all' ? teamsData : teamsData.filter(t => t.groups === group);
            renderTeamCards(filtered);
        }

        function renderTeamCards(teams) {
            const grid = document.getElementById('teams-grid');
            
            if (teams.length === 0) {
                grid.innerHTML = `<div class="no-data">${noDataIcon('team')}<p>No teams found</p></div>`;
                return;
            }
            
            grid.innerHTML = teams.map(team => `
                <div class="team-card" data-team-id="${team.id}" role="button" tabindex="0" title="${translations[currentLang].view_squad}">
                    <img class="team-flag" src="${flagSrc(team.flag, 'lg')}" alt="${team.name_en}" onerror="flagOnError(this,'lg')">
                    <span class="team-name">${team.name_en}</span>
                    <span class="team-group">${translations[currentLang].group} ${team.groups || '-'}</span>
                    <span class="fifa-code">${team.fifa_code || ''}</span>
                    <span class="team-card-hint">${translations[currentLang].view_squad}</span>
                </div>
            `).join('');
        }

        function getSquadForTeam(teamId) {
            return squadsData[String(teamId)] || null;
        }

        function renderSquadPlayersTable(players) {
            const t = translations[currentLang];
            const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
            players.forEach(p => {
                const pos = byPos[p.position] ? p.position : 'MID';
                byPos[pos].push(p);
            });
            const ordered = [...byPos.GK, ...byPos.DEF, ...byPos.MID, ...byPos.FWD];

            return `
                <div class="squad-players-wrap">
                    <table class="squad-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>${t.squad_players}</th>
                                <th>${t.squad_pos}</th>
                                <th>${t.squad_club}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordered.map(p => `
                                <tr>
                                    <td class="squad-num">${p.number || '—'}</td>
                                    <td>${p.name}</td>
                                    <td class="squad-pos">${p.position || '—'}</td>
                                    <td class="squad-club">${p.club || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function openTeamSquadModal(teamId) {
            const team = teamsData.find(t => String(t.id) === String(teamId));
            if (!team) return;

            const squad = getSquadForTeam(teamId);
            const body = document.getElementById('teamSquadModalBody');
            const t = translations[currentLang];
            const color = GROUP_COLORS[team.groups] || '#64748b';

            if (!squad || (!squad.staff?.length && !squad.players?.length)) {
                body.innerHTML = `
                    <div class="team-squad-header">
                        <img src="${flagSrc(team.flag, 'lg')}" alt="${team.name_en}" onerror="flagOnError(this,'lg')">
                        <div>
                            <h3>${team.name_en}</h3>
                            <span style="color:${color}">${t.group} ${team.groups || '-'} · ${team.fifa_code || ''}</span>
                        </div>
                    </div>
                    <div class="no-data" style="padding:24px 0">${noDataIcon('team')}<p>${t.no_squad_data}</p></div>
                `;
            } else {
                body.innerHTML = `
                    <div class="team-squad-header">
                        <img src="${flagSrc(team.flag, 'lg')}" alt="${team.name_en}" onerror="flagOnError(this,'lg')">
                        <div>
                            <h3>${team.name_en}</h3>
                            <span style="color:${color}">${t.group} ${team.groups || '-'} · ${team.fifa_code || ''}</span>
                        </div>
                    </div>
                    ${squad.staff?.length ? `
                        <div class="squad-section">
                            <div class="squad-section-title">${t.coaching_staff}</div>
                            <div class="squad-staff-list">
                                ${squad.staff.map(s => `
                                    <div class="squad-staff-row">
                                        <span class="role">${s.role}</span>
                                        <span class="name">${s.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${squad.players?.length ? `
                        <div class="squad-section">
                            <div class="squad-section-title">${t.squad_players} (${squad.players.length})</div>
                            ${renderSquadPlayersTable(squad.players)}
                        </div>
                    ` : ''}
                `;
            }

            document.getElementById('teamSquadModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeTeamSquadModal() {
            document.getElementById('teamSquadModal').classList.remove('active');
            if (!document.getElementById('teamStandingsModal').classList.contains('active')) {
                document.body.style.overflow = '';
            }
        }

        function initTeamSquadClicks() {
            if (window.__teamSquadClicksBound) return;
            window.__teamSquadClicksBound = true;

            const grid = document.getElementById('teams-grid');
            const modal = document.getElementById('teamSquadModal');

            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.team-card[data-team-id]');
                if (!card) return;
                openTeamSquadModal(card.dataset.teamId);
            });

            grid.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const card = e.target.closest('.team-card[data-team-id]');
                if (!card) return;
                e.preventDefault();
                openTeamSquadModal(card.dataset.teamId);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeTeamSquadModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeTeamSquadModal();
                }
            });
        }

        // Knockout Bracket
        const GROUP_COLORS = {
            A: '#22c55e', B: '#ef4444', C: '#f97316', D: '#15803d',
            E: '#94a3b8', F: '#3b82f6', G: '#eab308', H: '#ec4899',
            I: '#a855f7', J: '#881337', K: '#dc2626', L: '#2563eb'
        };

        const BRACKET = {
            /* Top→bottom order per column, mirrored to match knockout tree */
            leftGroups: ['A', 'B', 'C', 'D', 'E', 'F'],
            rightGroups: ['G', 'H', 'I', 'J', 'K', 'L'],
            leftR32:  ['74', '77', '73', '75', '83', '84', '81', '82'],
            rightR32: ['76', '78', '79', '80', '86', '88', '85', '87'],
            leftR16:  ['89', '90', '93', '94'],
            rightR16: ['91', '92', '95', '96'],
            leftQF:   ['97', '98'],
            rightQF:  ['99', '100'],
            leftSF:   '101',
            rightSF:  '102',
            final: '104',
            third: '103'
        };

        const BRACKET_LINKS = [
            ['74', '77', '89'], ['73', '75', '90'], ['83', '84', '93'], ['81', '82', '94'],
            ['76', '78', '91'], ['79', '80', '92'], ['86', '88', '95'], ['85', '87', '96'],
            ['89', '90', '97'], ['93', '94', '98'], ['91', '92', '99'], ['95', '96', '100'],
            ['97', '98', '101'], ['99', '100', '102']
            // SF → Final link intentionally omitted so connector lines never cross the trophy
        ];

        function bracketSideForMatch(id) {
            const s = String(id);
            if (BRACKET.leftR32.includes(s) || BRACKET.leftR16.includes(s) || BRACKET.leftQF.includes(s) || s === BRACKET.leftSF) return 'left';
            if (BRACKET.rightR32.includes(s) || BRACKET.rightR16.includes(s) || BRACKET.rightQF.includes(s) || s === BRACKET.rightSF) return 'right';
            return 'center';
        }

        function shortBracketLabel(label) {
            if (!label) return 'TBD';
            let m = label.match(/Winner Group (\w)/);
            if (m) return '1' + m[1];
            m = label.match(/Runner-up Group (\w)/);
            if (m) return '2' + m[1];
            m = label.match(/3rd Group ([A-Z/]+)/);
            if (m) return '3 ' + m[1].replace(/\//g, '');
            m = label.match(/Winner Match (\d+)/);
            if (m) return 'W' + m[1];
            m = label.match(/Loser Match (\d+)/);
            if (m) return 'L' + m[1];
            return label;
        }

        function bracketSlotName(game, side) {
            const teamId = side === 'home' ? game.home_team_id : game.away_team_id;
            const label = side === 'home' ? game.home_team_label : game.away_team_label;
            if (teamId && String(teamId) !== '0') {
                const team = teamsData.find(t => String(t.id) === String(teamId));
                const fromGame = game[`${side === 'home' ? 'home' : 'away'}_team_name_en`];
                return fromGame || team?.name_en || 'TBD';
            }
            return shortBracketLabel(label);
        }

        function getGameById(id) {
            return gamesData.find(g => String(g.id) === String(id));
        }

        function renderBracketGroupCard(letter) {
            const color = GROUP_COLORS[letter] || '#64748b';
            const teams = teamsData.filter(t => t.groups === letter).slice(0, 4);
            let flags = teams.map(t =>
                `<img src="${flagSrc(t.flag, 'sm')}" alt="" onerror="flagOnError(this,'sm')">`
            ).join('');
            while (teams.length + (flags.match(/<span/g) || []).length < 4) {
                flags += '<span style="height:22px"></span>';
                teams.push(null);
            }
            return `
                <div class="bracket-group-card" style="--gc:${color}">
                    <div class="bracket-group-flags">${flags}</div>
                    <div class="bracket-group-label">${translations[currentLang].group} ${letter}</div>
                </div>
            `;
        }

        function bracketSlotRow(game, side, white) {
            const teamId = game ? (side === 'home' ? game.home_team_id : game.away_team_id) : null;
            const known = teamId && String(teamId) !== '0';
            const name = game ? bracketSlotName(game, side) : 'TBD';
            let flag = '';
            if (known) {
                const team = teamsData.find(t => String(t.id) === String(teamId));
                if (team) flag = `<img src="${flagSrc(team.flag, 'sm')}" alt="" onerror="flagOnError(this,'sm')">`;
            }
            const score = (game && shouldShowScore(game))
                ? `<span class="${white ? 'seed-score' : 'adv-score'}">${(side === 'home' ? game.home_score : game.away_score) || 0}</span>`
                : '';
            const rowClass = white ? 'bracket-seed-row' : `adv-row${known ? '' : ' seed'}`;
            const clickAttrs = known
                ? ` class="${rowClass} bracket-team-slot" data-team-id="${teamId}" role="button" tabindex="0" title="${translations[currentLang].standings_title || 'Group Standings'}"`
                : ` class="${rowClass}"`;
            return `<div${clickAttrs}>${flag}<span class="seed-name">${name}</span>${score}</div>`;
        }

        function renderBracketMatch(id, kind) {
            const game = getGameById(id);
            const live = game && isGameLive(game);
            const finished = game && isGameFinished(game);
            const stateClass = `${live ? ' is-live' : ''}${finished ? ' is-finished' : ''}`;

            if (kind === 'r32') {
                return `
                    <div class="bracket-match r32${stateClass}" data-match-id="${id}" title="Match ${id}">
                        ${bracketSlotRow(game, 'home', true)}
                        ${bracketSlotRow(game, 'away', true)}
                    </div>
                `;
            }
            const extra = kind === 'final' ? ' final' : '';
            return `
                <div class="bracket-match adv${extra}${stateClass}" data-match-id="${id}" title="Match ${id}">
                    ${bracketSlotRow(game, 'home', false)}
                    ${bracketSlotRow(game, 'away', false)}
                </div>
            `;
        }

        function bracketAnchor(el, side, origin) {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2 - origin.left;
            const cy = r.top + r.height / 2 - origin.top;
            if (side === 'right') return { x: r.right - origin.left, y: cy };
            if (side === 'left') return { x: r.left - origin.left, y: cy };
            if (side === 'top') return { x: cx, y: r.top - origin.top };
            if (side === 'bottom') return { x: cx, y: r.bottom - origin.top };
            return { x: cx, y: cy };
        }

        function bracketLinkPath(k1, k2, parent, origin) {
            const e1 = document.querySelector(`[data-match-id="${k1}"]`);
            const e2 = document.querySelector(`[data-match-id="${k2}"]`);
            const ep = document.querySelector(`[data-match-id="${parent}"]`);
            if (!e1 || !e2 || !ep) return '';

            const side1 = bracketSideForMatch(k1);
            const side2 = bracketSideForMatch(k2);
            const gap = 12;

            if (side1 === side2) {
                const exit = side1 === 'right' ? 'left' : 'right';
                const enter = side1 === 'right' ? 'right' : 'left';
                const a = bracketAnchor(e1, exit, origin);
                const b = bracketAnchor(e2, exit, origin);
                const p = bracketAnchor(ep, enter, origin);
                const dir = exit === 'right' ? 1 : -1;
                const forkX = a.x + dir * gap;
                const midY = (a.y + b.y) / 2;
                const stubX = p.x - dir * gap;
                return [
                    `M ${a.x} ${a.y} H ${forkX}`,
                    `M ${b.x} ${b.y} H ${forkX}`,
                    `M ${forkX} ${a.y} V ${b.y}`,
                    `M ${forkX} ${midY} H ${stubX} V ${p.y} H ${p.x}`
                ].join(' ');
            }

            // Cross-side: two semi-finals into the central final (which sits above)
            const a = bracketAnchor(e1, side1 === 'left' ? 'right' : 'left', origin);
            const b = bracketAnchor(e2, side2 === 'left' ? 'right' : 'left', origin);
            const p = bracketAnchor(ep, 'bottom', origin);
            const midX = p.x;
            const midY = (a.y + b.y) / 2;
            return [
                `M ${a.x} ${a.y} H ${midX}`,
                `M ${b.x} ${b.y} H ${midX}`,
                `M ${midX} ${a.y} V ${b.y}`,
                `M ${midX} ${midY} V ${p.y}`
            ].join(' ');
        }

        function drawBracketLinks() {
            const svg = document.getElementById('bracket-svg');
            const stage = document.querySelector('.bracket-stage');
            if (!svg || !stage) return;

            const origin = stage.getBoundingClientRect();
            svg.setAttribute('width', stage.offsetWidth);
            svg.setAttribute('height', stage.offsetHeight);
            svg.setAttribute('viewBox', `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);

            let paths = '';
            BRACKET_LINKS.forEach(([k1, k2, parent]) => {
                const d = bracketLinkPath(String(k1), String(k2), String(parent), origin);
                if (d) paths += `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-linejoin="round"/>`;
            });
            svg.innerHTML = paths;
        }

        let bracketLinkTimer;
        function scheduleBracketLinks() {
            requestAnimationFrame(() => {
                drawBracketLinks();
                clearTimeout(bracketLinkTimer);
                bracketLinkTimer = setTimeout(drawBracketLinks, 90);
            });
        }

        if (!window.__bracketResizeBound) {
            window.__bracketResizeBound = true;
            let rt;
            window.addEventListener('resize', () => {
                clearTimeout(rt);
                rt = setTimeout(scheduleBracketLinks, 120);
            });
            window.addEventListener('load', scheduleBracketLinks);
        }

        function renderBracketCol(ids, kind, extraClass = '') {
            const cells = ids.map(id => renderBracketMatch(id, kind)).join('');
            return `<div class="bracket-col ${extraClass}">${cells}</div>`;
        }

        function renderBracket() {
            const board = document.getElementById('bracket-board');
            if (!board) return;

            if (!gamesData.length || !teamsData.length) {
                board.innerHTML = `<div class="loading"><div class="spinner"></div><span>${translations[currentLang].loading}</span></div>`;
                return;
            }

            const leftGroups = `<div class="bracket-col col-groups">${BRACKET.leftGroups.map(renderBracketGroupCard).join('')}</div>`;
            const rightGroups = `<div class="bracket-col col-groups">${BRACKET.rightGroups.map(renderBracketGroupCard).join('')}</div>`;

            board.innerHTML = `
                <div class="bracket-stage">
                    <svg class="bracket-svg" id="bracket-svg" aria-hidden="true"></svg>
                    <div class="bracket-flex">
                        <div class="bracket-side left">
                            ${leftGroups}
                            ${renderBracketCol(BRACKET.leftR32, 'r32')}
                            ${renderBracketCol(BRACKET.leftR16, 'adv')}
                            ${renderBracketCol(BRACKET.leftQF, 'adv')}
                            ${renderBracketCol([BRACKET.leftSF], 'adv')}
                        </div>
                        <div class="bracket-center">
                            <div class="bracket-champion-label">${translations[currentLang].bracket_champion}</div>
                            <div class="bracket-final-wrap">${renderBracketMatch(BRACKET.final, 'final')}</div>
                            <div class="bracket-trophy"><img src="/trophy.png" alt="FIFA World Cup Trophy"></div>
                            <div class="bracket-bronze-label">${translations[currentLang].bracket_bronze}</div>
                            <div class="bracket-third-wrap">${renderBracketMatch(BRACKET.third, 'adv')}</div>
                            <img src="/trophy.png" alt="FIFA World Cup 2026" class="bracket-wc-logo">
                        </div>
                        <div class="bracket-side right">
                            ${renderBracketCol([BRACKET.rightSF], 'adv')}
                            ${renderBracketCol(BRACKET.rightQF, 'adv')}
                            ${renderBracketCol(BRACKET.rightR16, 'adv')}
                            ${renderBracketCol(BRACKET.rightR32, 'r32')}
                            ${rightGroups}
                        </div>
                    </div>
                </div>
            `;

            scheduleBracketLinks();
        }

        // Render Groups
        function sortGroups(groups) {
            return [...groups].sort((a, b) => {
                const codeA = String(a.group || a.name || '').trim().toUpperCase();
                const codeB = String(b.group || b.name || '').trim().toUpperCase();
                return codeA.localeCompare(codeB);
            });
        }

        function sortGroupTeams(groupTeams) {
            return [...groupTeams].sort((a, b) => {
                const ptsA = parseInt(a.pts) || 0;
                const ptsB = parseInt(b.pts) || 0;
                if (ptsB !== ptsA) return ptsB - ptsA;
                const gdA = parseInt(a.gd) || 0;
                const gdB = parseInt(b.gd) || 0;
                return gdB - gdA;
            });
        }

        function renderGroupTableRows(groupTeams, highlightTeamId) {
            const sortedTeams = sortGroupTeams(groupTeams);
            return sortedTeams.map((teamInfo, index) => {
                const team = teamsData.find(t => String(t.id) === String(teamInfo.team_id)) || {};
                const gd = parseInt(teamInfo.gd) || 0;
                const gdClass = gd > 0 ? 'stat-positive' : (gd < 0 ? 'stat-negative' : 'stat-zero');
                const rankClass = `rank-${index + 1}`;
                const highlighted = highlightTeamId && String(teamInfo.team_id) === String(highlightTeamId);

                return `
                    <tr class="${highlighted ? 'is-highlighted' : ''}">
                        <td><span class="rank ${rankClass}">${index + 1}</span></td>
                        <td>
                            <div class="team-cell">
                                <img src="${flagSrc(team.flag, 'sm')}" alt="${team.name_en || ''}" onerror="flagOnError(this,'sm')">
                                <span class="team-name-text">${team.name_en || 'Unknown'}</span>
                            </div>
                        </td>
                        <td>${teamInfo.mp || 0}</td>
                        <td class="stat-positive">${teamInfo.w || 0}</td>
                        <td class="stat-zero">${teamInfo.d || 0}</td>
                        <td class="stat-negative">${teamInfo.l || 0}</td>
                        <td>${teamInfo.gf || 0}</td>
                        <td>${teamInfo.ga || 0}</td>
                        <td class="${gdClass}">${gd > 0 ? '+' : ''}${gd}</td>
                        <td class="pts-cell">${teamInfo.pts || 0}</td>
                    </tr>
                `;
            }).join('');
        }

        function renderGroupTable(groupTeams, highlightTeamId) {
            const t = translations[currentLang];
            return `
                <table class="group-table">
                    <colgroup>
                        <col class="col-rank">
                        <col class="col-team">
                        <col class="col-stat" span="7">
                        <col class="col-pts">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style="text-align:left; padding-left: 15px;">Team</th>
                            <th>${t.mp}</th>
                            <th>${t.w}</th>
                            <th>${t.d}</th>
                            <th>${t.l}</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th>${t.gd}</th>
                            <th>${t.pts}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderGroupTableRows(groupTeams, highlightTeamId)}
                    </tbody>
                </table>
            `;
        }

        function findGroupByTeamId(teamId) {
            const id = String(teamId);
            return groupsData.find(g => (g.teams || []).some(t => String(t.team_id) === id));
        }

        function openTeamStandingsModal(teamId) {
            const team = teamsData.find(t => String(t.id) === String(teamId));
            const group = findGroupByTeamId(teamId);
            if (!team || !group) return;

            const groupCode = String(group.group || group.name || '-').trim().toUpperCase();
            const color = GROUP_COLORS[groupCode] || '#64748b';
            const body = document.getElementById('teamStandingsModalBody');

            body.innerHTML = `
                <div class="team-standings-team">
                    <img src="${flagSrc(team.flag, 'lg')}" alt="${team.name_en}" onerror="flagOnError(this,'lg')">
                    <div>
                        <h3>${team.name_en}</h3>
                        <span>${translations[currentLang].group} ${groupCode} · ${translations[currentLang].standings_title || 'Group Standings'}</span>
                    </div>
                </div>
                <div class="team-standings-card group-card" style="--group-header-color: ${color};">
                    <div class="group-header">
                        <span class="group-header-title">${icon('ball', 'sm', 'ui-icon-white')} ${translations[currentLang].group} ${groupCode}</span>
                        <span class="group-icon">${icon('trophy', 'sm', 'ui-icon-white')}</span>
                    </div>
                    <div class="group-table-wrap">
                        ${renderGroupTable(group.teams || [], teamId)}
                    </div>
                </div>
            `;

            document.getElementById('teamStandingsModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeTeamStandingsModal() {
            document.getElementById('teamStandingsModal').classList.remove('active');
            if (!document.getElementById('teamSquadModal').classList.contains('active')) {
                document.body.style.overflow = '';
            }
        }

        function initBracketTeamClicks() {
            if (window.__bracketTeamClicksBound) return;
            window.__bracketTeamClicksBound = true;

            const board = document.getElementById('bracket-board');
            const modal = document.getElementById('teamStandingsModal');

            board.addEventListener('click', (e) => {
                const slot = e.target.closest('.bracket-team-slot[data-team-id]');
                if (!slot) return;
                openTeamStandingsModal(slot.dataset.teamId);
            });

            board.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const slot = e.target.closest('.bracket-team-slot[data-team-id]');
                if (!slot) return;
                e.preventDefault();
                openTeamStandingsModal(slot.dataset.teamId);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeTeamStandingsModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeTeamStandingsModal();
                }
            });
        }

        function renderGroups(groups) {
            const grid = document.getElementById('groups-grid');
            
            if (groups.length === 0) {
                grid.innerHTML = `<div class="no-data">${noDataIcon('chart')}<p>No groups found</p></div>`;
                return;
            }
            
            grid.innerHTML = sortGroups(groups).map(group => {
                const groupCode = String(group.group || group.name || '-').trim().toUpperCase();
                const color = GROUP_COLORS[groupCode] || '#64748b';
                const groupTeams = group.teams || [];
                
                return `
                    <div class="group-card" style="--group-header-color: ${color};">
                        <div class="group-header">
                            <span class="group-header-title">${icon('ball', 'sm', 'ui-icon-white')} ${translations[currentLang].group} ${groupCode}</span>
                            <span class="group-icon">${icon('trophy', 'sm', 'ui-icon-white')}</span>
                        </div>
                        <div class="group-table-wrap">
                        ${renderGroupTable(groupTeams)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Stadiums
        function renderStadiums(stadiums) {
            const grid = document.getElementById('stadiums-grid');
            
            if (stadiums.length === 0) {
                grid.innerHTML = `<div class="no-data">${noDataIcon('stadium')}<p>No stadiums found</p></div>`;
                return;
            }
            
            grid.innerHTML = stadiums.map(stadium => {
                const name = stadium.name_en;
                const city = stadium.city_en;
                const country = stadium.country_en;
                return `
                <div class="stadium-card">
                    <div class="stadium-photo">
                        <img src="/stadiums/${stadium.id}.jpg" alt="${name}" loading="lazy"
                             onerror="this.remove();this.parentElement.classList.add('no-photo')">
                        <div class="stadium-photo-fallback">${icon('stadium', 'lg', 'ui-icon-white')}</div>
                        ${stadium.region ? `<span class="stadium-region-badge">${stadium.region}</span>` : ''}
                    </div>
                    <div class="stadium-body">
                        <div class="stadium-name">${name}</div>
                        <div class="stadium-city">${city}, ${country}</div>
                        <span class="stadium-capacity">${icon('users', 'sm', 'ui-icon-secondary')} ${translations[currentLang].capacity}: ${(stadium.capacity || 0).toLocaleString()}</span>
                    </div>
                </div>
            `;
            }).join('');
        }
