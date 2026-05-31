"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type RoleKey =
  | "general"
  | "frontend"
  | "backend"
  | "product"
  | "operation"
  | "design"
  | "data";

type Severity = "high" | "medium" | "low";
type ScoreKey = "structure" | "impact" | "match" | "clarity";
type ParseStage = "idle" | "uploading" | "extracting" | "structuring" | "done" | "error";

interface RoleConfig {
  key: RoleKey;
  label: string;
  keywords: string[];
  mustHave: string[];
}

interface ScoreItem {
  key: ScoreKey;
  label: string;
  value: number;
  color: string;
}

interface Suggestion {
  severity: Severity;
  title: string;
  reason: string;
  fix: string;
  example: string;
}

interface ResumeAnalysis {
  score: number;
  scores: ScoreItem[];
  strengths: string[];
  suggestions: Suggestion[];
  quickFixes: string[];
  detectedSections: string[];
  stats: {
    words: number;
    numbers: number;
    bullets: number;
    weakWords: number;
    roleHits: number;
  };
}

interface ResumeParseResult {
  resume_text: string;
  summary?: string;
  sections?: Record<string, string>;
  warnings?: string[];
  model?: string;
}

interface ParseProgress {
  stage: ParseStage;
  value: number;
  label: string;
}

const ROLES: RoleConfig[] = [
  {
    key: "general",
    label: "通用",
    keywords: ["项目", "实习", "沟通", "协作", "数据", "用户", "复盘"],
    mustHave: ["教育", "实习", "项目", "技能"],
  },
  {
    key: "frontend",
    label: "前端",
    keywords: [
      "React",
      "Vue",
      "Next",
      "TypeScript",
      "JavaScript",
      "性能",
      "组件",
      "接口",
      "页面",
    ],
    mustHave: ["教育", "项目", "技能", "作品"],
  },
  {
    key: "backend",
    label: "后端",
    keywords: [
      "Java",
      "Go",
      "Python",
      "Spring",
      "Node",
      "数据库",
      "缓存",
      "接口",
      "并发",
    ],
    mustHave: ["教育", "项目", "技能", "数据库"],
  },
  {
    key: "product",
    label: "产品",
    keywords: [
      "需求",
      "用户",
      "原型",
      "PRD",
      "数据",
      "调研",
      "迭代",
      "转化",
      "增长",
    ],
    mustHave: ["教育", "项目", "实习", "数据"],
  },
  {
    key: "operation",
    label: "运营",
    keywords: [
      "用户",
      "社群",
      "内容",
      "活动",
      "转化",
      "增长",
      "留存",
      "复盘",
      "数据",
    ],
    mustHave: ["教育", "实习", "项目", "数据"],
  },
  {
    key: "design",
    label: "设计",
    keywords: [
      "Figma",
      "视觉",
      "交互",
      "用户",
      "组件",
      "作品集",
      "体验",
      "改版",
      "规范",
    ],
    mustHave: ["教育", "项目", "作品集", "工具"],
  },
  {
    key: "data",
    label: "数据",
    keywords: [
      "SQL",
      "Python",
      "Excel",
      "Tableau",
      "指标",
      "建模",
      "分析",
      "A/B",
      "可视化",
    ],
    mustHave: ["教育", "项目", "技能", "数据"],
  },
];

const SAMPLE_RESUME = `张同学
电话：13800000000 邮箱：student@example.com
求职意向：产品经理助理

教育经历
某某大学 信息管理与信息系统 本科 2022-2026
主修课程：数据分析、用户研究、数据库、项目管理

项目经历
校园二手交易小程序
- 负责需求调研和原型设计，访谈 18 名学生，整理 42 条高频需求
- 使用 Figma 输出 25 页核心流程原型，推动前端同学完成发布
- 上线后 2 周获得 310 名注册用户，发布商品 86 件

校园经历
- 组织学院迎新活动，协调 12 名志愿者，服务 400+ 新生

技能
Figma、Axure、Excel、SQL 基础、飞书文档`;

const SECTION_ALIASES = [
  {
    key: "教育",
    patterns: ["教育经历", "教育背景", "学历", "学校"],
  },
  {
    key: "实习",
    patterns: ["实习经历", "工作经历", "实践经历", "任职经历"],
  },
  {
    key: "项目",
    patterns: ["项目经历", "项目经验", "作品经历", "实践项目"],
  },
  {
    key: "技能",
    patterns: ["专业技能", "技能", "技术栈", "工具"],
  },
  {
    key: "校园",
    patterns: ["校园经历", "社团经历", "学生工作", "获奖经历"],
  },
  {
    key: "作品",
    patterns: ["作品集", "作品链接", "GitHub", "个人网站", "Portfolio"],
  },
  {
    key: "证书",
    patterns: ["证书", "英语", "CET", "资格证"],
  },
  {
    key: "自评",
    patterns: ["自我评价", "个人评价", "个人优势"],
  },
  {
    key: "数据",
    patterns: ["数据", "指标", "SQL", "Excel", "转化", "增长"],
  },
  {
    key: "数据库",
    patterns: ["MySQL", "Redis", "MongoDB", "PostgreSQL", "数据库"],
  },
  {
    key: "工具",
    patterns: ["Figma", "Sketch", "Photoshop", "Illustrator", "工具"],
  },
];

const WEAK_PHRASES = [
  "认真负责",
  "吃苦耐劳",
  "学习能力强",
  "抗压能力强",
  "性格开朗",
  "熟练掌握",
  "有一定了解",
  "参与了",
  "负责相关",
  "协助完成",
  "良好沟通",
];

const ACTION_VERBS = [
  "负责",
  "主导",
  "设计",
  "搭建",
  "优化",
  "推动",
  "分析",
  "调研",
  "落地",
  "迭代",
  "复盘",
  "提升",
  "降低",
  "转化",
  "上线",
];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function countMatches(text: string, patterns: string[]) {
  const lower = text.toLowerCase();
  return patterns.reduce((count, pattern) => {
    return lower.includes(pattern.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function countOccurrences(text: string, patterns: string[]) {
  return patterns.reduce((count, pattern) => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return count + (text.match(new RegExp(escaped, "gi")) ?? []).length;
  }, 0);
}

function getDetectedSections(text: string) {
  return SECTION_ALIASES.filter((section) =>
    section.patterns.some((pattern) =>
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text),
    ),
  ).map((section) => section.key);
}

function hasContact(text: string) {
  return {
    phone: /1[3-9]\d{9}/.test(text),
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
  };
}

function getNumbers(text: string) {
  return (
    text.match(
      /\d+(\.\d+)?\s*(%|％|人|名|个|次|天|周|月|年|万|千|k|K|w|W|元|页|条|件|小时|分钟)?/g,
    ) ?? []
  );
}

function getBulletCount(text: string) {
  return (text.match(/(^|\n)\s*(-|•|·|\d+[.、]|[一二三四五六七八九十]+[、.])/g) ?? []).length;
}

function scoreStructure(text: string, role: RoleConfig, sections: string[]) {
  const contact = hasContact(text);
  const requiredHits = role.mustHave.filter((section) => sections.includes(section)).length;
  const contactScore = (contact.phone ? 10 : 0) + (contact.email ? 10 : 0);
  return clamp((requiredHits / role.mustHave.length) * 56 + contactScore + Math.min(sections.length, 7) * 4);
}

function scoreImpact(text: string, numbers: string[], bullets: number) {
  const actionHits = countOccurrences(text, ACTION_VERBS);
  const numberScore = Math.min(numbers.length * 9, 42);
  const actionScore = Math.min(actionHits * 5, 35);
  const bulletScore = Math.min(bullets * 3, 18);
  return clamp(14 + numberScore + actionScore + bulletScore);
}

function scoreMatch(text: string, role: RoleConfig) {
  const hits = countMatches(text, role.keywords);
  return clamp(18 + (hits / role.keywords.length) * 82);
}

function scoreClarity(text: string, weakWords: number, bullets: number) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const longLines = lines.filter((line) => line.length > 72).length;
  const linePenalty = Math.min(longLines * 8, 30);
  const weakPenalty = Math.min(weakWords * 7, 32);
  const bulletBonus = Math.min(bullets * 3, 18);
  return clamp(74 + bulletBonus - linePenalty - weakPenalty);
}

function buildSuggestions({
  text,
  role,
  sections,
  stats,
  scores,
}: {
  text: string;
  role: RoleConfig;
  sections: string[];
  stats: ResumeAnalysis["stats"];
  scores: ScoreItem[];
}) {
  const suggestions: Suggestion[] = [];
  const missing = role.mustHave.filter((section) => !sections.includes(section));
  const scoreMap = Object.fromEntries(scores.map((score) => [score.key, score.value])) as Record<
    ScoreKey,
    number
  >;

  if (missing.length > 0) {
    suggestions.push({
      severity: "high",
      title: `补齐 ${missing.join(" / ")} 模块`,
      reason: "应届生简历最怕信息不成块，面试官找不到判断依据。",
      fix: "每个模块只放和目标岗位有关的 2-4 条经历，先补结构，再打磨措辞。",
      example: `${missing[0]}：项目名 / 背景 / 你的动作 / 可验证结果`,
    });
  }

  if (stats.numbers < 4 || scoreMap.impact < 68) {
    suggestions.push({
      severity: "high",
      title: "把“做了什么”改成“带来了什么”",
      reason: "缺少数字时，经历容易像课堂作业，不能证明你真的产生过影响。",
      fix: "给每条项目经历补一个结果数字：规模、效率、转化、用户、成本或周期。",
      example: "优化报名流程，将 5 步压缩到 3 步，活动报名完成率提升 18%。",
    });
  }

  if (stats.roleHits < 4 || scoreMap.match < 62) {
    suggestions.push({
      severity: "high",
      title: `增加 ${role.label} 岗位关键词`,
      reason: "简历和 JD 的语言体系不一致，筛选时容易被误判为不匹配。",
      fix: `从目标 JD 里挑 6 个高频词，嵌入项目标题、技能和经历 bullet。`,
      example: role.keywords.slice(0, 5).join(" / "),
    });
  }

  if (stats.weakWords > 0) {
    suggestions.push({
      severity: "medium",
      title: "替换空泛自评词",
      reason: "“认真负责、学习能力强”不会加分，除非后面有证据。",
      fix: "把形容词换成行为和产出，保留可追问的事实。",
      example: "不要写“学习能力强”，改成“2 周补齐 SQL 基础，独立完成留存分析表”。",
    });
  }

  if (stats.bullets < 5 || scoreMap.clarity < 66) {
    suggestions.push({
      severity: "medium",
      title: "改成短句 bullet",
      reason: "长段落会让 HR 扫描成本变高，也不利于 ATS 提取信息。",
      fix: "每条经历控制在 1-2 行，用动词开头，结尾放结果。",
      example: "调研 18 名用户，提炼 5 个核心痛点，推动首页信息架构改版。",
    });
  }

  if (!hasContact(text).phone || !hasContact(text).email) {
    suggestions.push({
      severity: "medium",
      title: "联系方式不完整",
      reason: "这类基础信息缺失会直接影响邀约。",
      fix: "姓名下方固定放手机、邮箱、城市；技术/设计岗可加作品链接。",
      example: "电话：138xxxx0000｜邮箱：name@example.com｜城市：上海",
    });
  }

  if (!/(20\d{2}|19\d{2}).*(20\d{2}|至今|现在)/.test(text)) {
    suggestions.push({
      severity: "low",
      title: "给经历补时间线",
      reason: "时间线可以帮助面试官判断经历新旧和投入周期。",
      fix: "每段教育、实习、项目都加年月，格式保持一致。",
      example: "2025.03 - 2025.06｜校园二手交易小程序｜产品负责人",
    });
  }

  if (suggestions.length < 5) {
    suggestions.push({
      severity: "low",
      title: "准备一版 45 秒简历口播",
      reason: "简历只是入口，面试时还要把亮点讲出来。",
      fix: "把最强经历改成“背景、动作、结果、复盘”四句。",
      example: "这个项目解决了 X，我负责 Y，最后带来 Z，下次我会优化 A。",
    });
  }

  return suggestions;
}

function analyzeResume(text: string, role: RoleConfig): ResumeAnalysis {
  const trimmed = text.trim();
  const sections = getDetectedSections(trimmed);
  const numbers = getNumbers(trimmed);
  const bullets = getBulletCount(trimmed);
  const weakWords = countOccurrences(trimmed, WEAK_PHRASES);
  const roleHits = countMatches(trimmed, role.keywords);
  const words = trimmed.replace(/\s/g, "").length;

  const scores: ScoreItem[] = [
    {
      key: "structure",
      label: "结构",
      value: scoreStructure(trimmed, role, sections),
      color: "#74b89d",
    },
    {
      key: "impact",
      label: "证据",
      value: scoreImpact(trimmed, numbers, bullets),
      color: "#f2bd4a",
    },
    {
      key: "match",
      label: "匹配",
      value: scoreMatch(trimmed, role),
      color: "#7c9cbf",
    },
    {
      key: "clarity",
      label: "表达",
      value: scoreClarity(trimmed, weakWords, bullets),
      color: "#f07c6c",
    },
  ];

  const score = clamp(
    scores.reduce((sum, item) => sum + item.value, 0) / scores.length,
  );
  const stats = {
    words,
    numbers: numbers.length,
    bullets,
    weakWords,
    roleHits,
  };

  const strengths = [
    sections.includes("项目") ? "有项目经历可展开追问" : "",
    numbers.length >= 4 ? "结果数字比较充分" : "",
    roleHits >= 4 ? `${role.label}岗位关键词有出现` : "",
    bullets >= 5 ? "经历呈现适合快速扫读" : "",
    hasContact(trimmed).phone && hasContact(trimmed).email ? "基础联系信息完整" : "",
  ].filter(Boolean);

  return {
    score,
    scores,
    strengths: strengths.length > 0 ? strengths : ["已经有可诊断的简历素材"],
    suggestions: buildSuggestions({
      text: trimmed,
      role,
      sections,
      stats,
      scores,
    }),
    quickFixes: [
      "把最强项目放到第一页上半屏。",
      "每段经历至少补一个数字。",
      "删除没有证据的性格形容词。",
      `把 ${role.keywords.slice(0, 3).join("、")} 写进对应经历。`,
    ],
    detectedSections: sections,
    stats,
  };
}

function ScorePill({ item }: { item: ScoreItem }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#3b3833]">
        <span>{item.label}</span>
        <span>{item.value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-md bg-[#ebe7df]">
        <div
          className="h-full rounded-md transition-[width] duration-500"
          style={{ width: `${item.value}%`, backgroundColor: item.color }}
        />
      </div>
    </div>
  );
}

function getRadarPoint({
  index,
  total,
  value,
  radius,
  center,
}: {
  index: number;
  total: number;
  value: number;
  radius: number;
  center: number;
}) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  const distance = radius * (value / 100);

  return {
    x: center + Math.cos(angle) * distance,
    y: center + Math.sin(angle) * distance,
  };
}

function makeRadarPoints(scores: ScoreItem[], value: number, radius: number, center: number) {
  return scores
    .map((_, index) =>
      getRadarPoint({
        index,
        total: scores.length,
        value,
        radius,
        center,
      }),
    )
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

function ResumeRadarChart({ scores }: { scores: ScoreItem[] }) {
  const center = 110;
  const radius = 68;
  const sortedScores = [...scores].sort((a, b) => a.value - b.value);
  const lowest = sortedScores[0];
  const chartPoints = scores
    .map((score, index) =>
      getRadarPoint({
        index,
        total: scores.length,
        value: score.value,
        radius,
        center,
      }),
    )
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  return (
    <section className="border-b border-[#eee5d7] bg-[#fffdf8] px-5 py-5">
      <div className="rounded-lg border border-[#e7dfd1] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black">能力雷达</p>
            <p className="mt-1 text-xs leading-5 text-[#6a5f52]">
              最短的一角就是当前优先补强项。
            </p>
          </div>
          <div className="rounded-lg bg-[#fff1b8] px-3 py-2 text-right">
            <p className="text-[11px] font-bold text-[#7a5711]">最低项</p>
            <p className="text-sm font-black">{lowest.label} {lowest.value}</p>
          </div>
        </div>

        <div className="mt-4 grid place-items-center">
          <svg
            viewBox="0 0 220 220"
            role="img"
            aria-label="简历能力雷达图"
            className="aspect-square w-full max-w-[260px]"
          >
            {[25, 50, 75, 100].map((level) => (
              <polygon
                key={level}
                points={makeRadarPoints(scores, level, radius, center)}
                fill="none"
                stroke="#e7dfd1"
                strokeWidth="1"
              />
            ))}

            {scores.map((score, index) => {
              const end = getRadarPoint({
                index,
                total: scores.length,
                value: 100,
                radius,
                center,
              });

              return (
                <line
                  key={score.key}
                  x1={center}
                  y1={center}
                  x2={end.x}
                  y2={end.y}
                  stroke="#eee5d7"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={chartPoints}
              fill="rgba(36,38,50,0.13)"
              stroke="#242632"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            {scores.map((score, index) => {
              const point = getRadarPoint({
                index,
                total: scores.length,
                value: score.value,
                radius,
                center,
              });
              const label = getRadarPoint({
                index,
                total: scores.length,
                value: 118,
                radius,
                center,
              });

              return (
                <g key={score.key}>
                  <circle cx={point.x} cy={point.y} r="4" fill={score.color} stroke="#242632" />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor={Math.abs(label.x - center) < 4 ? "middle" : label.x > center ? "end" : "start"}
                    dominantBaseline="middle"
                    fill="#3b3833"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {score.label} {score.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 grid gap-2">
          {sortedScores.map((score, index) => (
            <div
              key={score.key}
              className="grid grid-cols-[48px_1fr_42px] items-center gap-3 rounded-lg bg-[#fffaf2] p-3"
            >
              <span
                className={[
                  "h-6 rounded-md px-2 text-center text-[11px] font-bold leading-6",
                  index === 0 ? "bg-[#ffe3dc] text-[#963a2e]" : "bg-[#e4f3ed] text-[#276653]",
                ].join(" ")}
              >
                {index === 0 ? "短板" : "关注"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{score.label}</p>
                <div className="mt-1 h-2 overflow-hidden rounded-md bg-[#ebe7df]">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${score.value}%`, backgroundColor: score.color }}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-black">{score.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function severityClass(severity: Severity) {
  if (severity === "high") return "bg-[#ffe3dc] text-[#963a2e]";
  if (severity === "medium") return "bg-[#fff1c9] text-[#7a5711]";
  return "bg-[#e4f3ed] text-[#276653]";
}

function severityLabel(severity: Severity) {
  if (severity === "high") return "优先";
  if (severity === "medium") return "建议";
  return "锦囊";
}

function ResumeDeskArt({ score }: { score: number }) {
  const markerLeft = `${Math.max(8, Math.min(84, score - 6))}%`;

  return (
    <section className="relative h-[170px] overflow-hidden border-y border-[#e7dfd1] bg-[#f7f1e8]">
      <div className="absolute inset-x-0 top-0 h-16 bg-[#dfece8]" />
      <div className="absolute left-7 top-7 h-28 w-24 rounded-lg border border-[#242632] bg-white shadow-[8px_10px_0_#ded3c3]">
        <div className="mx-4 mt-5 h-2 rounded bg-[#242632]" />
        <div className="mx-4 mt-4 h-2 rounded bg-[#f2bd4a]" />
        <div className="mx-4 mt-3 h-2 rounded bg-[#74b89d]" />
        <div className="mx-4 mt-3 h-2 rounded bg-[#f07c6c]" />
        <div className="mx-4 mt-3 h-2 rounded bg-[#7c9cbf]" />
      </div>
      <div className="absolute right-8 top-8 h-24 w-28 rounded-lg border border-[#242632] bg-[#fff8df]">
        <div className="mx-auto mt-5 grid h-12 w-12 place-items-center rounded-full bg-[#242632] text-sm font-black text-white">
          {score}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#d7c5a3]" />
      <div className="absolute bottom-8 left-7 right-7 h-4 rounded bg-[#8f7656]" />
      <div className="absolute bottom-5 left-8 right-8 h-2 rounded bg-[#ece4d8]">
        <div
          className="absolute top-[-5px] h-4 w-4 rounded-full border border-[#242632] bg-[#f07c6c]"
          style={{ left: markerLeft }}
        />
      </div>
    </section>
  );
}

type UploadedKind = "image" | "pdf" | "unsupported";
type CheckState = "pass" | "warn" | "fail";

interface UploadedResumeFile {
  file: File;
  kind: UploadedKind;
  name: string;
  size: string;
}

interface FileCheck {
  label: string;
  detail: string;
  state: CheckState;
}

interface ImageStats {
  width: number;
  height: number;
  contrast: number;
}

function getFileKind(file: File): UploadedKind {
  const lowerName = file.name.toLowerCase();

  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf";

  return "unsupported";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function scoreChecks(checks: FileCheck[]) {
  const penalty = checks.reduce((sum, check) => {
    if (check.state === "fail") return sum + 32;
    if (check.state === "warn") return sum + 14;
    return sum;
  }, 0);

  return clamp(100 - penalty);
}

function inspectImage(file: File): Promise<ImageStats> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const sampleSize = 64;

      canvas.width = sampleSize;
      canvas.height = sampleSize;

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("无法读取图片"));
        return;
      }

      ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
      const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      const values: number[] = [];

      for (let i = 0; i < pixels.length; i += 4) {
        values.push(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
      }

      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance =
        values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        contrast: Math.sqrt(variance),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };

    image.src = url;
  });
}

function buildFileChecks(file: File, kind: UploadedKind, stats?: ImageStats): FileCheck[] {
  const sizeMb = file.size / 1024 / 1024;

  if (kind === "unsupported") {
    return [
      {
        label: "文件格式",
        detail: "请上传 PDF、PNG、JPG 或 WebP 简历。",
        state: "fail",
      },
    ];
  }

  const checks: FileCheck[] = [
    {
      label: "文件大小",
      detail: sizeMb <= 8 ? `${formatFileSize(file.size)}，适合识别。` : `${formatFileSize(file.size)}，建议压缩后再识别。`,
      state: sizeMb <= 8 ? "pass" : sizeMb <= 15 ? "warn" : "fail",
    },
  ];

  if (kind === "pdf") {
    return [
      ...checks,
      {
        label: "PDF 预览",
        detail: "已准备预览；后续可接 OCR 或 PDF 文本解析 API。",
        state: "pass",
      },
      {
        label: "识别方式",
        detail: "建议后端先抽取文字，失败时再转图片走视觉模型。",
        state: "warn",
      },
    ];
  }

  if (!stats) return checks;

  return [
    ...checks,
    {
      label: "图片清晰度",
      detail:
        Math.min(stats.width, stats.height) >= 1000
          ? `${stats.width}x${stats.height}，清晰度足够。`
          : `${stats.width}x${stats.height}，可能影响小字识别。`,
      state: Math.min(stats.width, stats.height) >= 1000 ? "pass" : "warn",
    },
    {
      label: "方向比例",
      detail: stats.height >= stats.width ? "竖版简历，适合识别。" : "横向图片，建议旋转或重新截图。",
      state: stats.height >= stats.width ? "pass" : "warn",
    },
    {
      label: "明暗对比",
      detail:
        stats.contrast >= 34
          ? "文字和背景区分明显。"
          : "对比度偏低，建议使用原图或提高亮度。",
      state: stats.contrast >= 34 ? "pass" : "warn",
    },
  ];
}

async function recognizeResumeFromFile(file: File): Promise<ResumeParseResult> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/resume/parse", {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || "AI 解析失败");
  }

  return data as ResumeParseResult;
}

function checkStateClass(state: CheckState) {
  if (state === "pass") return "bg-[#e4f3ed] text-[#276653]";
  if (state === "warn") return "bg-[#fff1c9] text-[#7a5711]";
  return "bg-[#ffe3dc] text-[#963a2e]";
}

function checkStateLabel(state: CheckState) {
  if (state === "pass") return "通过";
  if (state === "warn") return "注意";
  return "重传";
}

const PARSE_PROGRESS: Record<ParseStage, ParseProgress> = {
  idle: { stage: "idle", value: 0, label: "等待上传简历" },
  uploading: { stage: "uploading", value: 28, label: "正在上传到安全解析通道" },
  extracting: { stage: "extracting", value: 62, label: "豆包正在读取 PDF / 图片内容" },
  structuring: { stage: "structuring", value: 86, label: "正在整理教育、项目和技能模块" },
  done: { stage: "done", value: 100, label: "解析完成，正在生成诊断" },
  error: { stage: "error", value: 100, label: "解析失败，请换更清晰的文件再试" },
};

function ResumeParseProgress({ progress }: { progress: ParseProgress }) {
  if (progress.stage === "idle") return null;

  return (
    <section className="mt-3 rounded-lg border border-[#ded6ca] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{progress.label}</p>
        <span className="text-xs font-black text-[#7a5711]">{progress.value}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-md bg-[#ebe7df]">
        <div
          className="h-full rounded-md bg-[#f2bd4a] transition-[width] duration-500"
          style={{ width: `${progress.value}%` }}
        />
      </div>
    </section>
  );
}

function ResumeFilePreview({
  file,
  previewUrl,
}: {
  file: UploadedResumeFile | null;
  previewUrl: string;
}) {
  if (!file) {
    return (
      <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-[#d8d0c3] bg-white px-8 text-center">
        <div>
          <p className="text-sm font-black">等待上传</p>
          <p className="mt-2 text-xs leading-5 text-[#7b7063]">
            PDF、PNG、JPG、WebP
          </p>
        </div>
      </div>
    );
  }

  if (file.kind === "image") {
    return (
      <div className="overflow-hidden rounded-lg border border-[#ded6ca] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="简历预览" className="max-h-[420px] w-full object-contain" />
      </div>
    );
  }

  if (file.kind === "pdf") {
    return (
      <object
        data={previewUrl}
        type="application/pdf"
        className="h-[420px] w-full rounded-lg border border-[#ded6ca] bg-white"
      >
        <div className="grid h-[220px] place-items-center rounded-lg border border-[#ded6ca] bg-white px-6 text-center text-sm text-[#5b5147]">
          当前浏览器不支持内嵌 PDF 预览。
        </div>
      </object>
    );
  }

  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-[#ded6ca] bg-white px-8 text-center">
      <p className="text-sm font-semibold text-[#963a2e]">这个格式暂时不能识别</p>
    </div>
  );
}

export function ResumeReviewApp({ framed = true }: { framed?: boolean }) {
  const [uploadedFile, setUploadedFile] = useState<UploadedResumeFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileChecks, setFileChecks] = useState<FileCheck[]>([]);
  const [recognizedText, setRecognizedText] = useState("");
  const [recognitionNotice, setRecognitionNotice] = useState("");
  const [parseProgress, setParseProgress] = useState<ParseProgress>(PARSE_PROGRESS.idle);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  const role = ROLES[0];
  const readyScore = fileChecks.length > 0 ? scoreChecks(fileChecks) : 0;
  const canRecognize = Boolean(uploadedFile && uploadedFile.kind !== "unsupported");
  const canAnalyze = recognizedText.trim().length >= 60;
  const analysis = useMemo(
    () => (canAnalyze ? analyzeResume(recognizedText, role) : null),
    [canAnalyze, recognizedText, role],
  );

  useEffect(() => {
    if (!showResult) return;

    const timer = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [showResult]);

  useEffect(() => {
    if (!previewUrl) return;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const kind = getFileKind(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    const nextFile = {
      file,
      kind,
      name: file.name,
      size: formatFileSize(file.size),
    };

    setUploadedFile(nextFile);
    setPreviewUrl(nextPreviewUrl);
    setRecognizedText("");
    setRecognitionNotice("");
    setParseProgress(PARSE_PROGRESS.idle);
    setShowResult(false);
    setIsRecognizing(false);

    if (kind === "image") {
      try {
        const stats = await inspectImage(file);
        setFileChecks(buildFileChecks(file, kind, stats));
      } catch {
        setFileChecks([
          {
            label: "图片读取",
            detail: "图片预检失败，建议重新导出清晰图片。",
            state: "fail",
          },
        ]);
      }
    } else {
      setFileChecks(buildFileChecks(file, kind));
    }

    event.target.value = "";
  };

  const runRecognition = async () => {
    if (!uploadedFile || uploadedFile.kind === "unsupported") return;

    setIsRecognizing(true);
    setShowResult(false);
    setRecognitionNotice("");
    setParseProgress(PARSE_PROGRESS.uploading);

    const timers = [
      window.setTimeout(() => setParseProgress(PARSE_PROGRESS.extracting), 520),
      window.setTimeout(() => setParseProgress(PARSE_PROGRESS.structuring), 1800),
    ];

    try {
      const parsed = await recognizeResumeFromFile(uploadedFile.file);
      timers.forEach((timer) => window.clearTimeout(timer));
      setParseProgress(PARSE_PROGRESS.done);
      setRecognizedText(`${parsed.resume_text.trim()}\n\n识别来源：${uploadedFile.file.name}`);
      setRecognitionNotice(
        [
          "AI 解析完成，已按简历原文生成诊断。",
          parsed.summary ? `概要：${parsed.summary}` : "",
          parsed.warnings?.length ? `注意：${parsed.warnings.join("；")}` : "",
        ].filter(Boolean).join("\n"),
      );
      setShowResult(true);
    } catch (error) {
      timers.forEach((timer) => window.clearTimeout(timer));
      setParseProgress(PARSE_PROGRESS.error);
      setRecognitionNotice(error instanceof Error ? error.message : "AI 解析失败，请稍后重试。");
    } finally {
      setIsRecognizing(false);
    }
  };

  const runDemoRecognition = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setFileChecks([]);
    setRecognizedText(SAMPLE_RESUME);
    setRecognitionNotice("已使用演示识别结果生成诊断。");
    setParseProgress(PARSE_PROGRESS.done);
    setShowResult(true);
  };

  const reset = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setFileChecks([]);
    setRecognizedText("");
    setRecognitionNotice("");
    setParseProgress(PARSE_PROGRESS.idle);
    setIsRecognizing(false);
    setShowResult(false);
  };

  return (
    <main
      className={[
        framed ? "phone-frame" : "",
        "min-h-dvh bg-[#fffdf8] text-[#242632]",
      ].join(" ")}
    >
      <header className="px-5 pb-4 pt-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#b05c4d]">
              RESUME CLINIC
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              简历诊断室
            </h1>
          </div>
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-md border border-[#d8d0c3] px-3 text-xs font-bold active:translate-y-0.5"
          >
            清空
          </button>
        </div>
      </header>

      <ResumeDeskArt score={analysis?.score ?? readyScore} />

      <section className="border-b border-[#eee5d7] bg-white px-5 py-4">
        <div className="grid grid-cols-4 gap-3">
          {(analysis?.scores ?? [
            { key: "structure", label: "结构", value: 0, color: "#74b89d" },
            { key: "impact", label: "证据", value: 0, color: "#f2bd4a" },
            { key: "match", label: "匹配", value: 0, color: "#7c9cbf" },
            { key: "clarity", label: "表达", value: 0, color: "#f07c6c" },
          ]).map((item) => (
            <ScorePill key={item.key} item={item as ScoreItem} />
          ))}
        </div>
      </section>

      <section className="px-5 py-5">
        <div className="grid grid-cols-[1fr_112px] gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-11 rounded-lg border border-[#242632] bg-white text-sm font-bold active:translate-y-0.5"
          >
            上传简历
          </button>
          <button
            type="button"
            onClick={runDemoRecognition}
            className="h-11 rounded-lg bg-[#fff1b8] text-sm font-bold active:translate-y-0.5"
          >
            演示
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf,.pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={handleUpload}
        />

        <div className="mt-3">
          <ResumeFilePreview file={uploadedFile} previewUrl={previewUrl} />
        </div>

        {uploadedFile && (
          <section className="mt-3 rounded-lg border border-[#ded6ca] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{uploadedFile.name}</p>
                <p className="mt-1 text-xs font-semibold text-[#7b7063]">
                  {uploadedFile.kind.toUpperCase()} · {uploadedFile.size}
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#fff1b8] text-lg font-black">
                {readyScore}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {fileChecks.map((check) => (
                <div
                  key={check.label}
                  className="grid grid-cols-[48px_1fr] gap-3 rounded-lg bg-[#fffaf2] p-3"
                >
                  <span
                    className={[
                      "h-6 rounded-md px-2 text-center text-[11px] font-bold leading-6",
                      checkStateClass(check.state),
                    ].join(" ")}
                  >
                    {checkStateLabel(check.state)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{check.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6a5f52]">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          disabled={!canRecognize || isRecognizing}
          onClick={runRecognition}
          className="mt-3 h-12 w-full rounded-lg bg-[#242632] text-sm font-bold text-white disabled:bg-[#c8c1b6] active:translate-y-0.5"
        >
          {isRecognizing ? "AI 解析中" : "AI 解析并诊断"}
        </button>

        <ResumeParseProgress progress={parseProgress} />

        {recognitionNotice && (
          <p className="mt-3 rounded-lg bg-[#fff8ee] p-3 text-xs font-semibold leading-5 text-[#7b6042]">
            {recognitionNotice}
          </p>
        )}
      </section>

      {showResult && analysis && (
        <>
          <section
            ref={resultRef}
            className="border-y border-[#eee5d7] bg-white px-5 py-5"
          >
            <div className="grid grid-cols-[1fr_104px] gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#9b6b1a]">
                  DIAGNOSIS
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {analysis.score >= 82
                    ? "简历已经能进面试池"
                    : analysis.score >= 66
                      ? "有素材，表达还要压实"
                      : "先补结构和证据"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5b5147]">
                  检出 {analysis.detectedSections.length} 个模块，{analysis.stats.numbers} 个数字证据，
                  {analysis.stats.roleHits} 个岗位关键词。
                </p>
              </div>
              <div className="grid place-items-center rounded-lg border border-[#242632] bg-[#fff1b8]">
                <div className="text-center">
                  <p className="text-[11px] font-bold">诊断分</p>
                  <p className="text-4xl font-black">{analysis.score}</p>
                </div>
              </div>
            </div>
          </section>

          <ResumeRadarChart scores={analysis.scores} />

          <section className="px-5 py-5">
            <p className="text-sm font-bold">优先修改</p>
            <div className="mt-3 grid gap-3">
              {analysis.suggestions.slice(0, 5).map((suggestion) => (
                <article
                  key={suggestion.title}
                  className="rounded-lg border border-[#e7dfd1] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-black leading-6">
                      {suggestion.title}
                    </h3>
                    <span
                      className={[
                        "shrink-0 rounded-md px-2 py-1 text-[11px] font-bold",
                        severityClass(suggestion.severity),
                      ].join(" ")}
                    >
                      {severityLabel(suggestion.severity)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5b5147]">
                    {suggestion.reason}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#242632]">
                    {suggestion.fix}
                  </p>
                  <p className="mt-2 rounded-lg bg-[#fff8ee] p-3 text-sm leading-6 text-[#5a4b35]">
                    {suggestion.example}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[#eee5d7] px-5 py-5">
            <p className="text-sm font-bold">保留优势</p>
            <div className="mt-3 grid gap-2">
              {analysis.strengths.map((item) => (
                <p
                  key={item}
                  className="rounded-lg border border-[#e7dfd1] bg-white px-3 py-2 text-sm leading-6"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="border-t border-[#eee5d7] px-5 py-5">
            <p className="text-sm font-bold">今晚只改这 4 处</p>
            <div className="mt-3 grid gap-2">
              {analysis.quickFixes.map((item, index) => (
                <div
                  key={item}
                  className="grid grid-cols-[28px_1fr] items-start rounded-lg border border-[#e7dfd1] bg-white p-3"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[#242632] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[#3b3833]">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
