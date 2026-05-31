// POST /api/chat — AI chat with SSE streaming
// Proxies to Volcano Engine Ark API, stores messages in D1 (optional)

import { chatCompletionStream, chatCompletion, normalizeMessages } from '../lib/ark-client.js';
import { matchVideos } from '../lib/video-matcher.js';

async function getVideos(env, userContent) {
  try {
    if (!env?.DB) return [];
    const { results } = await env.DB.prepare('SELECT * FROM video_resources').all();
    return matchVideos(userContent, results || []);
  } catch {
    return [];
  }
}

async function storeMessage(env, sessionId, role, content, videosJson) {
  try {
    if (!env?.DB) return;
    await env.DB.prepare(
      'INSERT INTO chat_messages (session_id, role, content, videos_json) VALUES (?, ?, ?, ?)'
    ).bind(sessionId, role, content, videosJson).run();
  } catch { /* non-critical */ }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env?.ARK_API_KEY;

  if (!apiKey) {
    return Response.json({
      error: 'ARK_API_KEY not configured',
      fallback: '我已经准备好做你的职业导师啦。等服务端放好 Ark API key 后，我就能结合资料帮你分析。',
    }, { status: 503 });
  }

  try {
    const { messages = [], stream = false, session_id = 'default' } = await request.json();
    const safeMessages = normalizeMessages(messages);
    const lastUserMsg = safeMessages.filter(m => m.role === 'user').at(-1);
    const userContent = lastUserMsg?.content || '';

    // Store user message asynchronously (non-critical)
    if (userContent) {
      context.waitUntil(storeMessage(env, session_id, 'user', userContent, '[]'));
    }

    // Non-streaming fallback
    if (!stream) {
      const result = await chatCompletion(apiKey, safeMessages);
      if (!result.ok) {
        return Response.json({ error: 'Ark API failed', detail: result.detail }, { status: 502 });
      }

      const matched = await getVideos(env, userContent);

      context.waitUntil(
        storeMessage(env, session_id, 'assistant', result.data.reply, JSON.stringify(matched))
      );

      return Response.json({ ...result.data, videos: matched });
    }

    // Streaming mode
    const streamResult = await chatCompletionStream(apiKey, safeMessages);
    if (!streamResult.ok) {
      const fallback = await chatCompletion(apiKey, safeMessages);
      if (!fallback.ok) {
        return Response.json({ error: 'Ark API failed' }, { status: 502 });
      }
      return Response.json(fallback.data);
    }

    // Match videos for streaming response
    const matchedVideos = await getVideos(env, userContent);

    // Build SSE stream with video injection at end
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullContent = '';

    const streamDone = (async () => {
      const reader = streamResult.stream.getReader();
      try {
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                const delta = data.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  writer.write(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`));
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }
        // Store reply AFTER stream completes
        context.waitUntil(
          storeMessage(env, session_id, 'assistant', fullContent || '(empty)', JSON.stringify(matchedVideos))
        );
        writer.write(encoder.encode(`event: done\ndata: ${JSON.stringify({ videos: matchedVideos, references: [] })}\n\n`));
      } catch {
        writer.write(encoder.encode(`event: done\ndata: ${JSON.stringify({ videos: matchedVideos, references: [] })}\n\n`));
      } finally {
        writer.close();
      }
    })();

    context.waitUntil(streamDone);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Chat failed', detail: error.message }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id') || 'default';

  try {
    if (!env?.DB) return Response.json([]);
    const { results } = await env.DB.prepare(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 100'
    ).bind(sessionId).all();
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id') || 'default';

  try {
    if (!env?.DB) return Response.json({ ok: true });
    await env.DB.prepare('DELETE FROM chat_messages WHERE session_id = ?').bind(sessionId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
