// The dot calendar: one section per year, each day drawn as a dot or an icon.
//
// Days are rendered once and then "painted" again individually when their entry,
// journal note or selection changes, so the grid never has to be rebuilt.

import { GRID_COLUMNS, PALETTE } from './constants.js';
import { formatDay, toKey, todayKey, yearOf } from './dates.js';
import { on, state } from './store.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const scroller = document.getElementById('calendar-scroll');
const yearsEl = document.getElementById('years');
const earlierButton = document.getElementById('show-earlier');
const laterButton = document.getElementById('show-later');

/** The years currently drawn, inclusive. */
export const range = { min: 0, max: 0 };

let activeYear = null;
let onActiveYearChange = () => {};

export function initCalendar({ onDayClick, onActiveYear }) {
  onActiveYearChange = onActiveYear;

  const current = yearOf(todayKey());
  range.min = current - 1;
  range.max = current + 1;

  // The CSS sizes cells from the column count so the grid fits the space available.
  document.querySelector('.calendar').style.setProperty('--columns', GRID_COLUMNS);
  renderWeekHead();
  for (let year = range.min; year <= range.max; year++) yearsEl.append(buildYear(year));
  updateMoreButtons();

  earlierButton.addEventListener('click', () => addYear('earlier'));
  laterButton.addEventListener('click', () => addYear('later'));

  yearsEl.addEventListener('click', event => {
    const cell = event.target.closest('.cell[data-date]');
    if (cell && !event.target.closest('[data-pop]')) onDayClick(cell.dataset.date);
  });
  scroller.addEventListener('scroll', trackActiveYear, { passive: true });

  on('entry', date => {
    const before = markLook(date);
    paintDay(date);
    paintYearCount(yearOf(date));
    // Typing a label also saves the day, so only a new icon or color gets the jelly.
    if (state.entries[date] && markLook(date) !== before) playJelly(date);
  });
  on('note', paintDay);
  on('focus', paintSelection);
}

/** Returns the cell element for a day, if that year is drawn. */
export function cellFor(date) {
  return document.getElementById(`d-${date}`);
}

// ---- Building ------------------------------------------------------------

function renderWeekHead() {
  const head = document.getElementById('week-head');
  for (let i = 0; i < GRID_COLUMNS; i++) {
    const letter = document.createElement('span');
    letter.textContent = WEEKDAY_LETTERS[i % 7];
    head.append(letter);
  }
}

function buildYear(year) {
  const section = document.createElement('div');
  section.className = 'year';
  section.id = `y-${year}`;
  section.dataset.year = year;
  section.innerHTML = `<div class="year-title"><strong>${year}</strong><span class="mono" data-count></span></div>`;

  // Weeks start on Monday, so pad the first row with empty cells.
  const leadingBlanks = (new Date(year, 0, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: leadingBlanks }, () => createElement('div', 'cell'));

  for (let day = new Date(year, 0, 1); day.getFullYear() === year; day.setDate(day.getDate() + 1)) {
    const cell = createDayCell(toKey(day));
    if (day.getDate() === 1) cell.dataset.month = MONTHS[day.getMonth()];
    paintCell(cell);
    cells.push(cell);
  }

  for (let i = 0; i < cells.length; i += GRID_COLUMNS) {
    const rowCells = cells.slice(i, i + GRID_COLUMNS);
    const label = createElement('div', 'row-label');
    label.textContent = rowCells.find(cell => cell.dataset.month)?.dataset.month ?? '';

    const row = createElement('div', 'row');
    row.append(label, ...rowCells);
    section.append(row);
  }

  paintYearCount(year, section);
  return section;
}

function createDayCell(date) {
  const cell = createElement('div', 'cell');
  cell.id = `d-${date}`;
  cell.dataset.date = date;
  cell.innerHTML = `
    <span class="mark"></span>
    <span class="note-bar"></span>
    <div class="tip"><span class="tip-date"></span><span class="tip-label"></span></div>`;
  return cell;
}

function createElement(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

// ---- Painting ------------------------------------------------------------

function paintDay(date) {
  const cell = cellFor(date);
  if (cell) paintCell(cell);
}

function paintCell(cell) {
  const date = cell.dataset.date;
  const entry = state.entries[date];
  const today = todayKey();

  cell.classList.toggle('has-entry', Boolean(entry));
  cell.classList.toggle('has-note', state.noteDates.has(date));
  cell.classList.toggle('is-today', date === today);
  cell.classList.toggle('is-future', date > today);
  cell.classList.toggle('is-selected', date === state.popoverDate || date === state.editorDate);
  cell.classList.toggle('is-popped', date === state.popoverDate);

  const mark = cell.querySelector('.mark');
  mark.className = entry ? 'mark icon' : 'mark dot';
  mark.textContent = entry ? entry.icon : '';
  mark.style.color = entry ? PALETTE[entry.color] : '';

  cell.querySelector('.tip-date').textContent = formatDay(date);
  cell.querySelector('.tip-label').textContent = entry ? entry.label || 'Untitled' : '';
}

/** The icon and color a day's mark is showing, to tell when they change. */
function markLook(date) {
  const mark = cellFor(date)?.querySelector('.mark');
  return mark ? `${mark.textContent} ${mark.style.color}` : '';
}

function playJelly(date) {
  const mark = cellFor(date)?.querySelector('.mark');
  if (!mark) return;
  mark.classList.remove('is-jelly');
  void mark.offsetWidth; // restart the animation if it is still playing
  mark.classList.add('is-jelly');
  mark.addEventListener('animationend', () => mark.classList.remove('is-jelly'), { once: true });
}

// Days that currently have a selection ring, so we can clear it when focus moves.
let ringedDates = [];

function paintSelection() {
  const focused = [state.popoverDate, state.editorDate].filter(Boolean);
  new Set([...ringedDates, ...focused]).forEach(paintDay);
  ringedDates = focused;
}

function paintYearCount(year, section = document.getElementById(`y-${year}`)) {
  if (!section) return;
  const count = Object.keys(state.entries).filter(date => yearOf(date) === year).length;
  section.querySelector('[data-count]').textContent = `${count} marked`;
}

function updateMoreButtons() {
  earlierButton.textContent = `Show ${range.min - 1}`;
  laterButton.textContent = `Show ${range.max + 1}`;
}

// ---- Adding years & scrolling --------------------------------------------

function addYear(direction) {
  if (direction === 'earlier') {
    // Keep the view steady while content is inserted above it.
    const heightBefore = scroller.scrollHeight;
    range.min -= 1;
    yearsEl.prepend(buildYear(range.min));
    scroller.scrollTop += scroller.scrollHeight - heightBefore;
  } else {
    range.max += 1;
    yearsEl.append(buildYear(range.max));
  }
  updateMoreButtons();
}

/** Makes sure `year` is drawn, adding any years in between. */
function ensureYear(year) {
  while (year < range.min) addYear('earlier');
  while (year > range.max) addYear('later');
}

export function scrollToYear(year, behavior = 'smooth') {
  ensureYear(year);
  const section = document.getElementById(`y-${year}`);
  scroller.scrollTo({ top: offsetInScroller(section) - 10, behavior });
}

export function scrollToDate(date, behavior = 'smooth') {
  ensureYear(yearOf(date));
  const cell = cellFor(date);
  scroller.scrollTo({ top: offsetInScroller(cell) - scroller.clientHeight / 2, behavior });
}

function offsetInScroller(element) {
  return element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

/** The "active" year is the last one whose title is above the middle of the view. */
function trackActiveYear() {
  const middle = scroller.getBoundingClientRect().top + scroller.clientHeight / 2;
  let year = range.min;
  for (const section of yearsEl.children) {
    if (section.getBoundingClientRect().top < middle) year = Number(section.dataset.year);
  }
  if (year !== activeYear) {
    activeYear = year;
    onActiveYearChange(year);
  }
}
