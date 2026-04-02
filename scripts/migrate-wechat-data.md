# Migration: WeChat History → GongZu DB

## Goal
Clear all test data from GongZu D1 database and import real quiz data from WeChat group chat history.

## Current Test Data to Clear
- daily_quizzes: all rows
- questions: all rows  
- submissions: all rows
- knowledge_mastery: all rows

## Data to Import (from WeChat chat 3/29 - 4/2)

### 2026-03-30
**Quiz 1: 西游记·取经缘起** (choice, 1 question)
- Q: 关于"取经缘起"的叙事安排，最准确的一项？ Options A/B/C/D. Answer: A. Cyan: A ✅

**Quiz 2: 阅读理解·名人故事·王昭君** (choice, 3 questions)  
- Q1: 王昭君为什么多年见不到皇帝？B ✅
- Q2: 王昭君到达草原后做了哪些事？C ✅
- Q3: 汉匈和平持续了多久？A ✅

### 2026-03-31
**Quiz 3: 西游记·猪八戒封号** (choice, 1 question) Answer: B. Cyan: B ✅
**Quiz 4: 阅读理解·名人故事·张謇** (choice, 3 questions) B/D/C all ✅

### 2026-04-01
**Quiz 5: 西游记·沙僧** (choice, 1 question) Answer: C. Cyan: C ✅
**Quiz 6: 阅读理解·名人故事·庄子** (choice, 3 questions) C/B/D all ✅
**Quiz 7: 英语语法 4/1** (5 blank + 5 text, 10 questions) All correct ✅

### 2026-04-02
**Quiz 8: 英语语法 4/2** (already in DB as 8dfd70cf, keep)
**Quiz 9: 阅读理解·名人故事·曹雪芹** (already in DB as fb733941, keep. Cyan answered CBC ✅)
