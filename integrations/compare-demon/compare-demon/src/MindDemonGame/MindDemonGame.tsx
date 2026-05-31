// 「比较心魔」认知重构小游戏 · 自包含组件
// 依赖：仅 React。样式内联 + 注入式 <style>（class 前缀 mdg-，不污染宿主）。
// 复制整个 components/MindDemonGame/ 目录即可用到任何 React 项目。

import { useCallback, useMemo, useState } from "react";
import {
  CARD_META,
  CARD_ORDER,
  INTRO,
  OUTRO,
  PROFILES,
  THOUGHTS,
  type CardKind,
} from "./data";

// 沿用 Another Me 设计 token
const C = {
  bg: "#ffffff",
  fg: "#1a1a1a",
  muted: "#8a8a8a",
  line: "#ececec",
  brand: "#ffb84c",
  fierce: "#3a3540", // 心魔嚣张时的深色
  tame: "#ffcc9e", // 心魔被驯服时的暖色
};

type Phase = "intro" | "playing" | "outro";

// hex → rgb 线性插值，t=1 取 a，t=0 取 b
function mix(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const r = ca.map((v, i) => Math.round(cb[i] + (v - cb[i]) * t));
  return `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
}

export function MindDemonGame() {
  const total = THOUGHTS.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState<CardKind | null>(null);
  const [picks, setPicks] = useState<CardKind[]>([]);

  const thought = THOUGHTS[stage];

  // 气焰：选卡即刻掉一格，给即时反馈；通关归 0
  const dread =
    phase === "outro" ? 0 : 1 - (stage + (selected ? 1 : 0)) / total;

  const start = useCallback(() => {
    setPhase("playing");
    setStage(0);
    setSelected(null);
    setPicks([]);
  }, []);

  const pick = useCallback(
    (kind: CardKind) => {
      if (selected) return;
      setSelected(kind);
      setPicks((p) => [...p, kind]);
    },
    [selected],
  );

  const next = useCallback(() => {
    if (stage + 1 >= total) {
      setPhase("outro");
      return;
    }
    setStage((s) => s + 1);
    setSelected(null);
  }, [stage, total]);

  // 通关画像：最常打的卡类型，并列时算「灵活」
  const profileKey = useMemo<CardKind | "balanced">(() => {
    const tally: Record<CardKind, number> = { fact: 0, action: 0, comfort: 0 };
    picks.forEach((k) => (tally[k] += 1));
    const max = Math.max(tally.fact, tally.action, tally.comfort);
    const top = CARD_ORDER.filter((k) => tally[k] === max);
    return top.length === 1 ? top[0] : "balanced";
  }, [picks]);

  return (
    <div className="mdg-root">
      <StyleTag />
      {phase === "intro" && <Intro onStart={start} />}
      {phase === "playing" && (
        <section className="mdg-screen">
          <ProgressBar cleared={stage + (selected ? 1 : 0)} total={total} />
          <DemonBlob dread={dread} tamed={false} />
          <Taunt
            key={thought.id}
            distortion={thought.distortion}
            source={thought.source}
            text={thought.taunt}
          />
          {!selected ? (
            <CardDeck onPick={pick} thoughtId={thought.id} />
          ) : (
            <Reframe
              kind={selected}
              demonReply={thought.demonReply}
              content={thought.cards[selected]}
              isLast={stage + 1 >= total}
              onNext={next}
            />
          )}
        </section>
      )}
      {phase === "outro" && (
        <Outro profileKey={profileKey} onReplay={start} />
      )}
    </div>
  );
}

// ---------- 开场 ----------
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="mdg-screen mdg-intro">
      <DemonBlob dread={1} tamed={false} />
      <p className="mdg-eyebrow">认知重构小游戏</p>
      <h2 className="mdg-title">{INTRO.name}</h2>
      <p className="mdg-intro-lines">
        {INTRO.line1}
        <br />
        {INTRO.line2}
        <br />
        {INTRO.line3}
      </p>
      <p className="mdg-intro-cta">{INTRO.cta}</p>
      <button className="mdg-btn mdg-btn-primary" onClick={onStart}>
        开始驯服
      </button>
      <p className="mdg-foot">5 个念头 · 没有标准答案，重点是练习</p>
    </section>
  );
}

// ---------- 心魔形象 ----------
function DemonBlob({ dread, tamed }: { dread: number; tamed: boolean }) {
  const body = mix(C.fierce, C.tame, dread);
  const glow = mix("#6b5b7a", C.brand, dread);
  const scale = 0.78 + dread * 0.22; // 越嚣张越大
  return (
    <div className="mdg-stage" aria-hidden>
      <span className="mdg-glow" style={{ background: glow }} />
      <span
        className="mdg-blob"
        style={{ background: body, transform: `scale(${scale})` }}
      >
        <span className="mdg-eyes" data-tamed={tamed || dread < 0.001}>
          <i />
          <i />
        </span>
      </span>
    </div>
  );
}

// ---------- 气焰进度条 ----------
function ProgressBar({ cleared, total }: { cleared: number; total: number }) {
  const pct = Math.round((cleared / total) * 100);
  return (
    <div className="mdg-progress">
      <div className="mdg-progress-row">
        <span>心魔气焰</span>
        <span>
          {cleared}/{total} 已重构
        </span>
      </div>
      <div
        className="mdg-track"
        role="progressbar"
        aria-valuenow={100 - pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="mdg-fill" style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

// ---------- 念头气泡 ----------
function Taunt({
  distortion,
  source,
  text,
}: {
  distortion: string;
  source: string;
  text: string;
}) {
  return (
    <div className="mdg-taunt">
      <p className="mdg-taunt-text">“{text}”</p>
      <div className="mdg-taunt-meta">
        <span className="mdg-tag">{distortion}</span>
        <span className="mdg-source">{source}</span>
      </div>
    </div>
  );
}

// ---------- 反击卡组 ----------
function CardDeck({
  onPick,
  thoughtId,
}: {
  onPick: (k: CardKind) => void;
  thoughtId: string;
}) {
  const t = THOUGHTS.find((x) => x.id === thoughtId)!;
  return (
    <div className="mdg-deck">
      <p className="mdg-deck-hint">打出一张反击卡 →</p>
      {CARD_ORDER.map((kind) => {
        const m = CARD_META[kind];
        return (
          <button
            key={kind}
            className="mdg-card"
            style={{ borderColor: m.soft }}
            onClick={() => onPick(kind)}
          >
            <span className="mdg-card-icon" style={{ background: m.soft }}>
              {m.glyph}
            </span>
            <span className="mdg-card-body">
              <span className="mdg-card-head">
                <span className="mdg-card-name" style={{ color: m.color }}>
                  {m.label}
                </span>
                <span className="mdg-card-hint">{m.hint}</span>
              </span>
              <span className="mdg-card-line">{t.cards[kind].line}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- 打出后的重构反馈 ----------
function Reframe({
  kind,
  content,
  demonReply,
  isLast,
  onNext,
}: {
  kind: CardKind;
  content: { line: string; reframe: string; tool: string };
  demonReply: string;
  isLast: boolean;
  onNext: () => void;
}) {
  const m = CARD_META[kind];
  return (
    <div className="mdg-reframe">
      <div
        className="mdg-played"
        style={{ background: m.soft, borderColor: m.color }}
      >
        <span className="mdg-played-tag" style={{ color: m.color }}>
          {m.glyph} {m.label}
        </span>
        <p className="mdg-played-line">{content.line}</p>
      </div>

      <p className="mdg-demon-reply">心魔：{demonReply}</p>

      <div className="mdg-tool" style={{ borderColor: m.soft }}>
        <p className="mdg-reframe-text">{content.reframe}</p>
        <p className="mdg-tool-tag" style={{ color: m.color }}>
          {content.tool}
        </p>
      </div>

      <button className="mdg-btn mdg-btn-primary" onClick={onNext}>
        {isLast ? "完成驯服" : "面对下一个念头"}
      </button>
    </div>
  );
}

// ---------- 通关 ----------
function Outro({
  profileKey,
  onReplay,
}: {
  profileKey: CardKind | "balanced";
  onReplay: () => void;
}) {
  const p = PROFILES[profileKey];
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(p.takeaway);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [p.takeaway]);

  return (
    <section className="mdg-screen mdg-outro">
      <DemonBlob dread={0} tamed />
      <h2 className="mdg-title">{OUTRO.title}</h2>
      <p className="mdg-outro-line">{OUTRO.line}</p>

      <div className="mdg-profile">
        <p className="mdg-profile-eyebrow">你的应对风格</p>
        <p className="mdg-profile-title">{p.title}</p>
        <p className="mdg-profile-desc">{p.desc}</p>
      </div>

      <div className="mdg-takeaway">
        <p className="mdg-takeaway-label">带走这句话</p>
        <p className="mdg-takeaway-text">「{p.takeaway}」</p>
        <button className="mdg-btn mdg-btn-ghost" onClick={copy}>
          {copied ? "已复制 ✓" : "复制这句话"}
        </button>
      </div>

      <button className="mdg-btn mdg-btn-primary" onClick={onReplay}>
        {OUTRO.again}
      </button>
    </section>
  );
}

// ---------- 注入样式（scoped by mdg- 前缀）----------
function StyleTag() {
  return <style>{CSS}</style>;
}

const CSS = `
.mdg-root{--mdg-fg:${C.fg};--mdg-muted:${C.muted};--mdg-line:${C.line};--mdg-brand:${C.brand};
  font-family:inherit;color:var(--mdg-fg);width:100%;}
.mdg-screen{display:flex;flex-direction:column;align-items:center;gap:18px;
  padding:24px 22px 32px;width:100%;box-sizing:border-box;}
.mdg-intro{justify-content:center;min-height:60vh;text-align:center;}
.mdg-eyebrow{font-size:11px;font-weight:800;letter-spacing:.28em;color:var(--mdg-brand);margin:6px 0 0;}
.mdg-title{font-size:26px;font-weight:800;margin:2px 0 0;}
.mdg-intro-lines{font-size:14px;line-height:1.85;color:#4d4a45;margin:8px 0 0;max-width:28ch;}
.mdg-intro-cta{font-size:14px;font-weight:700;margin:4px 0 6px;}
.mdg-foot{font-size:11px;color:var(--mdg-muted);margin:14px 0 0;}

/* 心魔舞台 */
.mdg-stage{position:relative;display:grid;place-items:center;width:160px;height:160px;
  margin:4px 0 2px;isolation:isolate;}
.mdg-glow{position:absolute;inset:14%;border-radius:50%;filter:blur(26px);opacity:.32;z-index:-1;
  transition:background .6s ease;}
.mdg-blob{position:relative;display:grid;place-items:center;width:118px;height:118px;
  border-radius:42% 58% 56% 44%/50% 46% 54% 50%;
  box-shadow:0 16px 34px rgba(26,26,26,.16),inset 0 -6px 16px rgba(0,0,0,.12);
  transition:background .6s ease,transform .6s ease;
  animation:mdg-morph 9s ease-in-out infinite,mdg-float 4.6s ease-in-out infinite;}
.mdg-eyes{display:flex;gap:16px;align-items:center;}
.mdg-eyes>i{width:11px;height:14px;border-radius:50%;background:#fff;display:block;position:relative;
  box-shadow:0 0 0 0 rgba(255,255,255,.6);transition:all .5s ease;}
.mdg-eyes>i::after{content:"";position:absolute;left:50%;top:55%;width:5px;height:5px;border-radius:50%;
  background:#1a1a1a;transform:translate(-50%,-50%);}
.mdg-eyes[data-tamed="true"]{gap:18px;}
.mdg-eyes[data-tamed="true"]>i{width:14px;height:8px;background:transparent;border-radius:0;
  border-bottom:3px solid #fff;}
.mdg-eyes[data-tamed="true"]>i::after{display:none;}

/* 进度 */
.mdg-progress{width:100%;max-width:360px;}
.mdg-progress-row{display:flex;justify-content:space-between;font-size:11px;font-weight:700;
  color:var(--mdg-muted);margin-bottom:7px;letter-spacing:.04em;}
.mdg-track{height:8px;border-radius:999px;background:var(--mdg-line);overflow:hidden;}
.mdg-fill{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,#6b5b7a,#3a3540);transition:width .55s cubic-bezier(.4,0,.2,1);}

/* 念头气泡 */
.mdg-taunt{width:100%;max-width:360px;text-align:center;animation:mdg-rise .45s ease both;}
.mdg-taunt-text{font-size:19px;font-weight:700;line-height:1.5;margin:0;color:#2b2b33;}
.mdg-taunt-meta{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap;}
.mdg-tag{font-size:11px;font-weight:800;color:#7a6f88;background:#f0edf5;border-radius:999px;padding:4px 10px;}
.mdg-source{font-size:11px;color:var(--mdg-muted);}

/* 卡组 */
.mdg-deck{width:100%;max-width:360px;display:flex;flex-direction:column;gap:10px;
  animation:mdg-rise .5s ease both;}
.mdg-deck-hint{font-size:12px;color:var(--mdg-muted);margin:2px 2px 2px;font-weight:600;}
.mdg-card{display:flex;gap:13px;align-items:flex-start;text-align:left;width:100%;
  background:#fff;border:1.5px solid var(--mdg-line);border-radius:18px;padding:14px;cursor:pointer;
  transition:transform .14s ease,box-shadow .2s ease,border-color .2s ease;
  font-family:inherit;color:inherit;}
.mdg-card:hover{box-shadow:0 10px 26px rgba(26,26,26,.09);transform:translateY(-2px);}
.mdg-card:active{transform:scale(.985);}
.mdg-card-icon{flex:0 0 auto;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;
  font-size:18px;}
.mdg-card-body{display:flex;flex-direction:column;gap:5px;min-width:0;}
.mdg-card-head{display:flex;align-items:baseline;gap:8px;}
.mdg-card-name{font-size:14px;font-weight:800;}
.mdg-card-hint{font-size:11px;color:var(--mdg-muted);}
.mdg-card-line{font-size:13px;line-height:1.6;color:#3a3a40;}

/* 重构反馈 */
.mdg-reframe{width:100%;max-width:360px;display:flex;flex-direction:column;gap:13px;
  animation:mdg-rise .4s ease both;}
.mdg-played{border:1.5px solid;border-radius:16px;padding:13px 15px;}
.mdg-played-tag{font-size:12px;font-weight:800;}
.mdg-played-line{font-size:14px;line-height:1.65;margin:6px 0 0;color:#2b2b33;}
.mdg-demon-reply{font-size:13px;font-style:italic;color:#6b6470;margin:0 4px;}
.mdg-tool{border:1.5px solid var(--mdg-line);border-radius:16px;padding:14px 15px;background:#fcfcfd;}
.mdg-reframe-text{font-size:14px;line-height:1.75;margin:0;color:#34323a;}
.mdg-tool-tag{font-size:12px;font-weight:800;margin:11px 0 0;line-height:1.5;}

/* 通关 */
.mdg-outro{text-align:center;min-height:56vh;justify-content:center;}
.mdg-outro-line{font-size:14px;line-height:1.8;color:#4d4a45;margin:6px 0 0;max-width:30ch;}
.mdg-profile{width:100%;max-width:340px;background:#fbf8f2;border:1.5px solid #f3ead8;border-radius:18px;
  padding:16px 18px;margin-top:6px;}
.mdg-profile-eyebrow{font-size:11px;font-weight:800;letter-spacing:.2em;color:var(--mdg-brand);margin:0;}
.mdg-profile-title{font-size:20px;font-weight:800;margin:6px 0 0;}
.mdg-profile-desc{font-size:13px;line-height:1.75;color:#4d4a45;margin:8px 0 0;}
.mdg-takeaway{width:100%;max-width:340px;margin-top:2px;}
.mdg-takeaway-label{font-size:11px;font-weight:800;letter-spacing:.2em;color:var(--mdg-muted);margin:0 0 6px;}
.mdg-takeaway-text{font-size:16px;font-weight:700;line-height:1.6;color:#2b2b33;margin:0 0 12px;}

/* 按钮 */
.mdg-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 26px;
  border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:inherit;
  transition:transform .15s ease,background .2s ease,opacity .2s ease;}
.mdg-btn:active{transform:scale(.97);}
.mdg-btn-primary{background:#1a1a1a;color:#fff;}
.mdg-btn-primary:hover{background:#000;}
.mdg-btn-ghost{background:#fff;color:#1a1a1a;border:1.5px solid var(--mdg-line);min-height:40px;
  padding:0 18px;font-size:13px;}
.mdg-btn-ghost:hover{border-color:#d8d8d8;}

@keyframes mdg-morph{
  0%,100%{border-radius:42% 58% 56% 44%/50% 46% 54% 50%;}
  33%{border-radius:58% 42% 44% 56%/46% 54% 46% 54%;}
  66%{border-radius:46% 54% 60% 40%/54% 44% 56% 46%;}}
@keyframes mdg-float{0%,100%{margin-top:0;}50%{margin-top:-8px;}}
@keyframes mdg-rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@media (prefers-reduced-motion:reduce){
  .mdg-blob{animation:none;}
  .mdg-taunt,.mdg-deck,.mdg-reframe{animation:none;}}
`;
