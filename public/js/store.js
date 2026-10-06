// App state plus the actions that change it.
//
// UI modules read `state` directly and subscribe with `on(event, fn)` to hear about changes:
//   'entry'   (date) – a day's icon/label was set or cleared
//   'note'    (date) – a day gained or lost a journal entry
//   'select'  (date) – the journal now shows this day
//   'focus'   ()     – the popover/editor day changed (used to redraw selection rings)

import { api } from './api.js';
import { DEFAULT_RECENT_ICONS } from './constants.js';
import { todayKey } from './dates.js';

export const state = {
  entries: {},              // date -> { icon, color, label }
  noteDates: new Set(),     // dates that have a journal entry
  recentIcons: [...DEFAULT_RECENT_ICONS],
  selectedDate: todayKey(), // day shown in the journal
  popoverDate: null,        // day with the quick-entry popover open
  editorDate: null,         // day open in the editor panel
};

// ---- Tiny event bus ------------------------------------------------------

const listeners = {};

export function on(event, fn) {
  (listeners[event] ||= []).push(fn);
}

function emit(event, payload) {
  (listeners[event] || []).forEach(fn => fn(payload));
}

// ---- Loading -------------------------------------------------------------

export async function loadAll() {
  const [{ days, recentIcons }, { dates }] = await Promise.all([api.listDays(), api.listJournalDates()]);

  for (const { date, icon, color, label } of days) state.entries[date] = { icon, color, label };
  state.noteDates = new Set(dates);

  // Fill "recent" up to 7 with defaults the user hasn't used yet.
  const defaults = DEFAULT_RECENT_ICONS.filter(icon => !recentIcons.includes(icon));
  state.recentIcons = [...recentIcons, ...defaults].slice(0, 7);
}

// ---- Day entries ---------------------------------------------------------

// Saves are debounced per day so typing a label doesn't send a request per keystroke.
const pendingSaves = new Map(); // date -> timer

function queueSave(date) {
  clearTimeout(pendingSaves.get(date));
  pendingSaves.set(date, setTimeout(() => saveDay(date), 300));
}

function saveDay(date, options) {
  clearTimeout(pendingSaves.get(date));
  pendingSaves.delete(date);
  const entry = state.entries[date];
  const request = entry ? api.saveDay(date, entry, options) : api.deleteDay(date, options);
  request.catch(err => console.error('Could not save day', date, err));
}

// Send anything still waiting when the tab is closed.
window.addEventListener('pagehide', () => {
  for (const date of [...pendingSaves.keys()]) saveDay(date, { keepalive: true });
});

/** Sets a day's entry. Passing null, or an entry without an icon, clears the day. */
export function setEntry(date, entry) {
  if (entry && entry.icon) {
    state.entries[date] = { icon: entry.icon, color: entry.color || 'black', label: entry.label || '' };
    state.recentIcons = [entry.icon, ...state.recentIcons.filter(i => i !== entry.icon)].slice(0, 7);
  } else {
    delete state.entries[date];
  }
  queueSave(date);
  emit('entry', date);
}

export function markedCount() {
  const today = todayKey();
  return Object.keys(state.entries).filter(date => date <= today).length;
}

// ---- Selection -----------------------------------------------------------

export function selectDate(date) {
  if (state.selectedDate === date) return;
  state.selectedDate = date;
  emit('select', date);
}

export function setPopoverDate(date) {
  state.popoverDate = date;
  emit('focus');
}

export function setEditorDate(date) {
  state.editorDate = date;
  emit('focus');
}

// ---- Journal -------------------------------------------------------------

export function setHasNote(date, hasNote) {
  if (state.noteDates.has(date) === hasNote) return;
  if (hasNote) state.noteDates.add(date);
  else state.noteDates.delete(date);
  emit('note', date);
}
