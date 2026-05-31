// GET /api/wiki/tags — Tag cloud
import { parseJsonField, hasDB } from '../../lib/d1-client.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!hasDB(env)) return Response.json([]);
    const { results } = await env.DB.prepare('SELECT tags_json FROM wiki_entries').all();
    const counts = {};
    (results || []).forEach(r => {
      (parseJsonField(r.tags_json, [])).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    return Response.json(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })));
  } catch (e) {
    return Response.json([]);
  }
}
