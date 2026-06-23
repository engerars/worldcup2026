import { useWorldCup } from '../context/WorldCupContext';
import { Icon, NoDataIcon } from './Icon';
import { LoadingBlock } from './shared';
import { t } from '../i18n';

export function StadiumsTab() {
  const { stadiums, loading, loadError } = useWorldCup();

  return (
    <div className="container">
      <div className="section-header">
        <h2>{t.stadiums_title}</h2>
        <p>{t.stadiums_subtitle}</p>
      </div>
      <div className="cards-grid">
        {loading ? (
          <LoadingBlock />
        ) : loadError ? (
          <div className="no-data">
            <NoDataIcon name="signal" />
            <p>{t.load_error}</p>
          </div>
        ) : stadiums.length === 0 ? (
          <div className="no-data">
            <NoDataIcon name="stadium" />
            <p>No stadiums found</p>
          </div>
        ) : (
          stadiums.map((stadium) => (
            <div key={stadium.id} className="stadium-card">
              <div className="stadium-photo">
                <img
                  src={`/stadiums/${stadium.id}.jpg`}
                  alt={stadium.name_en}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.remove();
                    e.currentTarget.parentElement?.classList.add('no-photo');
                  }}
                />
                <div className="stadium-photo-fallback">
                  <Icon name="stadium" size="lg" className="ui-icon-white" />
                </div>
                {stadium.region ? <span className="stadium-region-badge">{stadium.region}</span> : null}
              </div>
              <div className="stadium-body">
                <div className="stadium-name">{stadium.name_en}</div>
                <div className="stadium-city">
                  {stadium.city_en}, {stadium.country_en}
                </div>
                <span className="stadium-capacity">
                  <Icon name="users" size="sm" className="ui-icon-secondary" /> {t.capacity}: {(stadium.capacity || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
