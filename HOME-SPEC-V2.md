# Home Page Spec V2 — 全新独立页面

## 路由
- `/:userId/home` → `Home.tsx`（全新组件，替换当前 Home.tsx 的全部内容）
- `/:userId/today` 和 `/:userId/:date` → `DailyView.tsx`（保持不动）

## 设计理念
Home 回答三个问题：
1. **现在该做什么？**（今日题目）
2. **做得怎么样？**（进度环）
3. **哪里要补？**（错题本）

彤彤打开拱卒，两秒内就能开始做题。

## 布局（从上到下）

### Header
和 DailyView 完全一致的 Header：logo + 用户菜单。
**唯一区别**：点击 logo 区域（图标+文字）→ navigate 到 `/${userId}/home`（因为已经在 Home，实际无跳转，但保持一致）。

### Section 1: 今日进度（视觉焦点）
- **圆形进度环**（SVG，直径约 120px），居中
  - 环内大字显示：`2/3`（已完成/总数）
  - 环下小字：`今日进度`
  - 颜色：
    - 全部完成：绿色（emerald-500）
    - 部分完成：琥珀色（amber-500）
    - 未开始（0/N）：灰色（gray-300）
    - 没有题（0/0）：灰色虚线环，文字"今天暂无作业"
- **连续打卡**（可选，进度环右上角小标签）：`🔥 7天`
  - 如果 streak=0，不显示
  - 数据来源：`/api/status/monthly` 的 streak 字段

### Section 2: 今日题目卡片
- 每个题组（quiz）一张卡片，**和 DailyView 中的卡片样式完全一致**
  - 左侧：图标 + tag 名 + 题数
  - 右侧：完成状态（✅ 80% 或 🕐 未完成）
  - 点击：navigate 到 `/${userId}/${todayStr}/${slug}`
- **未做的卡片排在前面**，已完成的在后面（排序）
- 全部完成时：卡片上方加一行 `✅ 全部完成！干得漂亮` 小提示（emerald-500 文字）
- 今天没有题时：不显示这个 section（进度环已经处理了空状态）

### Section 3: 底部入口（两张卡片并排）
两个等宽卡片，flex row，间距 gap-3：

**左卡：📕 错题本**
- 图标：BookX（红色）
- 标题：错题本
- 副标题：`N 个知识点待复习`（或 `暂无错题 ✓`）
- 如果有错题：数字 N 用红色 badge 突出
- 点击：navigate 到 `/${userId}/mistakes`

**右卡：📅 历史记录**  
- 图标：Calendar（蓝色）
- 标题：历史记录
- 副标题：`查看往日练习`
- 点击：navigate 到 `/${userId}/today`（进入 DailyView，可翻页浏览历史）

### 不在 Home 出现的东西
- ❌ 月历（放到历史记录/DailyView 里）
- ❌ 周条
- ❌ 日期翻页（不需要，Home 永远是今天）
- ❌ 错题重做按钮（在 DailyView 或 Mistakes 页面做）

## 数据获取
Home 页只需两个请求：
1. `GET /api/quiz?userId=cyan&date=2026-04-03` → 今日题目列表
2. `GET /api/status?userId=cyan&date=2026-04-03` → 今日完成状态
3. `GET /api/review?userId=cyan` → 错题数量

streak 数据可以从 `/api/status/monthly` 拿，但不是 MVP 必须的，先不加也行。

## 样式要求
- React + Tailwind CSS + lucide-react（和现有项目一致）
- 暗色模式全覆盖（dark: 前缀）
- 移动端优先（max-w-2xl mx-auto）
- 卡片使用和 DailyView 完全一致的样式（bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4）
- 进度环用 SVG 实现，不引入新依赖

## 实现范围
- **重写** `src/pages/Home.tsx`（删掉旧内容，全新写）
- **不要动** DailyView.tsx, Quiz.tsx, Mistakes.tsx, Result.tsx, App.tsx 等其他任何文件
- 运行 `npm run build` 验证

## DailyView.tsx 的 logo 跳转改动
在 DailyView.tsx 中，把 Header 的 logo 区域（图标+拱卒文字）包一层 `<button onClick={() => navigate(\`/${userId}/home\`)}>`，让用户可以从 today/date 页面回到 Home。
⚠️ 这是 DailyView.tsx 唯一的改动，不改其他任何逻辑。
