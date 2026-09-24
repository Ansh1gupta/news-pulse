const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { createJob, appendLog, finishJob, getJob } = require("../jobs");

const PYTHON_BIN = process.env.PYTHON_BIN || "python3";

// Scraper is a sibling directory of backend at the repo root:
// news-pulse/
//   backend/src/routes/ingest.js  <- __dirname
//   scraper/
//   data/
// __dirname is backend/src/routes, so three levels up reaches the repo
// root (news-pulse/), then into scraper/.
const SCRAPER_DIR = path.resolve(__dirname, "..", "..", "..", "scraper");

// POST /ingest/trigger
// Runs the Python scrape + cluster pipeline as a subprocess
// and immediately returns a job ID for polling.
router.post("/trigger", (req, res) => {
  const jobId = uuidv4();
  createJob(jobId);

  const proc = spawn(PYTHON_BIN, ["pipeline.py"], {
    cwd: SCRAPER_DIR
  });

  proc.stdout.on("data", (data) => {
    appendLog(jobId, data.toString());
  });

  proc.stderr.on("data", (data) => {
    appendLog(jobId, data.toString());
  });

  proc.on("error", (err) => {
    appendLog(jobId, `\nFailed to start pipeline: ${err.message}`);
    finishJob(jobId, false, null);
  });

  proc.on("close", (code) => {
    finishJob(jobId, code === 0, { exitCode: code });
  });

  res.status(202).json({ jobId, status: "running" });
});

// GET /ingest/status/:jobId
// Lets the frontend poll the status of an ingestion job.
router.get("/status/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

module.exports = router;