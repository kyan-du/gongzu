# Grid Engine — Bug 修复 + 补全 Task Spec (Round 2)

> 给 Claude Code 的任务描述

## 背景

引擎 `src/lib/grid-engine.ts` 已实现三层变换，67 个测试全绿。
现在需要修 review 发现的问题并补全缺失功能。

**所有改动都必须有对应测试。**

---

## Bug 修复

### Bug 1: `ocean` 主题永远不会被选到

`EMOJI_GROUPS` 里有 `ocean` 主题，但 `DIRECTIONAL_THEMES`、`SYMMETRIC_THEMES`、`MIXED_THEMES` 三个数组里都没有 `ocean`。
`buildMatrix()` 从这三个数组选主题，所以 ocean 永远不会被选到。

**修复**: 把 `ocean` 加到 `DIRECTIONAL_THEMES`（海洋动物有朝向）。

**测试**: 验证 `EMOJI_GROUPS` 的每个 key 都出现在三个分类数组之一中。

### Bug 2: grow（小变大）未实现

当前 `sizeTransform` 只有 `none` 和 `scale-down`。PRD 和万都要求有"小变大"。

**修复**:
1. 在 `allSizeTransforms` 加 `'scale-up'`
2. `applySizeTransform` 加 `case 'scale-up'`: 设一个新属性标记放大。
   - **方案**: 把 `scaled` 字段从 `boolean` 改为 `boolean | 'up'`。`true` = 缩小（保持后向兼容），`'up'` = 放大。
   - 或者更干净：`scaled?: 'none' | 'down' | 'up'`（但要检查前端所有 `scaled === true` 的地方）。
   - **推荐方案**: 不改类型，新增 `grown?: boolean` 字段。这样后向兼容最好。
3. `CellRenderer` 里加 `grown` 的渲染：fontSize 比 normal 大（比如 `'4.2rem'`）
4. 口诀/解析加 `scale-up` 的描述

**注意**: `grown` 字段加到 `EmojiContent` 和 `PassContent` 类型上（和 `scaled` 平级）。

**测试**:
- `applySizeTransform(emoji, 'scale-up')` 返回 `grown: true`
- `applySizeTransform(blank, 'scale-up')` 不变
- 200 次生成，`scale-up` 出现过
- grown 的口诀/解析不含 undefined

### Bug 3: PRD 要求的素材缺失

PRD §7.1 明确列了这些主题，引擎没有：
- 数字: `1 2 3 4 5 6 7 8 9`（混合朝向，6/9 可旋转）
- 字母: `b d p q A B R P`（有朝向，特别适合旋转镜像）
- 汉字: `大 小 上 下 左 右 东 西`（有朝向）
- 形状: `▲ ◆ ► ◄ ▼ ★ ● ■`（有朝向）

**修复**:
1. 在 `EMOJI_GROUPS` 加这 4 个组
2. `numbers` → `MIXED_THEMES`
3. `letters`, `hanzi`, `shapes` → `DIRECTIONAL_THEMES`

**测试**: 验证新主题在 EMOJI_GROUPS 中、且在分类数组中。

### Bug 4: 确认 CellRenderer 是否正常渲染 rotation/mirror

当前代码看起来逻辑正确（`content.rotation || 0`），但昨天调试发现渲染丢失。

**排查方式**:
1. 在 `buildFixturePuzzle()` 里确保 fixture 数据包含 rotation=90、mirror='horizontal'、scaled=true 的 cell
2. 确认 fixture 已有这些数据（检查现有 fixture 代码）
3. 如果 fixture 数据正确但渲染不对，问题在 CellRenderer；如果 fixture 数据没有变换属性，问题在 fixture 构造

**这个不需要改引擎代码，只需要确认 fixture 覆盖了变换情况。** 如果发现 fixture 缺失变换数据，补上。

---

## 代码质量

### 清理 MemoryGrid.tsx 调试代码
- 搜索所有 `console.log` / `console.debug`，删掉调试用的（保留错误日志）
- 搜索 `window.__puzzle` 之类的调试暴露，删掉

---

## 执行步骤

1. `git status` 确认在 `feat/grid-transforms` 分支且工作区干净
2. 修 Bug 1（ocean 分类 + 测试）
3. 修 Bug 3（加素材 + 测试）
4. 修 Bug 2（grow + 类型 + 口诀 + 前端渲染 + 测试）
5. Bug 4（检查 fixture，补全）
6. 清理调试代码
7. `npm test` 全绿
8. `npm run build` 零错误
9. 提交

## 关键文件

- 引擎: `src/lib/grid-engine.ts`
- 测试: `src/lib/__tests__/grid-engine.test.ts`
- 前端: `src/pages/MemoryGrid.tsx`（CellRenderer、CELL_SIZES、fixture）
- PRD: `projects/gongzu/PRD-grid-memory.md`
