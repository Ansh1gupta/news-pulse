require('dotenv').config();
const express = require('express');
const cors = require('cors');

const clustersRouter = require('./routes/clusters');
const timelineRouter = require('./routes/timeline');
const ingestRouter = require('./routes/ingest');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/debug/python', require('./routes/debug'));

app.use('/clusters', clustersRouter);
app.use('/timeline', timelineRouter);
app.use('/ingest', ingestRouter);

// 404 for anything else
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler â€” makes sure a thrown error becomes a 500, not a crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`News Pulse API listening on port ${PORT}`));
