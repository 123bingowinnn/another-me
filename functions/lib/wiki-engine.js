// Lightweight semantic search engine for Wiki
// Layer 1: D1 FTS5 full-text recall (SQL MATCH query)
// Layer 2: TF-IDF cosine similarity re-rank (pure JS, in-memory)
// Tokenizer: Intl.Segmenter (V8 built-in, Chinese word segmentation)

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

export function tokenize(text) {
  return [...segmenter.segment(text)]
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
    .filter((w) => w.length >= 1);
}

// Build query TF-IDF vector from raw text
export function buildQueryVector(queryText) {
  const tokens = tokenize(queryText);
  const tf = {};
  tokens.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });
  const total = tokens.length || 1;
  const vector = {};
  Object.entries(tf).forEach(([word, count]) => {
    vector[word] = count / total;
  });
  return vector;
}

// Cosine similarity between two sparse vectors
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dot = 0, normA = 0, normB = 0;
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const key of keys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

// Full search pipeline: FTS5 recall → TF-IDF re-rank
export function rankByTFIDF(queryText, candidates) {
  const queryVec = buildQueryVector(queryText);

  return candidates
    .map((c) => {
      let docVec = {};
      try {
        docVec = JSON.parse(c.vector_tfidf || '{}');
      } catch { /* keep empty */ }
      return {
        ...c,
        score: cosineSimilarity(queryVec, docVec),
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Tokenize a wiki entry and extract top-50 TF-IDF vector
export function buildDocVector(title, content, corpusStats) {
  const tokens = tokenize((title || '') + ' ' + (content || ''));
  const tf = {};
  tokens.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });
  const total = tokens.length || 1;
  const vector = {};
  Object.entries(tf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .forEach(([word, count]) => {
      const idf = corpusStats?.totalDocs
        ? Math.log(corpusStats.totalDocs / ((corpusStats.docFreq && corpusStats.docFreq[word]) || 1))
        : 1;
      vector[word] = (count / total) * idf;
    });
  return vector;
}

// Build FTS5 query string from user input
export function buildFTSQuery(queryText) {
  const words = tokenize(queryText);
  if (!words.length) return null; // signals caller to skip FTS5
  return words
    .map((w) => `"${w.replace(/"/g, '""')}"`)
    .join(' OR ');
}

// Parse [[wiki-link]] references from markdown content
export function extractWikiLinks(content) {
  const links = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}
