// The day editor panel on the right: big icon preview, label, color and the full icon picker.
// Every change is saved right away (the store debounces the network request).

import { ICON_CATEGORIES, PALETTE } from './constants.js';
import { formatDay } from './dates.js';
import { loadIcons, searchIcons } from './icon-library.js';
import { setEntry, setEditorDate, state } from './store.js';

// The tab after the curated categories shows every icon in the font.
const ALL_TAB = ICON_CATEGORIES.length;
const TABS = [...ICON_CATEGORIES.map(([name, icon]) => [name, icon]), ['All icons', 'apps']];

// Long lists (search results, "All") are shown a page at a time to keep the panel fast.
const PAGE_SIZE = 210;

const panel = document.getElementById('editor');
const dateEl = document.getElementById('editor-date');
const chipEl = document.getElementById('editor-chip');
const iconEl = document.getElementById('editor-icon');
const clearIconButton = document.getElementById('editor-clear-icon');
const labelInput = document.getElementById('editor-label');
const swatchesEl = document.getElementById('swatches');
const recentEl = document.getElementById('recent-icons');
const tabsEl = document.getElementById('category-tabs');
const categoryNameEl = document.getElementById('category-name');
const categoryIconsEl = document.getElementById('category-icons');
const bodyEl = document.getElementById('editor-body');
const browserHeadEl = document.getElementById('icon-browser-head');
const searchInput = document.getElementById('icon-search');
const showMoreButton = document.getElementById('show-more-icons');

let draft = { icon: null, color: 'black', label: '' };
let categoryIndex = 1; // "People"
let query = '';
let shownCount = PAGE_SIZE;
let listRequest = 0; // guards against an older async search finishing last

export function initEditor() {
  document.getElementById('editor-done').addEventListener('click', closeEditor);
  document.getElementById('editor-clear-day').addEventListener('click', () => {
    setEntry(state.editorDate, null);
    closeEditor();
  });
  clearIconButton.addEventListener('click', () => update({ icon: null }));
  labelInput.addEventListener('input', () => update({ label: labelInput.value }, { rerender: false }));

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    showList({ resetScroll: true });
  });
  showMoreButton.addEventListener('click', () => {
    shownCount += PAGE_SIZE;
    renderIconList();
  });
}

export function openEditor(date) {
  const entry = state.entries[date];
  draft = entry ? { ...entry } : { icon: null, color: 'black', label: '' };
  setEditorDate(date);
  panel.hidden = false;
  bodyEl.scrollTop = 0;
  labelInput.value = draft.label;
  query = searchInput.value = '';
  shownCount = PAGE_SIZE;
  render();
}

export function closeEditor() {
  if (!state.editorDate) return;
  panel.hidden = true;
  setEditorDate(null);
}

export function isEditorOpen() {
  return Boolean(state.editorDate);
}

/** Applies a change to the draft and saves it. A draft without an icon clears the day. */
function update(patch, { rerender = true } = {}) {
  draft = { ...draft, ...patch };
  setEntry(state.editorDate, draft);
  if (rerender) render();
}

// ---- Rendering -----------------------------------------------------------

function render() {
  dateEl.textContent = formatDay(state.editorDate);

  // Same icon in the header chip (like the journal) and the big preview.
  for (const el of [chipEl, iconEl]) {
    el.textContent = draft.icon || 'circle';
    el.style.color = draft.icon ? PALETTE[draft.color] : '';
  }
  clearIconButton.hidden = !draft.icon;

  swatchesEl.replaceChildren(...Object.entries(PALETTE).map(([name, color]) => {
    const button = document.createElement('button');
    button.className = name === draft.color ? 'active' : '';
    button.title = name;
    button.style.color = color;
    button.innerHTML = '<span style="background: currentColor"></span>';
    button.addEventListener('click', () => update({ color: name }));
    return button;
  }));

  recentEl.replaceChildren(...state.recentIcons.map(iconButton));

  renderTabs();
  renderIconList();
}

/** Switches what the icon list shows (after a search or tab change) and redraws it. */
function showList({ resetScroll = false } = {}) {
  shownCount = PAGE_SIZE;
  renderTabs();
  renderIconList();
  // Jump back to the first results, keeping the (sticky) search box where it is.
  if (resetScroll) bodyEl.scrollTop = Math.min(bodyEl.scrollTop, browserHeadEl.offsetTop);
}

function renderTabs() {
  tabsEl.replaceChildren(...TABS.map(([name, tabIcon], index) => {
    const tab = document.createElement('button');
    // While searching no tab is active: the results span every icon.
    tab.className = 'icon' + (!query.trim() && index === categoryIndex ? ' active' : '');
    tab.title = name;
    tab.textContent = tabIcon;
    tab.addEventListener('click', () => {
      categoryIndex = index;
      query = searchInput.value = '';
      showList({ resetScroll: true });
    });
    return tab;
  }));
}

/** Fills the icon grid with a search, the "All" tab, or one curated category. */
async function renderIconList() {
  const request = ++listRequest;
  let names;
  let heading;

  if (query.trim()) {
    names = await searchIcons(query);
    heading = `${names.length} ${names.length === 1 ? 'RESULT' : 'RESULTS'}`;
  } else if (categoryIndex === ALL_TAB) {
    names = (await loadIcons()).map(([name]) => name);
    heading = `ALL ICONS · ${names.length}`;
  } else {
    const [categoryName, , icons] = ICON_CATEGORIES[categoryIndex];
    names = icons;
    heading = categoryName.toUpperCase();
  }
  if (request !== listRequest) return; // a newer search already rendered

  categoryNameEl.textContent = heading;
  categoryIconsEl.replaceChildren(...names.slice(0, shownCount).map(iconButton));
  showMoreButton.hidden = names.length <= shownCount;

  if (names.length === 0) {
    categoryIconsEl.innerHTML = '<div class="no-results">No icons match. Try a simpler word.</div>';
  }
}

function iconButton(icon) {
  const selected = icon === draft.icon;
  const button = document.createElement('button');
  button.className = 'icon' + (selected ? ' active' : '');
  button.textContent = icon;
  button.title = icon.replace(/_/g, ' ');
  button.style.color = selected ? PALETTE[draft.color] : '';
  button.addEventListener('click', () => update({ icon }));
  return button;
}
