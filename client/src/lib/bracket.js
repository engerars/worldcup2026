export const BRACKET = {
  leftGroups: ['A', 'B', 'C', 'D', 'E', 'F'],
  rightGroups: ['G', 'H', 'I', 'J', 'K', 'L'],
  leftR32: ['74', '77', '73', '75', '83', '84', '81', '82'],
  rightR32: ['76', '78', '79', '80', '86', '88', '85', '87'],
  leftR16: ['89', '90', '93', '94'],
  rightR16: ['91', '92', '95', '96'],
  leftQF: ['97', '98'],
  rightQF: ['99', '100'],
  leftSF: '101',
  rightSF: '102',
  final: '104',
  third: '103'
};

export const BRACKET_LINKS = [
  ['74', '77', '89'],
  ['73', '75', '90'],
  ['83', '84', '93'],
  ['81', '82', '94'],
  ['76', '78', '91'],
  ['79', '80', '92'],
  ['86', '88', '95'],
  ['85', '87', '96'],
  ['89', '90', '97'],
  ['93', '94', '98'],
  ['91', '92', '99'],
  ['95', '96', '100'],
  ['97', '98', '101'],
  ['99', '100', '102']
];

export function bracketSideForMatch(id) {
  const s = String(id);
  if (
    BRACKET.leftR32.includes(s) ||
    BRACKET.leftR16.includes(s) ||
    BRACKET.leftQF.includes(s) ||
    s === BRACKET.leftSF
  )
    return 'left';
  if (
    BRACKET.rightR32.includes(s) ||
    BRACKET.rightR16.includes(s) ||
    BRACKET.rightQF.includes(s) ||
    s === BRACKET.rightSF
  )
    return 'right';
  return 'center';
}

export function shortBracketLabel(label) {
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

export function bracketSlotName(game, side, teams) {
  const teamId = side === 'home' ? game.home_team_id : game.away_team_id;
  const label = side === 'home' ? game.home_team_label : game.away_team_label;
  if (teamId && String(teamId) !== '0') {
    const team = teams.find((t) => String(t.id) === String(teamId));
    const fromGame = game[`${side === 'home' ? 'home' : 'away'}_team_name_en`];
    return fromGame || team?.name_en || 'TBD';
  }
  return shortBracketLabel(label);
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

  const a = bracketAnchor(e1, side1 === 'left' ? 'right' : 'left', origin);
  const b = bracketAnchor(e2, side2 === 'left' ? 'right' : 'left', origin);
  const p = bracketAnchor(ep, 'bottom', origin);
  const midX = p.x;
  const midY = (a.y + b.y) / 2;
  return [`M ${a.x} ${a.y} H ${midX}`, `M ${b.x} ${b.y} H ${midX}`, `M ${midX} ${a.y} V ${b.y}`, `M ${midX} ${midY} V ${p.y}`].join(
    ' '
  );
}

export function drawBracketLinks(stageEl, svgEl) {
  if (!svgEl || !stageEl) return;
  const origin = stageEl.getBoundingClientRect();
  svgEl.setAttribute('width', stageEl.offsetWidth);
  svgEl.setAttribute('height', stageEl.offsetHeight);
  svgEl.setAttribute('viewBox', `0 0 ${stageEl.offsetWidth} ${stageEl.offsetHeight}`);

  let paths = '';
  BRACKET_LINKS.forEach(([k1, k2, parent]) => {
    const d = bracketLinkPath(String(k1), String(k2), String(parent), origin);
    if (d) paths += `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="1.4" stroke-linejoin="round"/>`;
  });
  svgEl.innerHTML = paths;
}
