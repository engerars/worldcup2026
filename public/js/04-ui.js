// Renderers, bracket, modals
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
