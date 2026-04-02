# 知识点整理规则

每周日 10:00 执行，审查 knowledge_mastery 表：

1. **合并同义**：如果两个知识点名称相似（如"序数词"和"序数词变化"），合并为一个
2. **拆分过粗**：如果一个知识点下有 >10 条错题且涵盖不同子类，拆分
3. **修正标签**：确保格式统一为"中文名 English Name"
4. **清理孤儿**：删除 error_count=0 且无关联 submission 的记录

API 端点：
- GET /api/review?userId=cyan（查看所有知识点）
- 直接用 wrangler d1 execute 修改数据
