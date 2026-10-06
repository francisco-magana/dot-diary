// /api/journal – a longer markdown journal entry for any day.

import { Router } from 'express';
import * as db from '../db.js';
import { requireDateParam } from '../validate.js';

const router = Router();

// Dates that have a journal entry (used to draw the little "note" marker under a dot).
router.get('/', (req, res) => {
  res.json({ dates: db.listJournalDates() });
});

router.get('/:date', requireDateParam, (req, res) => {
  res.json(db.getJournal(req.params.date));
});

router.put('/:date', requireDateParam, (req, res) => {
  const { title = '', body = '' } = req.body ?? {};
  if (typeof title !== 'string' || typeof body !== 'string') {
    return res.status(400).json({ error: 'Title and body must be text' });
  }
  res.json(db.saveJournal(req.params.date, { title: title.slice(0, 200), body }));
});

export default router;
