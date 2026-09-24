import { useMemo } from 'react';

// Plots each cluster as a horizontal block spanning its earliest → latest
// article. No charting library needed: we just map timestamps onto a
// percentage scale across the visible time range.
export default function Timeline({ clusters, onSelectCluster, selectedClusterId }) {
  const { minTime, maxTime } = useMemo(() => {
    if (clusters.length === 0) return { minTime: 0, maxTime: 1 };
    const starts = clusters.map(c => new Date(c.startTime).getTime());
    const ends = clusters.map(c => new Date(c.endTime).getTime());
    let min = Math.min(...starts);
    let max = Math.max(...ends);
    if (min === max) max = min + 1000 * 60 * 60; // avoid zero-width range
    return { minTime: min, maxTime: max };
  }, [clusters]);

  const maxCount = Math.max(1, ...clusters.map(c => c.articleCount));

  const pct = (t) => {
    const range = maxTime - minTime;
    return range === 0 ? 0 : ((new Date(t).getTime() - minTime) / range) * 100;
  };

  if (clusters.length === 0) {
    return <div className="empty-state">No clusters yet — trigger a refresh to pull in news.</div>;
  }

  return (
    <div className="timeline">
      <div className="timeline-axis">
        <span>{new Date(minTime).toLocaleString()}</span>
        <span>{new Date(maxTime).toLocaleString()}</span>
      </div>
      <div className="timeline-rows">
        {clusters.map((c) => {
          const left = pct(c.startTime);
          const width = Math.max(1.5, pct(c.endTime) - left);
          const barHeight = 16 + Math.round((c.articleCount / maxCount) * 24); // bigger cluster = taller bar
          const isSelected = c.clusterId === selectedClusterId;
          return (
            <div className="timeline-row" key={c.clusterId}>
              <div className="timeline-row-label" title={c.label}>{c.label}</div>
              <div className="timeline-track">
                <button
                  className={`timeline-bar${isSelected ? ' selected' : ''}`}
                  style={{ left: `${left}%`, width: `${width}%`, height: `${barHeight}px` }}
                  onClick={() => onSelectCluster(c.clusterId)}
                  title={`${c.articleCount} article(s)`}
                >
                  {c.articleCount}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
