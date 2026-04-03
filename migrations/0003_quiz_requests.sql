-- Quiz request tracking (for "出题" button webhook)
CREATE TABLE IF NOT EXISTS quiz_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
