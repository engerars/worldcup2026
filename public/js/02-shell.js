// Icons, navigation, tabs
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
