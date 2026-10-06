// Entry point: loads data, starts each part of the UI and wires them together.

import { initCalendar, scrollToDate } from './calendar.js';
import { todayKey } from './dates.js';
import { closeEditor, initEditor, isEditorOpen, openEditor } from './editor.js';
import { initJournal } from './journal.js';
import { closePopover, initPopover, togglePopover } from './popover.js';
import { loadAll, markedCount, on, selectDate } from './store.js';
import { initYearPicker, setActiveYear } from './year-picker.js';

await loadAll();

initCalendar({ onDayClick, onActiveYear: setActiveYear });
initYearPicker();
initPopover();
initEditor();
initJournal();

// Clicking a day shows its journal, and either opens the quick popover
// or, if the editor panel is already open, switches the editor to that day.
function onDayClick(date) {
  selectDate(date);
  if (isEditorOpen()) openEditor(date);
  else togglePopover(date);
}

// "N days marked" in the top bar
const markedEl = document.getElementById('marked-count');
const paintMarked = () => (markedEl.textContent = `${markedCount()} days marked`);
on('entry', paintMarked);
paintMarked();

document.getElementById('today-button').addEventListener('click', () => scrollToDate(todayKey()));

// Clicking outside the popover closes it.
document.addEventListener('mousedown', event => {
  if (!event.target.closest('[data-pop], .cell, [data-panel]')) closePopover();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  closePopover();
  closeEditor();
});

// Start centred on today once the icon font has loaded (it changes cell sizes).
document.fonts.ready.then(() => scrollToDate(todayKey(), 'auto'));
