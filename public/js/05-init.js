// Boot + global handlers for inline HTML
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

// HTML onclick handlers
window.closeTeamStandingsModal = closeTeamStandingsModal;
window.closeTeamSquadModal = closeTeamSquadModal;
window.filterTeams = filterTeams;
