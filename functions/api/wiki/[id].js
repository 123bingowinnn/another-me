// GET/PUT/DELETE /api/wiki/:id — Single wiki entry

import { parseJsonField, jsonField, hasDB } from '../../lib/d1-client.js';
import { buildDocVector, extractWikiLinks } from '../../lib/wiki-engine.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    if (!hasDB(env)) return Response.json({ error: '数据库未配置' }, { status: 503 });
    const entry = await env.DB.prepare('SELECT * FROM wiki_entries WHERE id = ?').bind(parseInt(params.id)).first();
    if (!entry) return Response.json({ error: '条目不存在' }, { status: 404 });
    const { results: linked } = await env.DB.prepare(
      'SELECT w.id, w.title, w.category FROM wiki_entries w JOIN wiki_links l ON w.id = l.target_id WHERE l.source_id = ? UNION SELECT w.id, w.title, w.category FROM wiki_entries w JOIN wiki_links l ON w.id = l.source_id WHERE l.target_id = ?'
    ).bind(parseInt(params.id), parseInt(params.id)).all();
    return Response.json({ ...entry, tags: parseJsonField(entry.tags_json, []), linked_entries: linked || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    if (!hasDB(env)) return Response.json({ error: '数据库未配置' }, { status: 503 });
    const existing = await env.DB.prepare('SELECT * FROM wiki_entries WHERE id = ?').bind(parseInt(params.id)).first();
    if (!existing) return Response.json({ error: '条目不存在' }, { status: 404 });
    const { title, content, category, tags, source_url, source_title } = await request.json();
    await env.DB.prepare('UPDATE wiki_entries SET title=?, content=?, category=?, tags_json=?, source_url=?, source_title=?, updated_at=datetime(\'now\') WHERE id=?')
      .bind(title || existing.title, content || existing.content, category || existing.category,
            jsonField(tags || parseJsonField(existing.tags_json, [])),
            source_url || existing.source_url || '', source_title || existing.source_title || '', parseInt(params.id)).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    if (!hasDB(env)) return Response.json({ error: '数据库未配置' }, { status: 503 });
    await env.DB.prepare('DELETE FROM wiki_entries WHERE id = ?').bind(parseInt(params.id)).run();
    await env.DB.prepare('DELETE FROM wiki_links WHERE source_id = ? OR target_id = ?').bind(parseInt(params.id), parseInt(params.id)).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
