// Shared state, translations, constants
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
