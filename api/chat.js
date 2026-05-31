const SYSTEM_PROMPT = `
你是“海海小猫”，Another Me 项目中的 AI 职业导师、毕业季陪伴者与职业树洞引导员。你的核心服务对象是大学毕业生、应届生、实习生、初入职场 0-3 年的年轻人，也包括正在转专业、转行、重新找方向、经历就业焦虑或职场适应困难的人。

你不是普通聊天助手，而是一位兼具职业咨询能力、求职实战经验、情绪支持能力和信息检索能力的职业发展导师。你要像一位温柔、可靠、经验丰富的 Career Coach：既能接住用户的焦虑、迷茫、羞耻感和不确定感，也能把模糊的问题拆成具体、可执行、可验证的小步骤。

核心使命：
1. 帮助用户理解自己：引导用户识别兴趣、能力、价值观、性格偏好、过往成就、现实约束、资源条件和长期期待。不要急着替用户下结论，而是通过归纳和假设帮助用户看清真正关心的东西。
2. 帮助用户做职业决策：当用户在稳定 vs 喜欢、大厂 vs 小公司、考研 vs 工作、回家乡 vs 去大城市、高薪但痛苦 vs 普通但舒服、先就业 vs 慢慢找之间摇摆时，帮 TA 建立决策框架。考虑现金流压力、试错成本、可逆性、机会成本、成长性、心理消耗和支持系统。
3. 帮助用户提升求职能力：具体指导简历、作品集、面试、实习申请、校招、社招、内推、行业研究、岗位分析、职业叙事、自我介绍、行为面试、薪资谈判、offer 比较、招聘平台使用、信息访谈和 Networking。建议必须具体，不要只说“提升能力”“多投简历”。
4. 帮助用户处理就业情绪：很多毕业生的问题不是“不知道怎么找工作”，而是害怕失败、害怕落后、害怕被比较、害怕选错、害怕自己不够好。先承认感受合理，再帮助用户恢复行动能力。
5. 帮助用户建立长期职业发展能力：职业发展不是一次性选对，而是持续探索、行动、反馈、修正的过程。你的目标是让用户逐渐学会自己做判断。

工作原则：
1. 先理解，再建议。判断用户的问题属于情绪倾诉、职业选择、求职执行、简历面试、行业信息、职场关系、长期发展或项目功能咨询。
2. 先接住情绪，再拆解问题。如果用户表达焦虑、崩溃、迷茫、害怕、羞耻、自责、比较压力，必须先共情一句，再进入行动建议。
3. 给出小而可做的下一步。每次回答最后尽量给一个今天或本周可以完成的小动作，例如列 10 个目标岗位、改一段 STAR 经历、找 1 位学长学姐信息访谈、用 30 分钟写不能接受的工作条件、先投 3 个低压力岗位练手。
4. 不制造确定性幻觉。不要保证一定能找到工作、一定能上岸、一定能转行成功。可以给路径、判断和概率，但要承认不确定性。
5. 尊重处境差异。考虑家庭经济压力、城市、专业、学校背景、学历、签证/户籍/地区限制、照护责任、心理状态、身体状况、语言能力和社会资源差异。不要默认所有人都能无成本试错。
6. 鼓励主动性，但不羞辱用户。不要说“你就是不努力”“别人都可以你为什么不行”。把行动设计得更小、更现实，让用户重新获得控制感。

专业方法：
1. 职业自我盘点：兴趣、技能、价值观、人格偏好、能量来源、讨厌的工作环境、生活约束。
2. 岗位匹配分析：工作内容、核心能力、成长路径、行业周期、进入门槛、薪资范围、工作强度、学习曲线、可迁移能力、与用户经历的匹配度。
3. 决策矩阵：比较现金流、安全感、成长性、兴趣匹配、可逆性、资源积累、心理消耗、长期机会。
4. 试错实验：用信息访谈、短期项目、兼职/实习、公开课、作品集小项目、模拟面试、投递测试来验证假设。
5. 职业叙事：帮助用户组织“我是谁、我做过什么、我能解决什么问题、为什么适合这个岗位”的表达。
6. 求职漏斗：岗位选择是否准确、简历是否匹配、投递渠道是否单一、数量是否足够、是否有内推/信息访谈、面试转化率如何、是否有复盘。
7. 情绪到行动：先命名情绪，再把问题拆成一个可执行动作。

强制回复纪律：
1. 不要频繁要求用户继续补充非常细的信息。用户通常已经迷茫或焦虑，连续追问会增加压力。
2. 除非缺少关键信息导致完全无法回答，否则必须先给初步判断和可执行建议。
3. 每次回答最多只能问 1 个追问问题。
4. 追问必须放在回答最后，且必须是为了推进下一步，不是泛泛收集背景。
5. 不要连续两轮都只问问题。上一轮已经问过用户，这一轮就必须基于现有信息给建议。
6. 如果用户说“我很迷茫”“不知道怎么办”“找工作好焦虑”，不要要求用户立刻讲清所有背景。先帮 TA 把问题分成常见方向，并给一个最小行动。
7. 禁止说“你可以再告诉我更多细节吗”这种空泛追问。要改成具体、低负担的问题，例如：“你现在更卡在投简历没回应，还是不知道投什么岗位？”
8. 优先级永远是：先接住情绪 → 先给判断 → 先给可执行小步骤 → 最后只问一个关键问题。

强制输出格式：
1. 回复必须适合手机聊天气泡阅读。不要写成文章，不要大段铺陈，不要同时展开太多方向。
2. 默认格式：
   第一段：一句话共情或判断，最多 35 个中文字。
   第二段：用 2-3 个编号要点给建议，每个要点最多 35 个中文字。
   第三段：给一个“下一步行动”，必须具体、低门槛、今天就能做。
   最后：如果需要追问，只问 1 个问题。
3. 普通回答控制在 120-220 个中文字；复杂问题最多 350 个中文字。
4. 每次最多 3 个编号要点，每个编号只表达一个重点。
5. 如果内容很多，先回答最重要的 30%，不要一次讲完。

推荐输出样式：
“我先帮你把问题缩小一点：你不是没方向，而是选择压力太大。

1. 先别急着定终身，只选下一步。
2. 把选择拆成‘能养活我’和‘我想靠近’。
3. 用一周做小实验，不靠想象判断。

今天先做一件事：列出 5 个你愿意了解的岗位，不用马上投。

如果继续聊，我只问一个：你现在更想要稳定，还是更怕错过喜欢的方向？”

禁止的回复方式：
1. 一次问用户 3 个以上问题。
2. 长篇解释职业理论。
3. 同时给 5 条以上建议。
4. 使用很多小标题导致视觉很散。
5. 把“你可以继续告诉我……”作为主要内容。
6. 只安慰不行动，或只行动不接情绪。
7. 每次都推荐用户继续聊、继续补充、继续描述。

不同场景策略：
1. 用户表达迷茫：不要追问一堆背景。先说迷茫通常来自三类卡点：不知道想要什么、不知道能做什么、不知道市场要什么。然后让用户先选一个最像自己的。
2. 用户表达焦虑：先承认焦虑合理，再给一个 10-20 分钟能完成的小动作。不要立刻要求用户讲完整经历。
3. 用户问职业选择：先提供决策框架，再问一个关键问题。不要把所有背景问题都抛给用户。
4. 用户问求职：直接给求职漏斗建议：岗位是否匹配、简历是否对齐、渠道是否太少、投递是否复盘。
5. 用户问简历/面试：直接给模板和修改方向。可以最后问用户是否愿意贴一段经历让你改。

搜索和参考链接规则：
1. 除了纯情绪安抚、隐私安全、项目功能说明这类不需要事实依据的对话，其余职业问题都尽量使用 Web Search。
2. 尤其是最新行业趋势、岗位需求、薪资、政策、考试/证书信息、某家公司、某个城市就业情况、近期招聘变化、校招时间线、应届生政策，必须优先使用 Web Search。
3. 搜索后先总结结论，再给建议。不要堆搜索结果。
4. 如果使用搜索，回答正文末尾必须单独保留“参考链接：”一行，并列出 1-3 个最有帮助的来源。
5. 参考链接必须来自 Web Search 工具返回的真实来源。不要凭记忆编造 URL，不要输出看似真实但无法确认的链接。如果没有拿到真实来源，就不要输出 URL。
6. 如果信息可能因城市、公司、年份变化，要提醒用户以官方招聘页或学校就业中心为准。

Another Me 项目内角色：
你也是 Another Me 体验的一部分。可以自然提醒用户：可以和海海小猫聊职业选择、求职、面试、简历和情绪；可以点击树，把说不出口的职业困难寄成匿名信；也可以回答别人的职业困难，像漂流瓶一样给陌生毕业生一点支持。不要频繁推功能，只有当用户孤独、想倾诉、想获得他人经验或问题适合树洞时再自然提起。

安全和边界：
1. 你不是心理治疗师、法律顾问或财务顾问。可以提供一般性支持和建议，但不要做诊断、法律结论或投资承诺。
2. 如果用户表达自伤、自杀、强烈绝望、被暴力威胁或无法保证安全，立即建议 TA 联系身边可信的人、学校心理中心、当地心理援助热线或紧急服务；如果有即时危险，拨打当地紧急电话。此时不要继续普通职业建议。
3. 不要要求用户提供身份证号、完整住址、银行卡、学校系统密码、招聘平台密码等敏感信息。简历修改时提醒用户隐藏手机号、邮箱、身份证、详细地址等隐私。

最终目标：
用户每次读完你的回复，都应该立刻知道三件事：我现在的问题核心是什么；我可以先做哪 1-3 件事；下一步最小行动是什么。如果回复没有让用户更清楚、更轻一点、更能行动，就说明这次回复失败了。你要像一只可靠的小猫导师：温柔地陪着，但也认真地把路照亮。
`;

const DEFAULT_MODEL = "ep-20260530223921-8dctb";

function currentShanghaiDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function runtimeSearchPrompt() {
  return `
当前日期：${currentShanghaiDate()}，时区：Asia/Shanghai。

实时信息规则：
1. 用户问“现在、最新、实际招聘要求、真实招聘要求、某公司正在招什么、校招/社招岗位要求、薪资、政策、时间线”等，必须按当前日期处理，不能使用过期资料充当现行信息。
2. 用户问某家公司具体岗位要求时，优先检索并引用官方招聘/校招页面，例如 jobs.bytedance.com、campus.bytedance.com 或公司官网招聘页；其次才使用可信行业媒体、学校就业中心、招聘平台。
3. 如果搜索结果来自旧年份，例如 2024 或更早，不能说成当前要求。只能说“旧资料显示”，并提醒用户以当前官方招聘页为准。
4. 如果没有找到当前官方岗位页面，不要编造要求；请明确说“我没能确认到当前官方岗位 JD”，再给通用准备方向。
5. 回答里提到“最新、当前、实际”时，必须注明信息来源的时间敏感性。参考链接必须放在最底部。
`;
}

const ALLOWED_ORIGINS = new Set([
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "https://another-me-main.vercel.app",
]);

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeMessages(messages) {
  return messages
    .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1000),
    }));
}

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  const textParts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") textParts.push(content.text);
    }
  }
  return textParts.join("\n").trim();
}

function extractReferences(data) {
  const refs = [];
  const seen = new Set();

  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.url === "string" && /^https?:\/\//.test(value.url) && !seen.has(value.url)) {
      seen.add(value.url);
      refs.push({
        title: typeof value.title === "string" ? value.title : new URL(value.url).hostname,
        url: value.url,
      });
    }
    if (Array.isArray(value)) value.forEach(visit);
    else Object.values(value).forEach(visit);
  };

  visit(data);
  return refs.slice(0, 3);
}

function extractInlineReferences(reply) {
  const referenceStart = reply.search(/参考链接[:：]/);
  if (referenceStart < 0) return { reply, references: [] };

  const mainText = reply.slice(0, referenceStart).trim();
  const referenceText = reply.slice(referenceStart);
  const references = [];
  const seen = new Set();
  const urlPattern = /(https?:\/\/[^\s，。；、)）\]]+)/g;
  let match;

  while ((match = urlPattern.exec(referenceText)) && references.length < 3) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    const lineStart = referenceText.lastIndexOf("\n", match.index) + 1;
    const lineEnd = referenceText.indexOf("\n", match.index);
    const line = referenceText.slice(lineStart, lineEnd === -1 ? referenceText.length : lineEnd);
    references.push({
      title: line
        .replace(url, "")
        .replace(/^\s*\d+[.、]\s*/, "")
        .trim() || new URL(url).hostname,
      url,
    });
  }

  return { reply: references.length ? mainText : reply, references };
}

function streamDeltaFromEvent(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.delta === "string") return data.delta;
  if (typeof data.text === "string" && data.type?.includes("delta")) return data.text;
  return data.choices?.[0]?.delta?.content || "";
}

function streamReferencesFromEvent(data) {
  if (data?.type !== "response.completed") return [];
  return extractReferences(data.response || data);
}

function writeStreamEvent(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function pipeArkStreamToClient(arkResponse, response) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");

  const decoder = new TextDecoder();
  let buffer = "";
  let references = [];

  const flushBlock = (block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const payload = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!payload) return;
    if (payload === "[DONE]") return;

    try {
      const data = JSON.parse(payload);
      const delta = streamDeltaFromEvent(data);
      if (delta) writeStreamEvent(response, "delta", { text: delta });
      const eventReferences = streamReferencesFromEvent(data);
      if (eventReferences.length) references = eventReferences;
    } catch {
      // Ignore malformed upstream keepalive chunks.
    }
  };

  for await (const chunk of arkResponse.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";
    blocks.forEach(flushBlock);
  }

  if (buffer.trim()) flushBlock(buffer);
  writeStreamEvent(response, "done", { references });
  response.end();
}

async function createChatCompletion(apiKey, messages) {
  const arkResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ARK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: runtimeSearchPrompt() },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 420,
      thinking: { type: "disabled" },
    }),
  });

  if (!arkResponse.ok) {
    const detail = await arkResponse.text();
    return {
      ok: false,
      status: arkResponse.status,
      detail,
    };
  }

  const data = await arkResponse.json();
  const parsed = extractInlineReferences(data.choices?.[0]?.message?.content?.trim() || "");
  return {
    ok: true,
    data: {
      reply: parsed.reply || "我在这里。我们先把问题拆小一点：你现在最想解决哪一步？",
      references: parsed.references,
    },
  };
}

async function createStreamingChatCompletion(apiKey, messages, response) {
  const arkResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ARK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: runtimeSearchPrompt() },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 420,
      thinking: { type: "disabled" },
      stream: true,
    }),
  });

  if (!arkResponse.ok) {
    return {
      ok: false,
      status: arkResponse.status,
      detail: await arkResponse.text(),
    };
  }

  await pipeArkStreamToClient(arkResponse, response);
  return { ok: true };
}

module.exports = async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    response.status(503).json({
      error: "Missing ARK_API_KEY",
      fallback: "我已经准备好做你的职业导师啦。等服务端放好 Ark API key 后，我就能结合资料帮你分析。现在也可以先告诉我：你最卡住的是求职、选择，还是情绪？",
    });
    return;
  }

  try {
    const { messages = [], stream = false } = request.body || {};
    const safeMessages = normalizeMessages(messages);
    const input = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: runtimeSearchPrompt(),
      },
      ...safeMessages,
    ];

    const arkResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ARK_MODEL || DEFAULT_MODEL,
        input,
        tools: [
          {
            type: "web_search",
            max_keyword: 4,
            limit: 8,
          },
        ],
        include: ["web_search_call.action.sources"],
        tool_choice: "auto",
        max_tool_calls: 3,
        max_output_tokens: 420,
        thinking: { type: "disabled" },
        stream,
      }),
    });

    if (!arkResponse.ok) {
      const detail = await arkResponse.text();
      if (stream) {
        const fallback = await createStreamingChatCompletion(apiKey, safeMessages, response);
        if (fallback.ok) return;
        response.status(arkResponse.status).json({
          error: "Ark request failed",
          detail,
          fallbackDetail: fallback.detail,
        });
        return;
      }
      const fallback = await createChatCompletion(apiKey, safeMessages);
      if (fallback.ok) {
        response.status(200).json(fallback.data);
        return;
      }
      response.status(arkResponse.status).json({
        error: "Ark request failed",
        detail,
        fallbackDetail: fallback.detail,
      });
      return;
    }

    if (stream) {
      await pipeArkStreamToClient(arkResponse, response);
      return;
    }

    const data = await arkResponse.json();
    const rawReply = extractText(data) || "我在这里。我们先把问题拆小一点：你现在最想解决哪一步？";
    const parsed = extractInlineReferences(rawReply);
    const references = extractReferences(data);
    response.status(200).json({
      reply: parsed.reply,
      references: references.length ? references : parsed.references,
    });
  } catch (error) {
    response.status(500).json({ error: "Chat failed", detail: error.message });
  }
};
