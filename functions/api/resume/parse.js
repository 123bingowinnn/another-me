// POST /api/resume/parse — AI resume OCR/parsing via Volcengine Ark API
// Uses chat/completions with vision for images, responses API for PDFs

import { DEFAULT_MODEL } from '../../lib/ark-client.js';
import { SYSTEM_PROMPT } from '../../lib/system-prompt.js';

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const MAX_FILE_BYTES = 12 * 1024 * 1024;

const PARSE_PROMPT = `你是简历解析引擎。请从用户上传的电子版简历中提取文字并结构化。

要求：
1. 保留简历原有事实，不要编造学校、公司、项目、数字、时间。
2. 如果图片/PDF 局部模糊，请尽量识别，并在 warnings 中说明不确定位置。
3. 输出必须是纯 JSON，不要用 Markdown 包裹，不要输出任何其他文字。
4. JSON 结构：
{
  "resume_text": "按简历顺序整理后的纯文本，包含姓名/联系方式/教育/实习/项目/技能等",
  "summary": "一句话概括候选人画像",
  "sections": {
    "basic": "基础信息",
    "education": "教育经历",
    "experience": "实习/工作经历",
    "projects": "项目经历",
    "skills": "技能",
    "others": "其他"
  },
  "warnings": ["识别不确定或缺失的地方"]
}`;

function jsonResponse(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function parseJsonObject(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    try {
      return JSON.parse(fenced);
    } catch {}
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function normalizeParsedResume(parsed, fallbackText) {
  const resumeText = (parsed?.resume_text != null)
    ? String(parsed.resume_text).trim()
    : String(fallbackText || '').trim();
  const summary = String(parsed?.summary || '').trim();
  const sections = parsed?.sections && typeof parsed.sections === 'object' ? parsed.sections : {};
  const warnings = Array.isArray(parsed?.warnings)
    ? parsed.warnings.map((item) => String(item)).filter(Boolean).slice(0, 6)
    : [];

  return {
    resume_text: resumeText,
    summary,
    sections,
    warnings,
  };
}

function extractTextFromResponses(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const chunks = [];
  (data?.output || []).forEach((item) => {
    (item?.content || []).forEach((part) => {
      if (typeof part?.text === 'string') chunks.push(part.text);
    });
  });
  return chunks.join('\n').trim();
}

// Parse resume via chat/completions with vision (for images)
async function parseViaChatCompletion(apiKey, model, dataUrl, fileName, mimeType) {
  const userContent = `${PARSE_PROMPT}\n\n文件名：${fileName}\n文件类型：${mimeType || 'unknown'}`;

  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: PARSE_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
            {
              type: 'text',
              text: `请解析这份简历图片。文件名：${fileName}`,
            },
          ],
        },
      ],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  return { ok: true, text };
}

// Parse resume via responses API (for PDFs)
async function parseViaResponses(apiKey, model, dataUrl, fileName, mimeType) {
  const isImage = mimeType?.startsWith('image/');

  const filePart = isImage
    ? { type: 'input_image', image_url: dataUrl }
    : { type: 'input_file', filename: fileName || 'resume.pdf', file_data: dataUrl };

  const res = await fetch(`${ARK_BASE}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'user',
          content: [
            filePart,
            {
              type: 'input_text',
              text: `${PARSE_PROMPT}\n\n文件名：${fileName}\n文件类型：${mimeType || 'unknown'}`,
            },
          ],
        },
      ],
      max_output_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  const text = extractTextFromResponses(data);
  return { ok: true, text };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env?.ARK_API_KEY;
  const model = env?.ARK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return jsonResponse({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: 'Expected multipart/form-data' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Missing resume file' }, { status: 400 });
  }

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isImage && !isPdf) {
    return jsonResponse({ error: 'Unsupported file type' }, { status: 415 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return jsonResponse({ error: 'File too large', max_bytes: MAX_FILE_BYTES }, { status: 413 });
  }

  const dataUrl = `data:${file.type || (isPdf ? 'application/pdf' : 'application/octet-stream')};base64,${arrayBufferToBase64(await file.arrayBuffer())}`;

  // For images: use chat/completions with vision (most reliable)
  // For PDFs: use responses API (supports file input)
  let result;
  if (isImage) {
    result = await parseViaChatCompletion(apiKey, model, dataUrl, file.name, file.type);
  } else {
    // Try responses API for PDFs, fall back to chat/completions error guidance
    result = await parseViaResponses(apiKey, model, dataUrl, file.name, file.type);
  }

  if (!result.ok) {
    // If responses API failed for PDF, suggest converting to image
    if (isPdf) {
      return jsonResponse({
        error: 'PDF 解析失败',
        detail: result.detail?.slice(0, 500),
        suggestion: '请将简历导出为图片（PNG/JPG）后重新上传，图片识别更稳定。',
      }, { status: 502 });
    }
    return jsonResponse({
      error: 'AI resume parse failed',
      detail: result.detail?.slice(0, 500),
    }, { status: 502 });
  }

  const parsed = normalizeParsedResume(parseJsonObject(result.text), result.text);
  if (!parsed.resume_text) {
    return jsonResponse({
      error: 'No resume text extracted',
      raw_text: result.text.slice(0, 1200),
    }, { status: 502 });
  }

  return jsonResponse({
    model,
    filename: file.name,
    mime_type: file.type,
    ...parsed,
  });
}
