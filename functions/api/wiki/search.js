// GET /api/wiki/search?q=&top_k=5 — Wiki search

import { buildFTSQuery, rankByTFIDF } from '../../lib/wiki-engine.js';
import { parseJsonField, hasDB } from '../../lib/d1-client.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const topK = Math.min(parseInt(url.searchParams.get('top_k')) || 5, 20);

  if (!query) return Response.json({ query: '', results: [], took_ms: 0 });
  if (!hasDB(env)) return Response.json({ query, results: [], took_ms: 0 });

  const start = Date.now();

  try {
    // Try FTS5 first, fall back to LIKE
    let candidates;
    try {
      const ftsQuery = buildFTSQuery(query);
      if (ftsQuery) {
        const { results } = await env.DB.prepare(`
          SELECT w.id, w.title, w.category, w.tags_json, w.vector_tfidf, w.source_url, w.source_title,
                 snippet(wiki_fts, 1, '<mark>', '</mark>', '...', 40) AS snippet,
                 w.created_at, w.updated_at, rank
          FROM wiki_fts f JOIN wiki_entries w ON f.rowid = w.id
          WHERE wiki_fts MATCH ? ORDER BY rank LIMIT 20
        `).bind(ftsQuery).all();
        candidates = results;
      }
    } catch {
      candidates = null;
    }

    // Fallback: LIKE-based search
    if (!candidates || !candidates.length) {
      const likeQ = '%' + query.replace(/[%_]/g, '\\$&') + '%';
      const { results: r } = await env.DB.prepare(
        'SELECT id, title, category, tags_json, source_url, source_title, substr(content, 1, 300) as snippet, created_at, updated_at FROM wiki_entries WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT 20'
      ).bind(likeQ, likeQ).all();
      candidates = r;
    }

    if (!candidates || !candidates.length) {
      return Response.json({ query, results: [], took_ms: Date.now() - start });
    }

    const scored = candidates.length ? rankByTFIDF(query, candidates) : candidates;
    const results = scored.slice(0, topK).map(r => ({
      id: r.id, title: r.title, category: r.category, tags: parseJsonField(r.tags_json, []),
      snippet: r.snippet || '', score: Math.round((r.score || 1) * 100) / 100,
      source_url: r.source_url, created_at: r.created_at,
    }));

    return Response.json({ query, results, took_ms: Date.now() - start });
  } catch (e) {
    return Response.json({ query, results: [], took_ms: 0 });
  }
}
