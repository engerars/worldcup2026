function flagDataUri(w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="6" fill="#E2E8F0"/><rect x="${w * 0.18}" y="${h * 0.22}" width="${w * 0.64}" height="${h * 0.56}" rx="3" fill="#CBD5E1"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.12}" fill="#94A3B8"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const FLAG_PLACEHOLDER_SM = flagDataUri(60, 40);
const FLAG_PLACEHOLDER_LG = flagDataUri(80, 55);

export function flagSrc(url, size) {
  return url || (size === 'lg' ? FLAG_PLACEHOLDER_LG : FLAG_PLACEHOLDER_SM);
}

export function flagOnError(e, size) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = size === 'lg' ? FLAG_PLACEHOLDER_LG : FLAG_PLACEHOLDER_SM;
}

export function findTeam(teams, id) {
  return teams.find((t) => String(t.id) === String(id)) || {};
}

export function findStadium(stadiums, id) {
  return stadiums.find((s) => String(s.id) === String(id)) || {};
}
