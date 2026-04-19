-- 拱卒（GongZu）数据库 Schema
-- 版本：v1.0
-- 创建时间：2026-03-31

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- 'cyan', 'ryan', 'parent'
  name TEXT NOT NULL,               -- '彤彤', '可可', '家长'
  avatar TEXT,                      -- 头像 URL
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 题目表
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,              -- UUID
  type TEXT NOT NULL,               -- 'choice' | 'blank' | 'rewrite' | 'card'
  content TEXT NOT NULL,            -- 题目内容（JSON）
  answer TEXT NOT NULL,             -- 标准答案（JSON）
  explanation TEXT,                 -- 解析
  tags TEXT,                        -- 标签（JSON 数组）如 ["英语语法", "词性转换"]
  difficulty INTEGER DEFAULT 3,    -- 难度 1-5
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 每日作业表
CREATE TABLE IF NOT EXISTS daily_quizzes (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL,            -- 关联用户
  date TEXT NOT NULL,               -- '2026-03-31'
  tag TEXT NOT NULL,                -- '英语语法'
  title TEXT,                       -- 作业标题
  question_ids TEXT NOT NULL,       -- 题目 ID 列表（JSON 数组）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_daily_quizzes_user_date
  ON daily_quizzes(user_id, date);

-- 答题记录表
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,            -- 关联每日作业
  answer TEXT NOT NULL,             -- 学生答案（JSON）
  correct INTEGER NOT NULL,         -- 0/1
  score REAL DEFAULT 0,             -- 得分（部分分）
  ai_feedback TEXT,                 -- AI 判分反馈
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (quiz_id) REFERENCES daily_quizzes(id)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_submissions_user
  ON submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_quiz
  ON submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_submissions_wrong
  ON submissions(user_id, correct) WHERE correct = 0;

-- 卡片复习记录表（艾宾浩斯）
CREATE TABLE IF NOT EXISTS card_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  remembered INTEGER NOT NULL,      -- 0/1
  next_review_at INTEGER,           -- 下次复习时间
  interval_days INTEGER DEFAULT 1,  -- 当前间隔天数
  reviewed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_card_reviews_next
  ON card_reviews(user_id, next_review_at);

-- 插入初始用户数据
INSERT OR IGNORE INTO users (id, name, avatar, created_at) VALUES
  ('cyan', '彤彤', null, unixepoch()),
  ('ryan', '可可', null, unixepoch()),
  ('parent', '家长', null, unixepoch());

-- 知识点掌握记录表（间隔重复 + 手动标记）
CREATE TABLE IF NOT EXISTS knowledge_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  knowledge_point TEXT NOT NULL,
  category TEXT,
  error_count INTEGER DEFAULT 0,
  correct_streak INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 1,
  next_review_at TEXT,
  mastered INTEGER DEFAULT 0,
  mastered_reason TEXT,
  last_error_at TEXT,
  last_review_at TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_mastery_review
  ON knowledge_mastery(user_id, mastered, next_review_at);
CREATE INDEX IF NOT EXISTS idx_mastery_point
  ON knowledge_mastery(user_id, knowledge_point);

-- 生词表（独立于 questions 表）
CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,                  -- 英文单词或短语（原始大小写）
  word_lower TEXT NOT NULL,            -- 小写形式（用于去重和搜索）
  meaning TEXT NOT NULL,               -- 中文释义+词性
  phonetic TEXT,                       -- IPA 音标
  example TEXT,                        -- 例句
  example_cn TEXT,                     -- 例句中文翻译
  tags TEXT,                           -- 标签（JSON 数组）
  source TEXT DEFAULT 'manual',        -- 来源：'manual' | 'extracted' | 'imported'
  difficulty INTEGER DEFAULT 3,        -- 难度 1-5
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 唯一索引：每个用户的单词不重复（基于小写形式）
CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_user_word
  ON vocabulary(user_id, word_lower);

-- 时间索引：支持"最新添加"排序
CREATE INDEX IF NOT EXISTS idx_vocabulary_created
  ON vocabulary(user_id, created_at DESC);

-- 生词复习记录表（艾宾浩斯间隔重复）
CREATE TABLE IF NOT EXISTS vocabulary_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vocabulary_id TEXT NOT NULL,         -- 外键 → vocabulary.id
  remembered INTEGER NOT NULL,         -- 0/1
  next_review_at TEXT,                 -- 下次复习日期（YYYY-MM-DD 格式）
  interval_days INTEGER DEFAULT 1,     -- 当前间隔天数
  reviewed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

-- 复习队列索引：查询今日待复习的单词
CREATE INDEX IF NOT EXISTS idx_vocabulary_reviews_next
  ON vocabulary_reviews(user_id, next_review_at);

-- 单词复习历史索引：查询某个单词的复习记录
CREATE INDEX IF NOT EXISTS idx_vocabulary_reviews_vocab
  ON vocabulary_reviews(vocabulary_id, reviewed_at DESC);

-- 单词学习设置表（补充缺失的定义）
CREATE TABLE IF NOT EXISTS card_settings (
  user_id TEXT PRIMARY KEY,
  daily_new_words INTEGER DEFAULT 15,    -- 每日新词数量
  daily_total_limit INTEGER DEFAULT 20,  -- 每日总量上限（新词+复习）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 作业请求跟踪表（用于"出题"按钮 webhook）
CREATE TABLE IF NOT EXISTS quiz_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

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

-- 用户模块配置表（每个用户可独立配置启用哪些模块、哪些计入每日任务）
CREATE TABLE IF NOT EXISTS user_modules (
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  is_task INTEGER DEFAULT 0,
  daily_target INTEGER,
  config TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, module),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 彤彤默认配置
INSERT OR IGNORE INTO user_modules (user_id, module, enabled, is_task, daily_target, config) VALUES
  ('cyan', 'quiz',        1, 1, NULL, '{"tags":[{"tag":"英语语法","type":"blank+rewrite","count":10,"focus":["词性变换","句型转换"],"exclude":["宾语从句","被动语态"],"difficulty":3,"schedule":"daily"},{"tag":"西游记","type":"choice","count":3,"schedule":"daily"},{"tag":"名人故事","type":"reading","count":1,"schedule":"daily","config":{"passage_length":"800-1200字","question_count":3}}]}'),
  ('cyan', 'vocab',       1, 1, 20,   '{"daily_new_words":15}'),
  ('cyan', 'mistakes',    1, 0, NULL, '{}'),
  ('cyan', 'memory_game', 1, 0, NULL, '{"game_types":["matryoshka"]}');

-- 可可默认配置
INSERT OR IGNORE INTO user_modules (user_id, module, enabled, is_task, daily_target, config) VALUES
  ('ryan', 'quiz',        0, 0, NULL, '{}'),
  ('ryan', 'vocab',       0, 0, NULL, '{}'),
  ('ryan', 'mistakes',    0, 0, NULL, '{}'),
  ('ryan', 'memory_game', 1, 1, 5,    '{"game_types":["matryoshka"]}');
