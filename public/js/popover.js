// Quick-entry popover shown when a day is clicked: type a few words, tap an icon, done.
// "…" opens the full editor panel for more icons and colors.

import { cellFor } from './calendar.js';
import { FALLBACK_ICON, GRID_COLUMNS } from './constants.js';
import { formatDay } from './dates.js';
import { openEditor } from './editor.js';
import { setEntry, setPopoverDate, state } from './store.js';

const popover = document.getElementById('popover');
const dateEl = document.getElementById('popover-date');
const labelInput = document.getElementById('popover-label');
const iconsEl = document.getElementById('popover-icons');
const clearButton = document.getElementById('popover-clear');

// What the user has typed/picked but not saved yet.
let draft = null;

export function initPopover() {
  document.getElementById('popover-close').addEventListener('click', closePopover);

  labelInput.addEventListener('input', () => (draft.label = labelInput.value));
  labelInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') save({ icon: draft.icon || FALLBACK_ICON });
  });

  clearButton.addEventListener('click', () => {
    setEntry(state.popoverDate, null);
    closePopover();
  });
}

export function togglePopover(date) {
  if (state.popoverDate === date) closePopover();
  else openPopover(date);
}

export function closePopover() {
  if (!state.popoverDate) return;
  popover.hidden = true;
  setPopoverDate(null);
}

function openPopover(date) {
  const entry = state.entries[date];
  draft = entry ? { ...entry } : { icon: null, color: 'black', label: '' };

  setPopoverDate(date);
  dateEl.textContent = formatDay(date);
  labelInput.value = draft.label;
  clearButton.hidden = !entry;
  renderIcons();

  const cell = cellFor(date);
  cell.append(popover);
  popover.hidden = false;
  position(cell);
  labelInput.focus();
}

function save(patch) {
  setEntry(state.popoverDate, { ...draft, ...patch });
  closePopover();
}

function renderIcons() {
  const buttons = state.recentIcons.slice(0, 6).map(icon => {
    const button = document.createElement('button');
    button.className = 'icon filled' + (icon === draft.icon ? ' active' : '');
    button.textContent = icon;
    button.addEventListener('click', () => save({ icon }));
    return button;
  });

  const more = document.createElement('button');
  more.className = 'icon more';
  more.title = 'All symbols';
  more.textContent = 'more_horiz';
  more.addEventListener('click', () => {
    const date = state.popoverDate;
    if (draft.icon) setEntry(date, draft); // keep any label typed so far
    closePopover();
    openEditor(date);
  });

  iconsEl.replaceChildren(...buttons, more);
}

/** Opens below the day when there isn't room above, and hugs the edge on the outer columns. */
function position(cell) {
  const scroller = document.getElementById('calendar-scroll');
  const spaceAbove = cell.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  const column = [...cell.parentElement.querySelectorAll('.cell')].indexOf(cell);

  let align = 'align-center';
  if (column < 3) align = 'align-left';
  else if (column > GRID_COLUMNS - 4) align = 'align-right';

  popover.className = `popover ${spaceAbove < popover.offsetHeight + 40 ? 'below' : 'above'} ${align}`;
}
