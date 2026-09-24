const { execSync } = require('child_process');
const fs = require('fs');

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
  res.json({
    PATH: process.env.PATH,
    PYTHON_BIN_env: process.env.PYTHON_BIN,
    which_python3: tryCmd('which python3'),
    which_python: tryCmd('which python'),
    ls_usr_bin_python: tryCmd('ls -la /usr/bin/ | grep -i python'),
    exists_usr_bin_python3: tryExists('/usr/bin/python3'),
    python3_version: tryCmd('python3 --version'),
  });
};