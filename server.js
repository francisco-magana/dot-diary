// Dot Diary – a tiny Express server that serves the app and a JSON API backed by SQLite.

import express from 'express';
import daysRouter from './src/routes/days.js';
import journalRouter from './src/routes/journal.js';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.use('/api/days', daysRouter);
app.use('/api/journal', journalRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Dot Diary running at http://localhost:${PORT}`);
});
