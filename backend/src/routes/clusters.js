const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /clusters — label, article count, time range for every cluster
router.get('/', (req, res) => {
  try {
    const clusters = db.prepare(`
      SELECT
        c.id,
        c.label,
        COUNT(a.id) AS article_count,
        MIN(a.published_at) AS earliest,
        MAX(a.published_at) AS latest
      FROM clusters c
      LEFT JOIN articles a ON a.cluster_id = c.id
      GROUP BY c.id
      HAVING article_count > 0
      ORDER BY latest DESC
    `).all();
    res.json({ clusters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load clusters' });
  }
});

// GET /clusters/:id — full detail, articles sorted chronologically
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid cluster id' });
  }
  try {
    const cluster = db.prepare('SELECT id, label, keywords FROM clusters WHERE id = ?').get(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }
    const articles = db.prepare(`
      SELECT id, source, title, summary, url, published_at
      FROM articles
      WHERE cluster_id = ?
      ORDER BY published_at ASC
    `).all(id);
    res.json({ cluster: { ...cluster, keywords: JSON.parse(cluster.keywords || '[]') }, articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load cluster detail' });
  }
});

module.exports = router;
