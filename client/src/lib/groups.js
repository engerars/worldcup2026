export function sortGroups(groups) {
  const order = 'ABCDEFGHIJKL';
  return [...groups].sort((a, b) => {
    const codeA = groupCode(a);
    const codeB = groupCode(b);
    const idxA = order.indexOf(codeA);
    const idxB = order.indexOf(codeB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return codeA.localeCompare(codeB);
  });
}

export function sortGroupTeams(groupTeams) {
  return [...groupTeams].sort((a, b) => {
    const ptsA = parseInt(a.pts) || 0;
    const ptsB = parseInt(b.pts) || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const gdA = parseInt(a.gd) || 0;
    const gdB = parseInt(b.gd) || 0;
    return gdB - gdA;
  });
}

export function findGroupByTeamId(groups, teamId) {
  const id = String(teamId);
  return groups.find((g) => (g.teams || []).some((t) => String(t.team_id) === id));
}

export function groupCode(group) {
  return String(group.group || group.name || '-').trim().toUpperCase();
}
