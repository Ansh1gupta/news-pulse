const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

async function request(path, opts) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const getTimeline = () => request('/timeline');
export const getClusterDetail = (id) => request(`/clusters/${id}`);
export const triggerIngest = () => request('/ingest/trigger', { method: 'POST' });
export const getIngestStatus = (jobId) => request(`/ingest/status/${jobId}`);
