import { useMemo, useState } from 'react';
import { useWorldCup } from '../context/WorldCupContext';
import { sortGroups, groupCode } from '../lib/groups';
import { GROUP_COLORS, t } from '../i18n';
import { Icon, NoDataIcon } from './Icon';
import { GroupTable } from './GroupTable';
import { GroupFocusOverlay } from './GroupFocusOverlay';
import { LoadingBlock } from './shared';

export function GroupsTab() {
  const { groups, teams, loading, loadError } = useWorldCup();
  const [focusedCode, setFocusedCode] = useState(null);

  const sortedGroups = useMemo(() => sortGroups(groups), [groups]);
  const focusedGroup = useMemo(
    () => (focusedCode ? sortedGroups.find((g) => groupCode(g) === focusedCode) : null),
    [sortedGroups, focusedCode]
  );

  const openGroup = (code) => setFocusedCode(code);
  const closeGroup = () => setFocusedCode(null);

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.groups_title}</h2>
        <p>{t.groups_subtitle}</p>
      </div>
      <div className={`groups-stage${focusedCode ? ' is-focused' : ''}`}>
        <div className="cards-grid" id="groups-grid">
          {loading ? (
            <LoadingBlock />
          ) : loadError ? (
            <div className="no-data">
              <NoDataIcon name="signal" />
              <p>{t.load_error}</p>
            </div>
          ) : sortedGroups.length === 0 ? (
            <div className="no-data">
              <NoDataIcon name="chart" />
              <p>No groups found</p>
            </div>
          ) : (
            sortedGroups.map((group) => {
              const code = groupCode(group);
              const color = GROUP_COLORS[code] || '#64748b';
              const isActive = focusedCode === code;
              return (
                <div
                  key={code}
                  className={`group-card group-card--interactive${isActive ? ' group-card--active' : ''}${focusedCode && !isActive ? ' group-card--dimmed' : ''}`}
                  style={{ '--group-header-color': color }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isActive}
                  aria-label={`${t.group} ${code}`}
                  onClick={() => openGroup(code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openGroup(code);
                    }
                  }}
                >
                  <div className="group-header">
                    <span className="group-header-title">
                      <Icon name="ball" size="sm" className="ui-icon-white" /> {t.group} {code}
                    </span>
                    <span className="group-icon">
                      <Icon name="trophy" size="sm" className="ui-icon-white" />
                    </span>
                  </div>
                  <div className="group-table-wrap">
                    <GroupTable groupTeams={group.teams || []} teams={teams} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        {focusedGroup ? <GroupFocusOverlay group={focusedGroup} onClose={closeGroup} /> : null}
      </div>
    </div>
  );
}
