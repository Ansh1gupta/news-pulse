// In-memory job tracking for the ingest pipeline. A real production system
// would persist this (e.g. in the ingest_jobs table), but for a single
// backend instance in-memory is sufficient and keeps this simple.
const jobs = new Map();

function createJob(id) {
  jobs.set(id, { id, status: 'running', startedAt: new Date().toISOString(), log: '', finishedAt: null, result: null });
}

function appendLog(id, chunk) {
  const job = jobs.get(id);
  if (job) job.log += chunk;
}

function finishJob(id, success, result) {
  const job = jobs.get(id);
  if (!job) return;
  job.status = success ? 'done' : 'failed';
  job.finishedAt = new Date().toISOString();
  job.result = result || null;
}

function getJob(id) {
  return jobs.get(id) || null;
}

module.exports = { createJob, appendLog, finishJob, getJob };
