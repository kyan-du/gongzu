-- Migration 0006: 用户模块配置表
-- 创建日期：2026-04-04
-- 说明：每个用户可独立配置启用哪些模块、哪些计入每日任务

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
