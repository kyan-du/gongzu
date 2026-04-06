# Grid Engine — 变换实现 Task Spec

> 给 Claude Code / 编码 agent 的任务描述

## 背景

PRD: `projects/gongzu/PRD-grid-memory.md`
引擎: `src/lib/grid-engine.ts`
测试: `src/lib/__tests__/grid-engine.test.ts`

当前引擎只实现了合并规则（same/diff action），**三层变换完全没实现**（全部硬编码为 `'none'`）。

## 需要实现的变换

### 1. 元素变换（elementTransform）

PRD §5.1：对单个 emoji 图案本身做形态变化。

| 值 | 效果 |
|---|------|
| `none` | 无变换（已有） |
| `rotate-cw-90` | 顺时针旋转 90° |
| `rotate-180` | 旋转 180° |
| `rotate-ccw-90` | 逆时针旋转 90°（= 270°） |
| `mirror-h` | 水平镜像 |
| `mirror-v` | 垂直镜像 |

**应用时机**: col2 = applyElementTransform(col1) —— 第 2 列的每个 emoji 是第 1 列对应 emoji 经过变换后的结果。

### 2. 尺寸变换（sizeTransform）

PRD §5.1：独立开关，可与元素变换叠加。

| 值 | 效果 |
|---|------|
| `none` | 无变换（已有） |
| `scale-down` | emoji 缩小 (scaled: true) |

**叠加**: elementTransform + sizeTransform 可同时生效。

### 3. 位置变换（positionTransform）

PRD §5.2：2×2 内 4 个位置的排列变化。

位置编号:
```
0 | 1
-----
2 | 3
```

| 值 | 效果 |
|---|------|
| `none` | 无变换（已有） |
| `pos-rotate-cw` | 0→1→3→2→0 |
| `pos-rotate-180` | 0↔3, 1↔2 |
| `pos-rotate-ccw` | 0→2→3→1→0 |
| `pos-mirror-lr` | 0↔1, 2↔3 |
| `pos-mirror-ud` | 0↔2, 1↔3 |
| `pos-diag-main` | 0↔3 |
| `pos-diag-anti` | 1↔2 |

**应用时机**: col2 的 MiniGrid 是 col1 经过位置变换后的结果。

## 实现要求

### 函数新增

1. `applyElementTransform(cell: CellContent, transform: string): CellContent`
   - blank/broken/pass 不变
   - emoji: 修改 rotation/mirror 字段

2. `applySizeTransform(cell: CellContent, transform: string): CellContent`
   - emoji: 设 scaled=true/false

3. `applyPositionTransform(grid: MiniGrid, transform: string): MiniGrid`
   - 按映射重排 4 个位置

4. `applyTransforms(grid: MiniGrid, rules: PuzzleRules): MiniGrid`
   - 组合以上三种变换：先元素 → 再尺寸 → 再位置

### 生成逻辑修改

当前 `generatePuzzle()` 里的列生成:
- col1: 随机
- col2: 随机
- col3: merge(col1, col2)

改为:
- col1: 随机
- col2: applyTransforms(col1, rules)
- col3: merge(col1, col2)

### 规则生成修改

`generateRules()` 需要:
1. 随机选 elementTransform（包含 'none'）
2. 随机选 sizeTransform（none 或 scale-down）
3. 随机选 positionTransform（包含 'none'）
4. 如果 elementTransform 有旋转/镜像 → 素材必须从有朝向的主题组选
5. 更新 PuzzleRules 类型

### 素材约束

```typescript
const DIRECTIONAL_THEMES = ['动物', '交通', '昆虫', '数字', '字母', '汉字', '形状'];
const SYMMETRIC_THEMES = ['水果', '食物', '运动'];
const MIXED_THEMES = ['天气']; // 部分有朝向

// 如果有旋转/镜像变换 → 只能从 DIRECTIONAL_THEMES 选
// 否则 → 全部都可以选
```

### 口诀/解析更新

`generateMnemonic` 和 `describeAnalysis` 需要包含变换信息，例如:
- "右旋90° + 缩小 + 位置顺转"
- "左右镜像 + 位置上下翻"

### 测试要求

在 `grid-engine.test.ts` 中新增:

1. **单元测试**: 
   - applyElementTransform: 每种变换 × emoji/blank/broken
   - applySizeTransform: scale-down + none
   - applyPositionTransform: 每种位置变换验证映射正确

2. **集成测试**:
   - col2 = applyTransforms(col1, rules) 的关系成立
   - 有变换时，素材来自有朝向的主题组
   - 200 次生成，所有变换类型都能出现

3. **回归测试**:
   - 跑完现有 37 个测试全绿

## 注意

- **不要改 checkAnswer**，它比较的是最终 cell 的完整属性（包括 rotation/mirror/scaled），这已经正确
- 不要改变现有的合并逻辑
- 导出新函数（方便测试），加 `/** @internal */` 注释
- 分支: `feat/grid-transforms`
