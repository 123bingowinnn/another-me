-- Another Me D1 Database Schema
-- Cloudflare D1 supports: FTS5, JSON functions, triggers, indexes

-- 1. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL DEFAULT 'default',
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    references_json TEXT DEFAULT '[]',
    videos_json TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id, created_at);

-- 2. Wiki entries
CREATE TABLE IF NOT EXISTS wiki_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags_json TEXT DEFAULT '[]',
    source_url TEXT DEFAULT '',
    source_title TEXT DEFAULT '',
    vector_tfidf TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. Wiki FTS5 full-text index
CREATE VIRTUAL TABLE IF NOT EXISTS wiki_fts USING fts5(
    title,
    content,
    category,
    tags,
    content=wiki_entries,
    content_rowid=id,
    tokenize='unicode61 remove_diacritics 2'
);

-- FTS sync triggers
CREATE TRIGGER IF NOT EXISTS wiki_ai AFTER INSERT ON wiki_entries BEGIN
    INSERT INTO wiki_fts(rowid, title, content, category, tags)
    VALUES (new.id, new.title, new.content, new.category, new.tags_json);
END;

CREATE TRIGGER IF NOT EXISTS wiki_ad AFTER DELETE ON wiki_entries BEGIN
    INSERT INTO wiki_fts(wiki_fts, rowid, title, content, category, tags)
    VALUES('delete', old.id, old.title, old.content, old.category, old.tags_json);
END;

CREATE TRIGGER IF NOT EXISTS wiki_au AFTER UPDATE ON wiki_entries BEGIN
    INSERT INTO wiki_fts(wiki_fts, rowid, title, content, category, tags)
    VALUES('delete', old.id, old.title, old.content, old.category, old.tags_json);
    INSERT INTO wiki_fts(rowid, title, content, category, tags)
    VALUES (new.id, new.title, new.content, new.category, new.tags_json);
END;

-- 4. Wiki internal links (bidirectional, like Obsidian [[link]])
CREATE TABLE IF NOT EXISTS wiki_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL REFERENCES wiki_entries(id),
    target_id INTEGER NOT NULL REFERENCES wiki_entries(id),
    UNIQUE(source_id, target_id)
);

-- 5. Tree hole letters (replaces localStorage)
CREATE TABLE IF NOT EXISTS tree_letters (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    replies_json TEXT DEFAULT '[]',
    is_seed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 6. Video resources catalog
CREATE TABLE IF NOT EXISTS video_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    creator TEXT DEFAULT '',
    tags_json TEXT DEFAULT '[]',
    highlight TEXT DEFAULT '',
    cover_path TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
);
