// Date helpers. Days are identified everywhere by a "YYYY-MM-DD" key in local time.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = n => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey() {
  return toKey(new Date());
}

export function yearOf(key) {
  return Number(key.slice(0, 4));
}

/** "2026-09-30 Wed · Today" */
export function formatDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${key} ${weekday}${key === todayKey() ? ' · Today' : ''}`;
}
