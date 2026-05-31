// GET /api/videos — Video catalog + recommendation
import { parseJsonField, hasDB } from '../lib/d1-client.js';
import { matchVideos } from '../lib/video-matcher.js';

// Fallback seed videos when D1 not available
const SEED_VIDEOS = [
  { id: 1, title: '26届如何规划大学最后一年', url: 'https://www.douyin.com/video/7485728639233854777', creator: '兔老师讲就业', tags: ['规划', '秋招', '实习'], highlight: '校招5次关键机会。' },
  { id: 2, title: '面试被问得答不上来你就这么说', url: 'https://www.douyin.com/video/7560637652639288610', creator: '', tags: ['面试', '应急'], highlight: '应急四步法。' },
  { id: 3, title: '谈薪技巧：下次谈薪直接多要20%', url: 'https://www.douyin.com/video/7570691211825477449', creator: '', tags: ['谈薪', '薪资', 'offer'], highlight: '四大谈薪策略。' },
  { id: 4, title: '秋招全攻略：STAR法则+精准投递', url: 'https://www.douyin.com/video/7553635916149984550', creator: '', tags: ['秋招', '简历', 'STAR'], highlight: 'STAR法则实操。' },
  { id: 5, title: '考公务员好还是央国企好', url: 'https://www.douyin.com/video/7565676824459169075', creator: '', tags: ['考公', '央国企', '体制内'], highlight: '应届生身份很关键。' },
  { id: 6, title: '考研失利，如何抓住秋招尾巴', url: 'https://www.douyin.com/video/7564626938569968932', creator: '', tags: ['考研失利', '秋招'], highlight: '三步法转身。' },
  { id: 7, title: '普通学生也可以进入互联网大厂', url: 'https://www.douyin.com/video/7579162987756424484', creator: '苏摩', tags: ['大厂', '实习', '内推'], highlight: '内推、外包转正等侧门路径。' },
  { id: 8, title: '25届找不到工作？2周快速找到工作', url: 'https://www.douyin.com/video/7553219525370957115', creator: '', tags: ['焦虑', '找工作'], highlight: '确定岗位、AI做简历、先线上再线下。' },
  { id: 9, title: '零经验转行做短视频运营', url: 'https://www.douyin.com/video/7491341168563768636', creator: '', tags: ['转行', '零经验'], highlight: '学会剪映+有自媒体经验即可。' },
  { id:10, title: '应届大专生纠结升本还是就业', url: 'https://www.douyin.com/note/7566550766883786034', creator: '', tags: ['大专', '升本'], highlight: '专升本与就业的决策框架。' },
];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  try {
    let videos;
    if (hasDB(env)) {
      const { results } = await env.DB.prepare('SELECT * FROM video_resources ORDER BY id').all();
      videos = (results || []).map(r => ({ ...r, tags: parseJsonField(r.tags_json, []) }));
    } else {
      videos = SEED_VIDEOS;
    }

    if (q) {
      const matched = matchVideos(q, videos.map(v => ({ ...v, tags_json: JSON.stringify(v.tags) })));
      return Response.json({ query: q, results: matched.slice(0, 5).map(r => ({ ...r, tags: r.tags || parseJsonField(r.tags_json, []) })) });
    }

    const tagFilter = url.searchParams.get('tags') || '';
    if (tagFilter) {
      const tl = tagFilter.split(',').map(t => t.trim().toLowerCase());
      videos = videos.filter(v => v.tags.some(t => tl.includes(t.toLowerCase())));
    }
    return Response.json(videos);
  } catch (e) {
    if (q) return Response.json({ query: q, results: matchVideos(q, SEED_VIDEOS.map(v => ({ ...v, tags_json: JSON.stringify(v.tags) }))).slice(0, 5) });
    return Response.json(SEED_VIDEOS);
  }
}
