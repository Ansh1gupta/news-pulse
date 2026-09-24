const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function tryCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

function tryExists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

module.exports = function debugHandler(req, res) {
  const SCRAPER_DIR = path.resolve(__dirname, '..', '..', process.env.SCRAPER_DIR || '../scraper');
  res.json({
    PATH: process.env.PATH,
    PYTHON_BIN_env: process.env.PYTHON_BIN,
    which_python3: tryCmd('which python3'),
    computed_SCRAPER_DIR: SCRAPER_DIR,
    scraper_dir_exists: tryExists(SCRAPER_DIR),
    scraper_pipeline_exists: tryExists(path.join(SCRAPER_DIR, 'pipeline.py')),
    ls_app: tryCmd('ls -la /app'),
    ls_app_scraper: tryCmd('ls -la /app/scraper'),
  });
};