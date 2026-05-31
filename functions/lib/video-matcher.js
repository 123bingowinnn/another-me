// Video recommendation engine — keyword + intent matching
// Returns top 3 matching Douyin videos for a given user query

const INTENT_GROUPS = [
  [["实习", "暑期", "intern"], ["实习"]],
  [["简历", "经历", "项目", "STAR"], ["简历", "STAR"]],
  [["面试", "自我介绍", "八股", "群面"], ["面试"]],
  [["谈薪", "薪资", "工资", "offer", "三方", "合同"], ["谈薪", "薪资", "offer"]],
  [["秋招", "春招", "校招", "投递", "提前批"], ["秋招", "春招", "校招", "投递"]],
  [["考公", "考编", "公务员", "事业编", "央国企", "国企", "体制内"], ["考公", "考编", "央国企", "体制内"]],
  [["焦虑", "迷茫", "孤独", "心态", "找不到工作", "害怕"], ["焦虑", "心态", "找工作"]],
  [["转行", "短视频", "运营", "零经验", "跨专业"], ["转行", "短视频运营", "零经验"]],
  [["大专", "升本", "专升本"], ["大专", "升本"]],
  [["规划", "第一份工作", "适合什么", "职业选择", "方向"], ["规划", "第一份工作", "职业选择"]],
];

export function matchVideos(query, videos) {
  if (!query || !videos?.length) return [];

  const q = query.toLowerCase();
  const expanded = new Set();
  INTENT_GROUPS.forEach(([triggers, tags]) => {
    if (triggers.some((t) => q.includes(t))) {
      tags.forEach((tag) => expanded.add(tag));
    }
  });

  const scored = videos.map((video, index) => {
    const searchable = `${video.title} ${(video.tags_json ? JSON.parse(video.tags_json) : []).join(" ")} ${video.highlight || ""} ${video.creator || ""}`.toLowerCase();
    let score = 0;
    expanded.forEach((tag) => {
      if (searchable.includes(tag.toLowerCase())) score += 4;
    });
    q.split(/[^一-龥a-zA-Z0-9]+/)
      .filter((word) => word.length >= 2)
      .forEach((word) => {
        if (searchable.includes(word)) score += 1;
      });
    if (score === 0 && /工作|求职|就业|职业/.test(q) && index < 6) score = 1;
    return { video, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.video);
}
