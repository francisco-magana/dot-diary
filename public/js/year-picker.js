// The year stepper in the top bar: ‹ 2026 ›
// The arrows jump to the previous/next year; the year can also be typed, then Enter.

import { scrollToYear } from './calendar.js';
import { todayKey, yearOf } from './dates.js';

const input = document.getElementById('year-input');
const prevButton = document.getElementById('year-prev');
const nextButton = document.getElementById('year-next');

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

let activeYear = yearOf(todayKey());

// While a jump's smooth scroll is running, the calendar passes through the years in
// between; ignore those so quick repeated clicks keep counting from the target year.
let jumpingUntil = 0;

export function initYearPicker() {
  showYear();

  prevButton.addEventListener('click', () => jumpTo(activeYear - 1));
  nextButton.addEventListener('click', () => jumpTo(activeYear + 1));

  input.addEventListener('focus', () => input.select());
  input.addEventListener('input', () => (input.value = input.value.replace(/\D/g, '').slice(0, 4)));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      if (input.value.length === 4) jumpTo(Number(input.value));
      input.blur();
    } else if (event.key === 'Escape') {
      input.blur();
    }
  });
  input.addEventListener('blur', showYear); // drop half-typed input
}

/** Called by the calendar as the user scrolls. */
export function setActiveYear(year) {
  if (Date.now() < jumpingUntil) return;
  activeYear = year;
  showYear();
}

function jumpTo(year) {
  activeYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  jumpingUntil = Date.now() + 800;
  showYear();
  scrollToYear(activeYear);
}

function showYear() {
  if (document.activeElement !== input) input.value = activeYear;
  prevButton.disabled = activeYear <= MIN_YEAR;
  nextButton.disabled = activeYear >= MAX_YEAR;
}
