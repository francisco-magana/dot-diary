// /api/days – the icon + short text marked on each day.

import { Router } from 'express';
import * as db from '../db.js';
import { isValidColor, isValidIcon, MAX_LABEL_LENGTH, requireDateParam } from '../validate.js';

const router = Router();

// All marked days, plus the most recently used icons for the picker.
router.get('/', (req, res) => {
  res.json({ days: db.listDays(), recentIcons: db.recentIcons() });
});

router.put('/:date', requireDateParam, (req, res) => {
  const { icon, color = 'black', label = '' } = req.body ?? {};

  if (!isValidIcon(icon)) return res.status(400).json({ error: 'Invalid icon' });
  if (!isValidColor(color)) return res.status(400).json({ error: 'Invalid color' });
  if (typeof label !== 'string') return res.status(400).json({ error: 'Label must be text' });

  const day = { icon, color, label: label.trim().slice(0, MAX_LABEL_LENGTH) };
  db.saveDay(req.params.date, day);
  res.json({ date: req.params.date, ...day });
});

router.delete('/:date', requireDateParam, (req, res) => {
  db.deleteDay(req.params.date);
  res.status(204).end();
});

export default router;
