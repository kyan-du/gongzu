# 拱卒（GongZu）

> 日拱一卒，功不唐捐

拱卒是一个面向家庭的**每日练习答题系统**。家长或 AI 每天推送题目，孩子在手机上完成练习，系统自动判分并记录学习数据。

## 特性

- 📱 **移动优先** — 专为手机设计的答题体验
- 🎯 **题型通用** — 支持选择题、填空题、改写题、卡片记忆
- 🤖 **AI 判分** — 智能判分，提供详细反馈
- 📊 **数据驱动** — 记录答题数据，分析薄弱项
- 🔒 **家庭私有** — 通过口令保护，只有家人能访问
- ☁️ **零运维** — 部署在 Cloudflare，完全 Serverless

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Cloudflare Pages Functions (Serverless)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Cloudflare Pages (自动部署)

## 快速开始

### 1. 克隆项目

\`\`\`bash
git clone https://github.com/kyan-du/gongzu.git
cd gongzu
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 配置环境变量

创建 \`.dev.vars\` 文件：

\`\`\`env
FAMILY_PASSPHRASE=your-family-passphrase
ADMIN_API_KEY=your-admin-api-key
\`\`\`

### 4. 初始化本地数据库

\`\`\`bash
wrangler d1 execute gongzu --local --file=schema.sql
\`\`\`

### 5. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

### 6. 部署到 Cloudflare

\`\`\`bash
npm run build
npm run deploy
\`\`\`

## 项目结构

\`\`\`
gongzu/
├── src/
│   ├── pages/          # 页面组件
│   ├── components/     # 题型组件
│   └── lib/           # API 调用库
├── functions/         # Cloudflare Functions (后端 API)
│   ├── api/          # API 端点
│   ├── middleware/   # 认证中间件
│   └── lib/          # 数据库操作
├── schema.sql        # 数据库 Schema
└── wrangler.toml     # Cloudflare 配置
\`\`\`

## API 使用

### 出题 API

\`\`\`bash
curl -X POST https://gongzu.pages.dev/api/quiz \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "cyan",
    "date": "2026-03-31",
    "tag": "英语语法",
    "title": "英语语法每日练习",
    "questions": [
      {
        "type": "blank",
        "content": {
          "stem": "The old man lives on the _____ (nine) floor.",
          "blanks": [{"hint": "nine", "accepts": ["ninth", "9th"]}]
        },
        "answer": "ninth",
        "explanation": "序数词表示顺序",
        "tags": ["英语语法", "词性转换"],
        "difficulty": 3
      }
    ]
  }'
\`\`\`

## 许可证

MIT License © 2026 Kyan Du

## 贡献

欢迎提交 Issue 和 Pull Request！

---

_日拱一卒，功不唐捐。_
