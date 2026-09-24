const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const clusterRows = db.prepare(`SELECT id, label FROM clusters`).all();

    const articleRows = db.prepare(`
      SELECT cluster_id, source, published_at
      FROM articles
      WHERE cluster_id IS NOT NULL
      ORDER BY published_at ASC
    `).all();

    const articlesByCluster = {};
    for (const a of articleRows) {
      if (!articlesByCluster[a.cluster_id]) articlesByCluster[a.cluster_id] = [];
      articlesByCluster[a.cluster_id].push({ source: a.source, publishedAt: a.published_at });
    }

    const timeline = clusterRows
      .map((c) => {
        const articles = articlesByCluster[c.id] || [];
        if (articles.length === 0) return null;
        return {
          clusterId: c.id,
          label: c.label,
          articles, // [{ source, publishedAt }] — frontend derives filtered span/count from this
          sources: Array.from(new Set(articles.map((a) => a.source))),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.articles[0].publishedAt.localeCompare(b.articles[0].publishedAt));

    res.json({ timeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build timeline' });
  }
});

module.exports = router;