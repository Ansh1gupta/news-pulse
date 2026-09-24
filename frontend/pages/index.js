import { useEffect, useMemo, useState, useCallback } from 'react';
import Timeline from '../components/Timeline';
import ClusterDetail from '../components/ClusterDetail';
import SourceFilter from '../components/SourceFilter';
import RefreshButton from '../components/RefreshButton';
import { getTimeline } from '../lib/api';

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedSources, setSelectedSources] = useState(new Set());

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { timeline } = await getTimeline();
      setClusters(timeline);
      setSelectedSources((prev) => {
        if (prev.size > 0) return prev;
        const all = new Set();
        timeline.forEach((c) => c.sources.forEach((s) => all.add(s)));
        return all;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const allSources = useMemo(() => {
    const set = new Set();
    clusters.forEach((c) => c.sources.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [clusters]);

  const toggleSource = (source) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source); else next.add(source);
      return next;
    });
  };

  const visibleClusters = useMemo(() => {
    return clusters
      .map((c) => {
        const filtered = (c.articles || []).filter((a) => selectedSources.has(a.source));
        if (filtered.length === 0) return null;
        const times = filtered.map((a) => new Date(a.publishedAt).getTime());
        return {
          ...c,
          articleCount: filtered.length,
          startTime: new Date(Math.min(...times)).toISOString(),
          endTime: new Date(Math.max(...times)).toISOString(),
        };
      })
      .filter(Boolean);
  }, [clusters, selectedSources]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>News Pulse</h1>
        <p className="subtitle">Topic-clustered news timeline</p>
        <RefreshButton onComplete={loadTimeline} />
      </header>

      {allSources.length > 0 && (
        <SourceFilter allSources={allSources} selectedSources={selectedSources} onToggle={toggleSource} />
      )}

      {loading && <p>Loading timelineÃ¢â‚¬Â¦</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <Timeline
          clusters={visibleClusters}
          onSelectCluster={setSelectedClusterId}
          selectedClusterId={selectedClusterId}
        />
      )}

      <ClusterDetail clusterId={selectedClusterId} selectedSources={selectedSources} onClose={() => setSelectedClusterId(null)} />
    </div>
  );
}