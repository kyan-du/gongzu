# Grid Engine 设计文档 (v2)

## 核心规律

**col1 OP col2 = col3**

OP 按 MiniGrid 内的行（上行/下行）可以不同。

### MiniGrid 内部结构
```
cell[0] | cell[1]   ← 上行
--------|--------
cell[2] | cell[3]   ← 下行
```

### 合并规则（按行）
每行有两种情况：
- **same（两个 cell 相同）**：保留 / 左右互换(swap-lr) / 缩小(shrink) / 变空(blank) / 变裂(broken)
- **diff（两个 cell 不同）**：留第一列(first) / 留第二列(second) / 变空(blank) / 变裂(broken) / 缩小(shrink)

```typescript
type RowMergeRule = {
  same: 'keep' | 'swap-lr' | 'shrink' | 'blank' | 'broken';
  diff: 'first' | 'second' | 'blank' | 'broken' | 'shrink';
};

type PuzzleRules = {
  topRow: RowMergeRule;
  bottomRow: RowMergeRule;
};
```

## 阶段设计

### 阶段一
- 3×3 矩阵
- 最后一行（row2）第3列隐藏 → ?1 ?2 ?3 ?4
- 用户从前两行推理出规律（至少上行规律可推）
- 下行规律可能需要猜

### 阶段二（连续性）
- 矩阵第一行 = 阶段一的答案行内容
- 第2、3行继续出题
- row1 col2 隐藏 → ?1-?4
- row2 col2 隐藏 → ?5-?8
- 用户利用阶段一已知的规律 + 阶段二新的信息，发现更完整的规律

### 关键：阶段二不是独立矩阵
阶段二的第一行延续阶段一，让用户复用已有知识。

## 出题流程

```
1. 生成 PuzzleRules（上行规律 + 下行规律）
2. 随机生成 col1[row0..2] 和 col2[row0..2]
3. 按 PuzzleRules 推导 col3[row0..2]
4. 阶段一矩阵 = [row0, row1, row2]，row2 col2 隐藏
5. 阶段二矩阵第一行 = 阶段一的 row2（含答案）
6. 生成新的 row1', row2'（col1, col2 随机）
7. 按同样的 PuzzleRules 推导 col3
8. 阶段二矩阵 = [row2_from_phase1, row1', row2']
```

## 选项池
- 每种图案（normalizeCell 相同）只出现一份
- 正确答案必须在池子里
- 允许重复选择（UI 层控制）
- 12-18 个选项

## 解析
- 阶段一发现：描述上行规律（从前两行可观察到的）
- 阶段二新发现：描述下行规律（或其他新信息）
- 完整规律 + 口诀
