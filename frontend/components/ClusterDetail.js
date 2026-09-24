import { useEffect, useState } from 'react';
import { getClusterDetail } from '../lib/api';

export default function ClusterDetail({ clusterId, selectedSources, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clusterId) return;
    setData(null);
    setError(null);
    getClusterDetail(clusterId).then(setData).catch((e) => setError(e.message));
  }, [clusterId]);

  if (!clusterId) return null;

  const visibleArticles = data
    ? data.articles.filter((a) => !selectedSources || selectedSources.has(a.source))
    : [];

  return (
    <div className="cluster-detail-overlay" onClick={onClose}>
      <div className="cluster-detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>Close X</button>
        {error && <p className="error">{error}</p>}
        {!data && !error && <p>Loading...</p>}
        {data && (
          <>
            <h2>{data.cluster.label}</h2>
            <p className="keywords">Keywords: {data.cluster.keywords.join(', ')}</p>
            <ul className="article-list">
              {visibleArticles.map((a) => (
                <li key={a.id}>
                  <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
                  <div className="article-meta">
                    <span className="source-tag">{a.source}</span>
                    <span>{new Date(a.published_at).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
            {visibleArticles.length === 0 && (
              <p className="empty-state">No articles from the currently selected sources.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}