// GET/POST /api/wiki — Wiki entries list and creation

import { parseJsonField, jsonField, parsePagination, hasDB } from '../lib/d1-client.js';
import { buildDocVector, extractWikiLinks } from '../lib/wiki-engine.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '';
  const { limit, offset } = parsePagination(url);

  try {
    if (!hasDB(env)) return Response.json([]);

    let results;
    if (category) {
      const { results: r } = await env.DB.prepare(
        'SELECT id, title, category, tags_json, source_url, source_title, created_at, updated_at, substr(content, 1, 200) as snippet FROM wiki_entries WHERE category = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(category, limit, offset).all();
      results = r;
    } else {
      const { results: r } = await env.DB.prepare(
        'SELECT id, title, category, tags_json, source_url, source_title, created_at, updated_at, substr(content, 1, 200) as snippet FROM wiki_entries ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all();
      results = r;
    }
    return Response.json((results || []).map(r => ({ ...r, tags: parseJsonField(r.tags_json, []) })));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { title, content, category = 'general', tags = [], source_url = '', source_title = '' } = body;
    if (!title || !content) return Response.json({ error: '标题和内容不能为空' }, { status: 400 });
    if (!hasDB(env)) return Response.json({ error: '数据库未配置' }, { status: 503 });

    const { totalDocs } = await env.DB.prepare('SELECT COUNT(*) as totalDocs FROM wiki_entries').first() || { totalDocs: 0 };
    const vector = buildDocVector(title, content, { totalDocs: (totalDocs || 0) + 1, docFreq: {} });
    const result = await env.DB.prepare(
      'INSERT INTO wiki_entries (title, content, category, tags_json, source_url, source_title, vector_tfidf) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, content, category, jsonField(tags), source_url, source_title, JSON.stringify(vector)).run();

    const links = extractWikiLinks(content);
    for (const linkTitle of links) {
      const target = await env.DB.prepare('SELECT id FROM wiki_entries WHERE title = ?').bind(linkTitle).first();
      if (target) {
        await env.DB.prepare('INSERT OR IGNORE INTO wiki_links (source_id, target_id) VALUES (?, ?)').bind(result.meta.last_row_id, target.id).run();
      }
    }
    return Response.json({ id: result.meta.last_row_id, title, category, tags, links_found: links.length }, { status: 201 });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE constraint')) return Response.json({ error: '该标题已存在' }, { status: 409 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
