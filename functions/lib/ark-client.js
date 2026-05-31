// Volcano Engine Ark API client — SSE streaming proxy
// Uses native fetch() in Workers runtime

import { SYSTEM_PROMPT, runtimeSearchPrompt } from './system-prompt.js';

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
export const DEFAULT_MODEL = 'ep-20260530223921-8dctb';

export function normalizeMessages(messages) {
  return messages
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 1000),
    }));
}

export async function chatCompletion(apiKey, messages) {
  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: runtimeSearchPrompt() },
      ...normalizeMessages(messages),
    ],
    max_tokens: 420,
    thinking: { type: 'disabled' },
  };

  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  return {
    ok: true,
    data: { reply: content || '我在这里。我们先把问题拆小一点：你现在最想解决哪一步？' },
  };
}

export async function chatCompletionStream(apiKey, messages) {
  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: runtimeSearchPrompt() },
      ...normalizeMessages(messages),
    ],
    max_tokens: 420,
    thinking: { type: 'disabled' },
    stream: true,
  };

  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, detail: await res.text() };
  }

  return { ok: true, stream: res.body };
}
