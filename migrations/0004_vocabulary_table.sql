-- Migration 0004: 生词卡独立表重构
-- 创建日期：2026-04-04
-- 说明：将 questions 表中的生词卡（type='card'）迁移到独立的 vocabulary 表

-- ============================================================
-- Step 1: 创建新表结构
-- ============================================================

-- 1.1 生词表（扁平化字段，支持高效索引）
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

-- 1.2 生词复习记录表（艾宾浩斯间隔重复）
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

-- 1.3 补充 card_settings 表定义（此表在代码中使用但 schema.sql 中缺失）
CREATE TABLE IF NOT EXISTS card_settings (
  user_id TEXT PRIMARY KEY,
  daily_new_words INTEGER DEFAULT 15,    -- 每日新词数量
  daily_total_limit INTEGER DEFAULT 20,  -- 每日总量上限（新词+复习）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- Step 2: 数据迁移
-- ============================================================

-- 2.1 迁移生词数据（questions 表 → vocabulary 表）
INSERT INTO vocabulary (
  id, user_id, word, word_lower, meaning, phonetic,
  example, example_cn, tags, source, difficulty, created_at
)
SELECT
  id,
  'cyan' AS user_id,                   -- 默认用户（当前只有 cyan 有复习记录）
  json_extract(content, '$.front') AS word,
  LOWER(json_extract(content, '$.front')) AS word_lower,
  json_extract(content, '$.back') AS meaning,
  json_extract(content, '$.phonetic') AS phonetic,
  json_extract(content, '$.example') AS example,
  json_extract(content, '$.exampleCn') AS example_cn,
  tags,
  'imported' AS source,                -- 标记为导入数据
  difficulty,
  created_at
FROM questions
WHERE type = 'card';

-- 2.2 迁移复习记录（card_reviews → vocabulary_reviews）
INSERT INTO vocabulary_reviews (
  id, user_id, vocabulary_id, remembered,
  next_review_at, interval_days, reviewed_at
)
SELECT
  id,
  user_id,
  question_id AS vocabulary_id,        -- question_id 映射到 vocabulary_id
  remembered,
  date(next_review_at, 'unixepoch') AS next_review_at,  -- 转换为 YYYY-MM-DD 格式
  interval_days,
  reviewed_at
FROM card_reviews
WHERE question_id IN (SELECT id FROM questions WHERE type = 'card');

-- ============================================================
-- 迁移完成
-- ============================================================
-- 说明：
-- 1. 旧表 questions 和 card_reviews 保留不变（可回滚）
-- 2. 新表 vocabulary 和 vocabulary_reviews 已创建并填充数据
-- 3. 执行后请验证数据完整性：
--    - SELECT COUNT(*) FROM vocabulary WHERE user_id = 'cyan'; -- 应该是 212
--    - SELECT COUNT(*) FROM vocabulary_reviews WHERE user_id = 'cyan'; -- 应该是 15
