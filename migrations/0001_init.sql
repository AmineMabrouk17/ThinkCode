-- ThinkCode foundation schema (D1 / SQLite)
-- 0001_init.sql

CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'NeetCode',
  external_url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'Arrays & Hashing',
  status TEXT NOT NULL DEFAULT 'learning',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  mental_model TEXT,
  common_signals TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS problem_patterns (
  problem_id TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  PRIMARY KEY (problem_id, pattern_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS problem_tags (
  problem_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (problem_id, tag_id)
);

CREATE TABLE IF NOT EXISTS thinking_sessions (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  thoughts TEXT
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'youtube',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visualizations (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mermaid',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  code TEXT NOT NULL,
  time_complexity TEXT,
  space_complexity TEXT,
  explanation TEXT,
  alternatives TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  thoughts TEXT,
  confidence INTEGER,
  elapsed_days INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  next_review_at TEXT
);

-- Speed up lookups by problem
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_thinkingsessions_problem ON thinking_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_aiconversations_problem ON ai_conversations(problem_id);
CREATE INDEX IF NOT EXISTS idx_resources_problem ON resources(problem_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_problem ON visualizations(problem_id);
CREATE INDEX IF NOT EXISTS idx_notes_problem ON notes(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_problem ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_reviews_problem ON reviews(problem_id);