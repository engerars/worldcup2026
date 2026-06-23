const ICON_PATHS = {
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3a15.3 15.3 0 0 0 4 8 15.3 15.3 0 0 0-4 8 15.3 15.3 0 0 0-4-8 15.3 15.3 0 0 0 4-8Z"/><path d="M3 12h18"/>',
  stadium:
    '<path d="M4 12h16"/><path d="M6 8v8"/><path d="M18 8v8"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><ellipse cx="12" cy="12" rx="10" ry="6"/>',
  live: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 7V4"/><circle cx="12" cy="14" r="2.5" fill="currentColor" stroke="none"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>',
  team: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  signal:
    '<path d="M2 8.82a16 16 0 0 1 20 0"/><path d="M5 12.86a11 11 0 0 1 14 0"/><path d="M8.5 16.429a6 6 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/><line x1="2" y1="2" x2="22" y2="22"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  github:
    '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 18 4.77 5.07 5.07 0 0 0 17.91 1S16.73.65 13 2.48a13.38 13.38 0 0 0-7 0C2.27.65 1.09 1 1.09 1A5.07 5.07 0 0 0 1 4.77 5.44 5.44 0 0 0 3.5 8.55c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
};

export function Icon({ name, size = 'md', className = '' }) {
  const body = ICON_PATHS[name] || '';
  const cls = ['ui-icon', `ui-icon-${size}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill={name === 'live' ? undefined : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </span>
  );
}

export function NoDataIcon({ name }) {
  return (
    <div className="no-data-icon">
      <Icon name={name} size="xl" />
    </div>
  );
}
