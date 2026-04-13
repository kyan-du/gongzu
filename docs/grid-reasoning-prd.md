# 宫格推理（Grid Reasoning）开发 PRD

## 概述
基于现有宫格记忆（Grid Memory）系统，新增"宫格推理"游戏类型。同时将原"记忆游戏"总称改为"思维训练"。

## 一、UI 文案改名：记忆游戏 → 思维训练

### 需要改的文件和位置

1. **`src/pages/MemorySelect.tsx`**（选择页面）
   - 标题 `记忆游戏` → `思维训练`
   - 副标题 `选择一种游戏开始训练` → `选择一种训练开始`
   - 新增第三个卡片：🧩 宫格推理

2. **`src/pages/Home.tsx`**
   - 侧边栏入口文案 `记忆游戏` → `思维训练`（约 line 456）
   - 注释里的"记忆游戏"也更新
   - 图标从 `Boxes` 改为 `Brain`（从 lucide-react 引入）

3. **`src/pages/ParentChild.tsx`**
   - `memory_game: { name: '记忆游戏', ... }` → `memory_game: { name: '思维训练', ... }`

4. **`src/lib/grid-engine.ts`**
   - 头部注释改为"思维训练 — 宫格记忆引擎"

### 不改的：
- 模块名 `memory_game` 保持不变（DB 兼容）
- tag 名 `记忆·套娃` / `记忆·宫格` 保持不变（DB 兼容）
- 路由 `/:userId/memory` / `/:userId/memory/*` 保持不变
- API 路径 `/api/memory-game/*` 保持不变

## 二、宫格推理引擎

### 文件：`src/lib/grid-reasoning-engine.ts`（新建）

### 核心概念
和宫格记忆共享 CellContent、MiniGrid、Matrix 类型（从 grid-engine 导出/共享）。

区别：
- 宫格记忆：看→记住→填（有记忆阶段，格子会隐藏）
- 宫格推理：矩阵始终可见，部分格子被遮盖为"空格"，用户需要推断变换规律后选择正确答案填入

### 数据模型

```typescript
export interface ReasoningPuzzle {
  matrix: Matrix;              // 3×3 矩阵，每格 2×2
  hiddenCells: { row: number; col: number }[];  // 被遮盖的空格位置（3-7个）
  candidates: {                // 候选项列表（含正确答案+干扰项）
    label: string;             // A, B, C, ...
    content: MiniGrid;         // 2×2 内容
  }[];
  rules: PuzzleRules;          // 复用现有 PuzzleRules
  correctAnswers: Map<string, string>;  // "row-col" → label
}
```

### 生成逻辑

1. 用现有 `generateValidRules()` 生成规律
2. 用现有 `buildMergeMatrix/buildTransformMatrix/buildMixedMatrix` 生成完整矩阵
3. 随机选择 3-5 个格子作为隐藏格（确保不全在同一行/列）
4. 正确答案 = 矩阵中该位置的原始 MiniGrid
5. 生成干扰项：
   - 对正确 MiniGrid 施加微小变换（旋转一个 cell、交换两个 cell 位置、替换一个 emoji）
   - 从其他位置取 MiniGrid 加轻微修改
   - 总候选项 = 正确答案数 + 干扰项（总数 12-15 个）
6. 候选项随机排序，分配字母标签 A-O

### 导出函数
```typescript
export function generateReasoningPuzzle(): ReasoningPuzzle;
export function checkReasoningAnswer(
  puzzle: ReasoningPuzzle, 
  answers: Map<string, string>  // "row-col" → selected label
): { correct: number; total: number; details: { row: number; col: number; correct: boolean }[] };
```

## 三、宫格推理页面

### 文件：`src/pages/GridReasoning.tsx`（新建）

### 游戏流程
1. **展示阶段**：显示 3×3 矩阵，空格用绿色遮罩 + 序号标记（❶❷❸...）
2. **答题方式**：
   - 点击空格 → 高亮选中
   - 底部显示候选项网格（每个候选项是 2×2 小格 + 字母标签）
   - 点击候选项 → 填入选中的空格
   - 可以点击已填的空格重新选择
3. **提交**：全部填完后显示"提交"按钮
4. **结果页**：显示正确/错误标记，正确答案对比，得分

### UI 布局
- 顶部：3×3 矩阵（复用现有 CellRenderer 渲染 MiniGrid）
- 空格样式：绿色半透明遮罩 + 白色序号
- 选中空格：蓝色边框高亮
- 底部：候选项网格（3-4列），每个候选项用小卡片展示

### 样式风格
- 复用 MemoryGrid.tsx 的 CellRenderer
- 复用 Layout 组件
- 配色与现有一致

## 四、路由 & 入口

### `src/App.tsx`
新增路由：
```tsx
<Route path="/:userId/memory/reasoning" element={<GridReasoning />} />
```

### `src/pages/MemorySelect.tsx`
新增第三个卡片，绿色系配色，图标 🧩，标签：规律发现 / 逻辑推理

## 五、API & 数据

### 暂时不需要新 API
- 宫格推理目前是训练模式（不计入每日任务），不需要提交到 DB
- 后续如果要加 exam 模式，复用现有 `/api/memory-game/exam` 的模式

### tag 名（预留）
- `记忆·推理` 或 `思维·推理`（后续加 exam 模式时用）

## 六、约束

1. 不修改 grid-engine.ts 的现有导出接口
2. 从 grid-engine.ts 导入需要的类型和函数（CellContent, MiniGrid, Matrix, PuzzleRules, generateValidRules 等需要 export）
3. 不改 DB schema
4. 不改现有 API
5. 目标用户：可可（ryan），但页面不做用户限制
6. 难度直接拉满，不分阶段
