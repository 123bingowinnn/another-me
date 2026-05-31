# 比较心魔 · 认知重构小游戏

刷朋友圈、刷同学群刷出的**比较焦虑**，用一局小游戏练习**认知重构（CBT 认知重建）**。

心魔抛出典型比较念头（"同学都上岸了""我是不是废了""我专业没用"…），每个对应一种**认知扭曲**；你打出三类反击卡，每张训练一种健康应对：

| 卡 | 思维工具 |
|---|---|
| 🔍 事实卡 | 理性核查——检验证据、拆穿"都/永远"这类绝对化 |
| ⚡ 行动卡 | 行为激活——把焦虑转成下一小步 |
| 🤍 安慰卡 | 自我关怀——像对朋友一样对自己说话 |

打出后给出**重构解说**，心魔气焰下降、形象软化。通关按你最常用的卡给一张**应对风格画像** + 一句可带走的话。三张卡都能击退——没有"错答案"，重点是练习重构本身。

## 技术栈

Vite + React 19 + TypeScript。游戏组件零运行时依赖（只用 React，样式内联），纯前端，无后端。

## 本地运行

```bash
pnpm install   # 或 npm install / yarn
pnpm dev       # 打开终端提示的地址（默认 http://localhost:5173）
```

## 构建与部署

```bash
pnpm build     # 产物在 dist/，纯静态文件
pnpm preview   # 本地预览构建产物
```

`dist/` 是纯静态文件，可直接部署到任意静态托管（Vercel / Netlify / GitHub Pages / 对象存储 / Nginx 等），也可直接用浏览器打开 `dist/index.html`。

## 改内容 / 扩展

- 念头、反击卡话术、重构解说、思维工具：编辑 [src/MindDemonGame/data.ts](src/MindDemonGame/data.ts) 里的 `THOUGHTS`（增删关卡、改文案）。
- 通关画像文案：同文件的 `PROFILES`。
- 开场 / 通关文案：同文件的 `INTRO` / `OUTRO`。
- 视觉（配色、心魔造型、动画）：[src/MindDemonGame/MindDemonGame.tsx](src/MindDemonGame/MindDemonGame.tsx) 底部的 `CSS` 常量与 `C` 色板。

## 嵌入到别的 React 项目

游戏组件自包含、零业务依赖，可整体复用：把 `src/MindDemonGame/` 整个目录拷到目标项目，然后：

```tsx
import { MindDemonGame } from "./MindDemonGame";

<MindDemonGame />
```

不依赖任何 UI 库或全局样式（自带 `<style>` 注入，class 前缀 `mdg-` 不污染宿主）。
