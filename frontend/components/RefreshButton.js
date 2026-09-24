import { useState, useRef } from 'react';
import { triggerIngest, getIngestStatus } from '../lib/api';

export default function RefreshButton({ onComplete }) {
  const [status, setStatus] = useState('idle'); // idle | running | done | failed
  const pollRef = useRef(null);

  const handleClick = async () => {
    setStatus('running');
    try {
      const { jobId } = await triggerIngest();
      pollRef.current = setInterval(async () => {
        try {
          const job = await getIngestStatus(jobId);
          if (job.status === 'done' || job.status === 'failed') {
            clearInterval(pollRef.current);
            setStatus(job.status);
            if (job.status === 'done') onComplete();
          }
        } catch (e) {
          clearInterval(pollRef.current);
          setStatus('failed');
        }
      }, 2000);
    } catch (e) {
      setStatus('failed');
    }
  };

  const labels = {
    idle: 'Refresh data',
    running: 'Refreshing… (this can take a minute)',
    done: 'Refresh complete ✓',
    failed: 'Refresh failed — try again',
  };

  return (
    <button className="refresh-btn" onClick={handleClick} disabled={status === 'running'}>
      {labels[status]}
    </button>
  );
}
