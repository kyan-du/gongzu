-- 记忆游戏成绩表
CREATE TABLE IF NOT EXISTS memory_games (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'matryoshka',  -- 游戏类型
  date TEXT NOT NULL,               -- 'YYYY-MM-DD'
  total INTEGER NOT NULL,           -- 总题数（如 6 张卡片）
  correct INTEGER NOT NULL,         -- 正确数
  accuracy REAL NOT NULL,           -- 正确率 0-100
  duration_sec INTEGER,             -- 用时（秒）
  detail TEXT,                      -- 详细数据（JSON，如每张卡的对错）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_memory_games_user_date
  ON memory_games(user_id, date, game_type);
