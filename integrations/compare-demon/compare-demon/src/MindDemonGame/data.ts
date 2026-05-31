// 「比较心魔」认知重构内容
// 设计依据：CBT 认知重建（cognitive restructuring）。
// 每个「念头」对应一种认知扭曲；三类反击卡分别训练一种健康应对：
//   fact   事实卡 → 理性核查（检验证据、纠正绝对化）
//   action 行动卡 → 行为激活（把焦虑转成下一小步）
//   comfort 安慰卡 → 自我关怀（像对朋友一样对自己）
// 三张卡都能击退心魔——没有「错答案」，重点是练习重构本身。

export type CardKind = "fact" | "action" | "comfort";

export interface CardMeta {
  kind: CardKind;
  label: string; // 卡名
  hint: string; // 副标题：这是哪种思维工具
  glyph: string; // 图标
  color: string; // 强调色
  soft: string; // 浅底色
}

// 三类反击卡的元数据（色彩呼应 Another Me 情绪色）
export const CARD_META: Record<CardKind, CardMeta> = {
  fact: {
    kind: "fact",
    label: "事实卡",
    hint: "看清事实",
    glyph: "🔍",
    color: "#5f9e8f",
    soft: "#eef6f2",
  },
  action: {
    kind: "action",
    label: "行动卡",
    hint: "转成下一步",
    glyph: "⚡",
    color: "#e89a3c",
    soft: "#fdf3e3",
  },
  comfort: {
    kind: "comfort",
    label: "安慰卡",
    hint: "善待自己",
    glyph: "🤍",
    color: "#7c9cbf",
    soft: "#eef2f8",
  },
};

export const CARD_ORDER: CardKind[] = ["fact", "action", "comfort"];

export interface CardContent {
  line: string; // 玩家「打出」这张卡时说的话
  reframe: string; // 打出后的重构解说（教育性反馈）
  tool: string; // 一句话点名这是什么思维工具
}

export interface DemonThought {
  id: string;
  distortion: string; // 认知扭曲名
  taunt: string; // 心魔抛出的念头（扎心、第一人称代入）
  source: string; // 这种念头常在什么场景冒出来
  cards: Record<CardKind, CardContent>;
  demonReply: string; // 被击退后心魔的服软反应
}

// 5 个关卡：刷朋友圈/同学群最常见的 5 种比较念头
export const THOUGHTS: DemonThought[] = [
  {
    id: "all-ashore",
    distortion: "以偏概全 · 选择性关注",
    taunt: "同学都上岸了，就你还在原地打转。",
    source: "刷到第 3 个「上岸」朋友圈的深夜",
    cards: {
      fact: {
        line: "朋友圈是精选集——上岸的高调发，没上岸的默默刷。「都」是我自己脑补的。",
        reframe:
          "你看到的是幸存者偏差：晒结果的被你看见，沉默的大多数被你忽略了。「都」这种绝对化的词，往往是心魔最爱的放大镜。",
        tool: "思维工具：检验证据 — 我说的「都」，真有数据支持吗？",
      },
      action: {
        line: "与其再往下刷，不如关掉手机，写下我这个月真正完成的 3 件事。",
        reframe:
          "比较会把你钉在原地空转。把注意力从「别人到哪了」挪到「我下一步做什么」，焦虑就有了出口。",
        tool: "思维工具：行为激活 — 焦虑时，做一件具体的小事。",
      },
      comfort: {
        line: "别人的时区不是我的 deadline。我可以慢，但我没有停。",
        reframe:
          "每个人的节奏不同，起点、资源、运气也不同。允许自己用自己的速度，不是认输，是清醒。",
        tool: "思维工具：自我关怀 — 给自己一句对朋友才会说的话。",
      },
    },
    demonReply: "唔……我刚刚确实只给你看了那几条。",
  },
  {
    id: "am-i-trash",
    distortion: "贴标签 · 全或无思维",
    taunt: "这都做不好，我是不是废了？",
    source: "一次失败、一条没回的消息之后",
    cards: {
      fact: {
        line: "「废了」是个标签，不是事实。一件事没做好，不等于这个人没用。",
        reframe:
          "贴标签是把一次行为，夸大成对整个人的判决。把「我是个废物」换成「我这件事还没做好」，事情立刻变得可以处理。",
        tool: "思维工具：区分行为与身份 — 评价事，不审判人。",
      },
      action: {
        line: "先把「我废了」改写成「我这件事还没做好」，然后只挑一小步去做。",
        reframe:
          "全或无思维让你觉得「不完美=失败」。其实进步藏在中间地带——做成一小步，就推翻了「彻底完蛋」的剧本。",
        tool: "思维工具：行为激活 — 用一个小动作打破「全完了」。",
      },
      comfort: {
        line: "如果朋友这样骂自己，我会附和他「你真废」吗？对自己也温柔点。",
        reframe:
          "我们对自己往往比对任何人都狠。试着把对朋友的善意，分一点给自己——这不是放纵，是公平。",
        tool: "思维工具：自我关怀 — 换位：你会这样对朋友说话吗？",
      },
    },
    demonReply: "好吧，一次没做好……好像确实不能定一个人的生死。",
  },
  {
    id: "useless-major",
    distortion: "灾难化 · 否定积极",
    taunt: "我这个专业根本没用，这辈子都没指望了。",
    source: "看到「天坑专业」热搜、对比别人薪资时",
    cards: {
      fact: {
        line: "「没用」是结论不是证据。专业给我的能力，换个场景未必没用。",
        reframe:
          "灾难化会把「现在难」推演成「永远完」。把「这辈子」拆回「眼下这一年」，恐惧就缩回了它真实的大小。",
        tool: "思维工具：去灾难化 — 最坏没那么坏，可能性≠确定性。",
      },
      action: {
        line: "去查 3 个这个专业出身、却转去别的领域的人，看看他们都做了什么。",
        reframe:
          "用真实案例打断脑内小剧场。你会发现路不是被专业「选定」的，而是一步步「走」出来的。",
        tool: "思维工具：收集反例 — 找证据，而不是找认同。",
      },
      comfort: {
        line: "此刻的迷茫，不等于未来的判决。我还在路上，没到终点。",
        reframe:
          "迷茫是探索的副产品，不是失败的证明。允许自己暂时没有答案，本身就是一种成熟。",
        tool: "思维工具：自我关怀 — 接纳「暂时不知道」。",
      },
    },
    demonReply: "「这辈子」……是我说得太满了。",
  },
  {
    id: "never-catch-up",
    distortion: "不公平比较 · 放大缩小",
    taunt: "TA 比你优秀那么多，你永远追不上。",
    source: "看大佬的简历、作品、动态时",
    cards: {
      fact: {
        line: "我在拿自己的幕后，比 TA 的高光。这场比较的起点本来就不公平。",
        reframe:
          "你看到的是别人的精修成片，记得的是自己的所有 NG 镜头。放大别人、缩小自己，是心魔的惯用伎俩。",
        tool: "思维工具：识别不公平比较 — 幕后 vs 高光。",
      },
      action: {
        line: "把「追上 TA」换成「今天比昨天的我多会一点」。",
        reframe:
          "和别人比，终点永远在移动；和昨天的自己比，每一步都算数。换个参照物，焦虑就变成了进度条。",
        tool: "思维工具：换参照系 — 唯一对手是昨天的自己。",
      },
      comfort: {
        line: "成长不是赛跑，没有「永远」。我只跟自己比。",
        reframe:
          "「永远追不上」是绝对化的诅咒。人生不是单行赛道，你有自己的方向，不必跑别人的路。",
        tool: "思维工具：拆解「永远/从不」这类绝对词。",
      },
    },
    demonReply: "「永远」这个词，好像是我吓唬你用的。",
  },
  {
    id: "wasted-effort",
    distortion: "否定积极 · 全或无思维",
    taunt: "现在还没成果，说明你之前的努力全白费了。",
    source: "付出很久却迟迟看不到回报时",
    cards: {
      fact: {
        line: "没立刻见效，不等于白费。很多积累是延迟显现的。",
        reframe:
          "把「还没出结果」直接判成「努力归零」，是否定了一路上真实发生的成长。慢热≠没用。",
        tool: "思维工具：区分「延迟」与「无效」。",
      },
      action: {
        line: "写下这段过程里，我已经获得的、考试考不出来的东西。",
        reframe:
          "把隐性收获写出来，它们就从「感觉没有」变成「白纸黑字的有」。证据一旦可见，心魔就难再抵赖。",
        tool: "思维工具：盘点过程收益 — 让看不见的被看见。",
      },
      comfort: {
        line: "种子在土里的时候，看起来也像什么都没发生。",
        reframe:
          "成长有它自己的时区。看不见的生长，不代表没有生长。对还在积累的自己，多一点耐心。",
        tool: "思维工具：自我关怀 — 允许「还没到时候」。",
      },
    },
    demonReply: "也许……我把「还没」错说成了「白费」。",
  },
];

// 通关画像：按玩家最常打出的卡类型，给一张「应对风格」小画像
export interface PlayerProfile {
  title: string;
  desc: string;
  takeaway: string; // 带走的话
}

export const PROFILES: Record<CardKind | "balanced", PlayerProfile> = {
  fact: {
    title: "理性核查者",
    desc: "你习惯用事实拆穿心魔的夸张——证据在哪？「都」「永远」是真的吗？这份冷静，是焦虑最怕的东西。",
    takeaway: "下次心魔再放大其词，先问一句：这有证据吗？",
  },
  action: {
    title: "行动派",
    desc: "你不困在念头里，而是把焦虑变成下一步。比起想清楚，你更信「做一点，就松一点」。",
    takeaway: "焦虑时别盯着它看，去做一件具体的小事。",
  },
  comfort: {
    title: "自我关怀者",
    desc: "你懂得像对朋友一样对自己说话。在一个习惯自我攻击的世界里，对自己温柔是稀缺的力量。",
    takeaway: "你对朋友的那份善意，自己也值得拥有一份。",
  },
  balanced: {
    title: "灵活应对者",
    desc: "事实、行动、温柔，你都用得上。能在不同处境里换不同的工具，是认知重构最成熟的样子。",
    takeaway: "比较来袭时，你已经有一整套工具，不必硬扛。",
  },
};

// 开场与通关文案
export const INTRO = {
  name: "比较心魔",
  line1: "我是你的比较心魔。",
  line2: "我专挑你深夜刷朋友圈、刷同学群的时候出现，",
  line3: "把别人的高光，照成你身上的阴影。",
  cta: "来，看你能不能驯服我。",
};

export const OUTRO = {
  title: "心魔被你驯服了",
  line: "它不会永远消失——下次刷手机时还可能冒头。但现在你手里有牌了：看清事实、转成行动、善待自己。",
  again: "再练一局",
};
