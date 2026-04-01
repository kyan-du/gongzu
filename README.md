<div align="center">

# 🏠 拱卒 GongZu

**日拱一卒，功不唐捐**

家庭每日练习系统 · 让孩子每天进步一点点

[![Deploy to Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://gongzu.pages.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[在线体验](https://gongzu.pages.dev) · [产品文档](docs/PRD.md) · [开发指南](#开发)

</div>

---

## ✨ 特性

- 📱 **移动优先** — 手机上体验极佳，打开就做题
- 🧩 **通用题型** — 选择题、填空题、改写题、记忆卡片，不绑定科目
- 🏷️ **标签驱动** — 英语语法、西游记、单词……自由组合
- 📅 **每日作业** — 日历式列表，历史可回顾可补做
- 📊 **即时反馈** — 交卷秒出成绩，错题详细解析
- 🤖 **AI 出题** — 支持 API 推题，与 AI 助手无缝集成
- 👨‍👩‍👧‍👦 **多用户** — 每个孩子独立作业、独立数据
- 🔒 **隐私优先** — 家庭口令认证，数据存 Cloudflare D1，自己掌控
- ☁️ **零成本部署** — Cloudflare 免费套餐完全够用

## 🏗️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + TypeScript + Tailwind CSS |
| 构建 | Vite |
| 后端 | Cloudflare Pages Functions |
| 数据库 | Cloudflare D1 (SQLite) |
| 部署 | Cloudflare Pages，push 自动上线 |

## 🚀 快速开始

### 前置条件

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm install -g wrangler`）
- Cloudflare 账号

### 安装

```bash
git clone https://github.com/kyan-du/gongzu.git
cd gongzu
npm install
```

### 创建 D1 数据库

```bash
wrangler d1 create gongzu
# 将输出的 database_id 填入 wrangler.toml

wrangler d1 execute gongzu --local --file=schema.sql
```

### 本地开发

```bash
npm run dev
```

### 部署

```bash
npm run build
wrangler pages deploy dist
```

## 📋 题型

| 题型 | 说明 | 判分方式 |
|------|------|----------|
| **选择题** | 单选/多选，2-6 个选项 | 精确匹配 |
| **填空题** | 内联输入框，支持多个可接受答案 | 模糊匹配（忽略大小写） |
| **改写题** | 句型转换、问答 | AI 判分（规划中） |
| **记忆卡片** | 翻转卡片 + 艾宾浩斯复习 | 自评（规划中） |

## 📡 API

### 推送题目

```bash
curl -X POST https://gongzu.pages.dev/api/quiz \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cyan",
    "date": "2026-04-01",
    "tag": "英语语法",
    "questions": [
      {
        "type": "blank",
        "content": {
          "stem": "The old man lives on the _____ (nine) floor.",
          "blanks": [{"hint": "nine", "accepts": ["ninth"]}]
        },
        "answer": {"answers": ["ninth"]},
        "explanation": "序数词：nine → ninth"
      }
    ]
  }'
```

### 查询作业

```bash
curl https://gongzu.pages.dev/api/quiz?userId=cyan&date=2026-04-01
```

## 📁 项目结构

```
gongzu/
├── public/              # 静态资源（头像、视频、logo）
├── src/
│   ├── components/      # 题型组件（ChoiceQuestion, BlankQuestion）
│   ├── pages/           # 页面（Landing, Login, Home, Quiz, Result）
│   └── lib/             # 工具函数（API, 认证）
├── functions/api/       # Cloudflare Pages Functions（后端 API）
├── schema.sql           # D1 数据库建表
├── wrangler.toml        # Cloudflare 配置
└── docs/PRD.md          # 产品需求文档
```

## 🗺️ 路线图

- [x] 选择题 + 填空题
- [x] 每日作业列表
- [x] 口令认证 + 多用户
- [x] 即时判分 + 解析
- [ ] AI 判分（改写题）
- [ ] 记忆卡片 + 艾宾浩斯复习
- [ ] 错题本
- [ ] 家长视图 + 统计
- [ ] 微信通知集成
- [ ] PWA 离线支持

## 📄 License

[MIT](LICENSE)

---

<div align="center">

*日拱一卒，功不唐捐。*

</div>
