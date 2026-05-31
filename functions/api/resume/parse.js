// POST /api/resume/parse — AI resume OCR/parsing through Volcengine Ark Responses API

import { DEFAULT_MODEL } from '../../lib/ark-client.js';

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const MAX_FILE_BYTES = 12 * 1024 * 1024;

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
  const resumeText = String(parsed?.resume_text || fallbackText || '').trim();
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

function buildPrompt(file) {
  return `
你是简历解析引擎。请从用户上传的电子版简历中提取文字并结构化。

要求：
1. 保留简历原有事实，不要编造学校、公司、项目、数字、时间。
2. 如果图片/PDF 局部模糊，请尽量识别，并在 warnings 中说明不确定位置。
3. 输出必须是 JSON，不要输出 Markdown。
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
}

文件名：${file.name}
文件类型：${file.type || 'unknown'}
`.trim();
}

function buildFilePart(file, dataUrl) {
  if (file.type.startsWith('image/')) {
    return {
      type: 'input_image',
      image_url: dataUrl,
    };
  }

  return {
    type: 'input_file',
    filename: file.name || 'resume.pdf',
    file_data: dataUrl,
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.ARK_API_KEY;
  const model = env.ARK_MODEL || DEFAULT_MODEL;

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
  const body = {
    model,
    input: [
      {
        role: 'user',
        content: [
          buildFilePart(file, dataUrl),
          {
            type: 'input_text',
            text: buildPrompt(file),
          },
        ],
      },
    ],
  };

  const response = await fetch(`${ARK_BASE}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  if (!response.ok) {
    return jsonResponse({
      error: 'Ark resume parse failed',
      status: response.status,
      detail: raw.slice(0, 1200),
    }, { status: 502 });
  }

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'Ark returned invalid JSON envelope' }, { status: 502 });
  }

  const outputText = extractTextFromResponses(data);
  const parsed = normalizeParsedResume(parseJsonObject(outputText), outputText);
  if (!parsed.resume_text) {
    return jsonResponse({ error: 'No resume text extracted', raw_text: outputText.slice(0, 1200) }, { status: 502 });
  }

  return jsonResponse({
    model,
    filename: file.name,
    mime_type: file.type,
    ...parsed,
  });
}
