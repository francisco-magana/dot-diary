// Thin wrapper around the server's JSON API.

// `options.keepalive` lets a request finish while the page is closing.
async function request(method, url, body, options = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    keepalive: options.keepalive,
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `${method} ${url} failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listDays: () => request('GET', '/api/days'),
  saveDay: (date, day, options) => request('PUT', `/api/days/${date}`, day, options),
  deleteDay: (date, options) => request('DELETE', `/api/days/${date}`, null, options),

  listJournalDates: () => request('GET', '/api/journal'),
  getJournal: date => request('GET', `/api/journal/${date}`),
  saveJournal: (date, entry, options) => request('PUT', `/api/journal/${date}`, entry, options),
};
