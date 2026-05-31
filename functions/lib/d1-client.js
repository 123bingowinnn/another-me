// D1 database helper utilities

export function hasDB(env) {
  return !!(env && env.DB && typeof env.DB.prepare === 'function');
}

export function jsonField(value, fallback = []) {
  if (value == null) return JSON.stringify(fallback);
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(fallback);
    }
  }
  return JSON.stringify(value);
}

export function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Escape FTS5 query special characters
export function escapeFTS(str) {
  return str.replace(/["'*()^~]/g, ' ').trim();
}

// Pagination helper
export function parsePagination(url) {
  const q = url.searchParams;
  const limit = Math.min(parseInt(q.get('limit')) || 20, 100);
  const offset = Math.max(parseInt(q.get('offset')) || 0, 0);
  return { limit, offset };
}
