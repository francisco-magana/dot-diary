// Small input checks shared by the API routes.

export const COLORS = ['black', 'red', 'green', 'blue', 'gray', 'orange', 'yellow'];
export const MAX_LABEL_LENGTH = 80;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ICON_RE = /^[a-z0-9_]{1,40}$/;

export function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isValidIcon(value) {
  return typeof value === 'string' && ICON_RE.test(value);
}

export function isValidColor(value) {
  return COLORS.includes(value);
}

/** Express middleware: rejects requests whose :date param is not a real YYYY-MM-DD date. */
export function requireDateParam(req, res, next) {
  if (!isValidDate(req.params.date)) {
    return res.status(400).json({ error: 'Date must be a valid YYYY-MM-DD date' });
  }
  next();
}
