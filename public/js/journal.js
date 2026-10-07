// The journal panel on the left: a markdown journal entry for the selected day.
// Edits autosave a moment after you stop typing.

import { api } from './api.js';
import { PALETTE } from './constants.js';
import { formatDay } from './dates.js';
import { renderMarkdown } from './markdown.js';
import { on, setHasNote, state } from './store.js';

const iconEl = document.getElementById('journal-icon');
const dateEl = document.getElementById('journal-date');
const titleInput = document.getElementById('journal-title');
const bodyInput = document.getElementById('journal-body');
const writeView = document.getElementById('journal-write-view');
const previewView = document.getElementById('journal-preview-view');
const writeTab = document.getElementById('journal-write');
const previewTab = document.getElementById('journal-preview');
const wordsEl = document.getElementById('journal-words');
const statusEl = document.getElementById('journal-status');
const panel = document.querySelector('.journal');
const toggleButton = document.getElementById('journal-toggle');

// On small screens the journal sits under the calendar, so it folds up and down instead.
const stacked = window.matchMedia('(max-width: 860px)');
const COLLAPSED_KEY = 'dot-diary:journal-collapsed';

const SAVE_DELAY_MS = 600;

// Markdown toolbar: [icon, tooltip, action]
const TOOLBAR = [
  ['format_bold', 'Bold', 'bold'],
  ['format_italic', 'Italic', 'italic'],
  ['title', 'Heading', 'heading'],
  ['format_list_bulleted', 'List', 'list'],
  ['check_box', 'Checklist', 'task'],
  ['format_quote', 'Quote', 'quote'],
  ['code', 'Code', 'code'],
  ['link', 'Link', 'link'],
];
const WRAPS = { bold: ['**', '**', 'bold'], italic: ['*', '*', 'italic'], code: ['`', '`', 'code'], link: ['[', '](https://)', 'link'] };
const LINE_PREFIXES = { heading: '## ', list: '- ', task: '- [ ] ', quote: '> ' };

let date = null;                       // day currently loaded
let entry = { title: '', body: '' };
let saveTimer = null;

export function initJournal() {
  buildToolbar();

  titleInput.addEventListener('input', () => change({ title: titleInput.value }));
  bodyInput.addEventListener('input', () => change({ body: bodyInput.value }));
  writeTab.addEventListener('click', () => setView('write'));
  previewTab.addEventListener('click', () => setView('preview'));
  toggleButton.addEventListener('click', () => setCollapsed(!panel.classList.contains('is-collapsed')));
  stacked.addEventListener('change', paintToggle);
  setCollapsed(readCollapsed());

  on('select', load);
  on('entry', changedDate => changedDate === date && paintHeader());

  // Don't lose the last few keystrokes when the tab is closed.
  window.addEventListener('pagehide', () => saveNow({ keepalive: true }));

  load(state.selectedDate);
}

// ---- Loading & saving ----------------------------------------------------

async function load(newDate) {
  saveNow();
  date = newDate;
  paintHeader();

  titleInput.readOnly = bodyInput.readOnly = true;
  const { title, body } = await api.getJournal(newDate);
  if (date !== newDate) return; // another day was picked meanwhile

  entry = { title, body };
  titleInput.value = title;
  bodyInput.value = body;
  titleInput.readOnly = bodyInput.readOnly = false;
  statusEl.textContent = 'Autosaves';
  paintBody();
}

function change(patch) {
  entry = { ...entry, ...patch };
  setHasNote(date, Boolean(entry.title.trim() || entry.body.trim()));
  statusEl.textContent = 'Saving…';
  paintBody();

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(), SAVE_DELAY_MS);
}

/** Saves right away if there are unsaved changes. */
function saveNow(options) {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;

  const savingDate = date;
  api.saveJournal(savingDate, entry, options)
    .then(() => { if (date === savingDate && !saveTimer) statusEl.textContent = 'Saved'; })
    .catch(err => {
      console.error(err);
      if (date === savingDate) statusEl.textContent = 'Could not save';
    });
}

// ---- Painting ------------------------------------------------------------

function paintHeader() {
  const dayEntry = state.entries[date];
  iconEl.textContent = dayEntry ? dayEntry.icon : 'circle';
  iconEl.style.color = dayEntry ? PALETTE[dayEntry.color] : '';
  dateEl.textContent = formatDay(date);
}

function paintBody() {
  const words = (entry.body.trim().match(/\S+/g) || []).length;
  wordsEl.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  if (!previewView.hidden) previewView.innerHTML = renderMarkdown(entry.body);
}

function setView(view) {
  const preview = view === 'preview';
  writeView.hidden = preview;
  previewView.hidden = !preview;
  writeTab.classList.toggle('active', !preview);
  previewTab.classList.toggle('active', preview);
  paintBody();
}

// ---- Collapsing ----------------------------------------------------------

function setCollapsed(collapsed) {
  panel.classList.toggle('is-collapsed', collapsed);
  toggleButton.setAttribute('aria-expanded', String(!collapsed));
  paintToggle();
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '');
  } catch {
    // Storage can be blocked; the panel still works, it just won't remember.
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function paintToggle() {
  const collapsed = panel.classList.contains('is-collapsed');
  if (stacked.matches) toggleButton.textContent = collapsed ? 'expand_more' : 'expand_less';
  else toggleButton.textContent = collapsed ? 'left_panel_open' : 'left_panel_close';
  const label = collapsed ? 'Show journal' : 'Hide journal';
  toggleButton.title = label;
  toggleButton.setAttribute('aria-label', label);
}

// ---- Markdown toolbar ----------------------------------------------------

function buildToolbar() {
  const toolbar = document.getElementById('md-toolbar');
  for (const [icon, label, action] of TOOLBAR) {
    const button = document.createElement('button');
    button.className = 'icon';
    button.title = label;
    button.textContent = icon;
    // mousedown + preventDefault keeps the textarea's selection intact
    button.addEventListener('mousedown', event => {
      event.preventDefault();
      applyFormat(action);
    });
    toolbar.append(button);
  }
}

/** Wraps the selection (bold, links…) or prefixes the current line (lists, quotes…). */
function applyFormat(action) {
  const text = bodyInput.value;
  const start = bodyInput.selectionStart;
  const end = bodyInput.selectionEnd;
  let result, selStart, selEnd;

  if (WRAPS[action]) {
    const [before, after, placeholder] = WRAPS[action];
    const inner = text.slice(start, end) || placeholder;
    result = text.slice(0, start) + before + inner + after + text.slice(end);
    selStart = start + before.length;
    selEnd = selStart + inner.length;
  } else {
    const prefix = LINE_PREFIXES[action];
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    result = text.slice(0, lineStart) + prefix + text.slice(lineStart);
    selStart = start + prefix.length;
    selEnd = end + prefix.length;
  }

  bodyInput.value = result;
  bodyInput.focus();
  bodyInput.setSelectionRange(selStart, selEnd);
  change({ body: result });
}
