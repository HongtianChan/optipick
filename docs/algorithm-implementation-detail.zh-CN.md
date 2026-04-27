# 算法实现详解

这份文档解释 Optipick 是怎么实现“最优样本组选择”的，尽量对应到代码里的主要函数。

主要文件：

- `api/algorithm.js`：核心求解算法
- `api/verify-core.js`：独立验证逻辑
- `api/solve.js`：线上 `/api/solve` 接口
- `cli/src/algorithm.js`：本地 CLI / 本地服务器复用 `api/algorithm.js`

---

## 1. 问题模型

系统接收这些参数：

- `m`：总样本池大小
- `n`：选出的样本数量
- `k`：每一组的大小
- `j`：需要检查的约束子集大小
- `s`：被覆盖的小子集大小
- `atLeast`：每个 `j` 组合里，至少要有多少个 `s` 子集被覆盖

当 `n` 个样本确定后，算法会：

1. 从这 `n` 个样本里枚举所有可能的 `k` 组。
2. 从这 `n` 个样本里枚举所有必须满足的 `j` 组合。
3. 把每个 `j` 组合看成一个“必须覆盖的约束”。
4. 把每个 `k` 组看成一个“候选集合”，它可能覆盖一部分约束。
5. 把问题转成类似 set cover 的问题：用尽量少的 `k` 组，覆盖所有 `j` 约束。

小规模时，项目用精确回溯（exact backtracking）。大规模时，用带时间预算的 GRASP 风格贪心启发式算法。

---

## 2. `api/algorithm.js`

### `combination(n, k)`

作用：计算组合数 `C(n, k)`。

实现方式：

- 先处理非法情况和简单情况。
- 用 `k = min(k, n-k)` 减少乘法次数。
- 迭代计算：

```text
C(n,k) = n*(n-1)*...*(n-k+1) / k!
```

用在哪里：

- `solveOptimalSamples()` 用它判断搜索空间够不够小，是否可以走精确回溯。

为什么重要：

- 当前分支判断基于 `C(n,k) <= 30`。

---

### `generateCombinations(arr, k)`

作用：枚举数组里所有长度为 `k` 的组合。

实现方式：

- 用递归回溯。
- 用临时数组 `current` 保存当前组合。
- 当 `current.length === k` 时，把它复制到 `result`。

用在哪里：

- 生成所有候选 `k` 组。
- 生成所有必须覆盖的 `j` 组合。
- 在需要精确计算覆盖数量时，生成内部的 `s` 组合。

复杂度提醒：

- 输出规模就是 `C(arr.length, k)`，所以输入一大，这个函数天然会变贵。

---

### `intersectionSize(set1, set2)`

作用：计算两个集合/数组有多少共同元素。

实现方式：

- 把 `set1` 转成 JavaScript `Set`。
- 遍历 `set2`，数有多少元素出现在这个 `Set` 里。

用在哪里：

- `coversRequirement()` 的 fallback 路径。也就是没有预先构造好 `Set` 时使用。

---

### `intersectionSizeWithSet(kGroupSet, jCombination)`

作用：当 `k` 组已经是 `Set` 时，快速计算它和 `jCombination` 的交集大小。

实现方式：

- 遍历 `jCombination`。
- 如果值存在于 `kGroupSet`，计数加一。

为什么存在：

- 避免在热点循环里反复执行 `new Set(kGroup)`。

用在哪里：

- `coversRequirement()`
- `buildCoverageIndexes()`

---

### `intersectionAtLeastWithSet(kGroupSet, jCombination, s)`

作用：快速判断交集大小是否至少达到 `s`。

实现方式：

- 遍历 `jCombination`。
- 一旦找到 `s` 个共同元素，立刻返回 `true`。

为什么存在：

- 常见情况是 `j !== s` 且 `atLeast === 1`。
- 这时不需要知道具体有多少个交集，只要知道是否至少有一个 `s` 子集被覆盖。
- 如果交集大小至少是 `s`，就说明这个 `k` 组里面存在至少一个需要的 `s` 组合。

---

### `coversRequirement(kGroup, jCombination, j, s, atLeast = 1, kGroupSet = null)`

作用：判断一个候选 `k` 组是否覆盖一个 `j` 组合约束。

这是项目里定义“覆盖”含义的核心函数。

分三种情况：

1. `j === s`
   - 要求变严格。
   - `k` 组只有包含整个 `j` 组合，才算覆盖。
   - 实际上交集大小必须等于 `j`。

2. `j !== s` 且 `atLeast === 1`
   - 快速路径。
   - 只要交集大小至少是 `s`，就说明至少覆盖了一个需要的 `s` 子集。

3. `j !== s` 且 `atLeast > 1`
   - 枚举 `j` 组合内部所有 `s` 组合。
   - 枚举候选组中相关的 `s` 子集。
   - 计算有多少个需要的 `s` 组合被覆盖。
   - 当 `covered >= atLeast` 时返回 `true`。

用在哪里：

- `buildCoverageIndexes()`
- `removeRedundantGroups()`

为什么重要：

- 它决定了项目里“covered / 覆盖”的精确定义。

---

### `buildCoverageIndexes(allKGroups, allJCombinations, j, s, atLeast)`

作用：预先计算每个 `k` 组能覆盖哪些 `j` 组合下标。

输出形状大概是：

```js
[
  [0, 3, 7],   // 第 0 个 k 组覆盖第 0、3、7 个 j 组合
  [1, 4, 8],
  ...
]
```

普通路径：

- 把每个 `k` 组转成 `Set`。
- 对每个候选组，逐个测试所有 `j` 组合。
- 通过 `coversRequirement()` 判断是否覆盖。
- 保存所有被覆盖的 `j` 组合下标。

优化路径：

触发条件：

- `atLeast === 1`
- `j === k`
- `s === k - 1`

为什么这个情况特殊：

- 一个 `k` 组覆盖一个 `j` 组合，等价于两个组合最多只差一个元素。
- 实现里把组合转成 bit mask。
- 直接标记自己和半径为 1 的邻居组合。
- 这样避免了“每个候选都和每个约束两两比较”。

为什么重要：

- 这一步把原本的组合问题转成 set cover 可以使用的覆盖索引。

---

## 3. Bitset 辅助函数

这些函数让贪心算法计算覆盖数量更快。

### `popcount32(x)`

作用：计算一个 32 位整数里有多少个 1。

用在哪里：

- `popcountBitset()`
- `popcountAndNot()`

为什么重要：

- set cover 的贪心步骤会反复问：“如果选这个候选，它能新增覆盖多少约束？”
- 用 bit 运算比用 JavaScript `Set` 快很多。

---

### `bitsetFromIndexList(indexList, numElements)`

作用：把一组覆盖下标转成紧凑的 `Uint32Array` bitset。

例子：

```text
covered indexes: [0, 2, 5]
bitset: bit 0 = 1, bit 2 = 1, bit 5 = 1
```

用在哪里：

- `greedySetCover()`

---

### `popcountBitset(b)`

作用：计算一个完整 bitset 里已经覆盖了多少约束。

用在哪里：

- `greedySetCover()` 用它判断是否已经覆盖全部 `j` 约束。

---

### `popcountAndNot(a, b)`

作用：计算 `a` 里有、但 `b` 里还没有的 bit 数量。

在本项目里的含义：

- `a`：某个候选组能覆盖的约束
- `b`：当前已选组已经覆盖的约束
- `a & ~b`：如果现在选择这个候选组，它能新增覆盖的约束

用在哪里：

- `greedySetCover()` 里的核心打分步骤。

---

### `bitsetOrInto(dest, src)`

作用：把一个覆盖 bitset 合并到另一个 bitset 里。

含义：

- 选中一个候选组后，把它能覆盖的约束加入全局已覆盖集合。

用在哪里：

- `greedySetCover()`

---

## 4. 候选去重

### `deduplicateByCoverage(allKGroups, coverageIndexes)`

作用：删除覆盖模式完全相同的候选组。

实现方式：

- 把每个候选的覆盖下标排序。
- 拼成字符串 key。
- 每个唯一 key 只保留第一个候选组。

为什么合理：

- 如果两个 `k` 组覆盖的 `j` 约束完全一样，那么从 set cover 的角度看，它们等价。
- 保留一个代表就能减少搜索空间，而且不改变能达到的覆盖模式。

返回值：

```js
{
  uniqueGroups,
  uniqueCoverage,
  originalCount,
  uniqueCount
}
```

用在哪里：

- `greedySetCover()`
- `backtrackSetCover()`

---

## 5. 启发式求解器

### `greedySetCover(nSamples, k, j, s, atLeast = 1, timeLimitMs = 4000, scanMode = 'auto')`

作用：用带时间限制的随机贪心算法近似求解大规模情况。

整体思路：

1. 生成所有候选 `k` 组。
2. 生成所有必须覆盖的 `j` 组合。
3. 预计算覆盖索引。
4. 按覆盖模式选择性去重。
5. 把覆盖列表转成 bitset。
6. 在时间预算内，重复运行随机贪心构造。
7. 返回找到的最好解。

重要阈值：

- `DEDUP_THRESHOLD = 12000`
  - 候选数量不太大时，按覆盖模式去重。
  - 候选数量太大时，跳过去重，避免还没开始求解就花太多时间。

- `LARGE_CANDIDATE_THRESHOLD = 12000`
  - 候选数量大时，使用随机扫描，而不是每一步都全量扫描。

- `STOCHASTIC_SAMPLE_SIZE = 1400`
  - 大规模情况下，每个贪心步骤随机检查的候选数量。

一次贪心选择怎么做：

1. 对每个候选计算 `newCov = popcountAndNot(candidateCoverage, coveredBits)`。
2. 找出新增覆盖最多的候选。
3. 如果有多个并列最优，随机选一个。
4. 加入 `selected`。
5. 把它的覆盖合并到 `coveredBits`。

为什么叫 GRASP-style：

- 它不是只跑一次确定性贪心。
- 它会在时间预算内重复运行随机化贪心构造。
- 在最佳候选之间随机选择，可以减少卡在某个局部选择上的风险。

保证：

- 它会尝试覆盖所有约束。
- 它不证明全局最优。

用在哪里：

- `solveOptimalSamples()` 的大搜索空间分支。
- `backtrackSetCover()` 里用它先找一个 greedy 上界。

---

### `removeRedundantGroups(selected, allJCombinations, j, s, atLeast)`

作用：后处理，把不必要的组删掉。

实现方式：

对每个已选组：

1. 临时移除这个组。
2. 重新计算剩余组覆盖了哪些约束。
3. 如果被移除的组原本覆盖的约束，剩余组也都能覆盖，那它就是冗余的。
4. 永久删除这个组。

为什么重要：

- 贪心构造可能会多选一些不必要的组。
- 这个步骤可以在不影响正确性的前提下减少组数。

成本提醒：

- 它会反复检查覆盖，可能比较贵。
- `solveOptimalSamples()` 只在规模阈值允许时运行它。

---

### `fastRadiusCoverHeuristic(nSamples, k)`

作用：针对一个常见重型情况的超快构造式启发式：

```text
j = k
s = k - 1
atLeast = 1
```

为什么这个情况特殊：

- 约束本身也是 `k` 组合。
- 一个选中的 `k` 组会覆盖：
  - 它自己
  - 任何只差一个元素的其他 `k` 组合

实现步骤：

1. 生成所有 `k` 组。
2. 给每个组建立下标。
3. 用 `Uint8Array` 记录哪些组还没有覆盖，变量名是 `uncovered`。
4. 反复选择第一个未覆盖的组。
5. 标记它自己和所有半径为 1 的邻居为已覆盖。
6. 返回选中的组。

优点：

- 对大规模情况非常快。

限制：

- 它是速度优先的构造式方法。
- 它不会像 GRASP 那样努力压低组数。

用在哪里：

- `solveOptimalSamples()` 中，当模式是 `fast` 且特殊条件满足时。

---

## 6. 精确求解器

### `backtrackSetCover(nSamples, k, j, s, atLeast = 1, maxGroups = Infinity)`

作用：对小规模问题求精确最小 set cover。

准备阶段：

1. 生成所有 `j` 组合。
2. 生成所有候选 `k` 组。
3. 建立覆盖索引。
4. 按覆盖模式去重。
5. 按覆盖数量从大到小排序候选。
6. 先跑一次贪心，得到初始上界。

主递归函数：

```js
backtrack(selected, covered, startIdx)
```

状态含义：

- `selected`：当前已经选择的组。
- `covered`：已经覆盖的 `j` 组合下标集合。
- `startIdx`：当前考虑到的候选下标。

剪枝规则：

1. 如果 `selected.length >= bestCount`，停止。
2. 如果所有约束都已覆盖，更新当前最好解。
3. 如果候选已经用完，停止。
4. 下界剪枝：

```text
uncovered = 总约束数 - 已覆盖约束数
lb = ceil(uncovered / maxSingleCover)
if selected.length + lb >= bestCount, stop
```

分支：

- 一个分支：选择当前候选，但前提是它能增加新覆盖。
- 另一个分支：跳过当前候选。

保证：

- 对小搜索空间，在当前项目的覆盖规则下，它返回精确最小解。

用在哪里：

- `solveOptimalSamples()` 中，当 `C(n,k) <= 30` 时。

---

## 7. 主入口

### `solveOptimalSamples(m, n, k, j, s, atLeast = 1, randomSamples = null, solveMode = 'balanced')`

作用：统筹整个求解过程。

步骤：

1. 确定被选样本：
   - 如果传入 `randomSamples`，并且长度等于 `n`，就直接使用。
   - 否则从 `1..m` 随机抽取 `n` 个值。

2. 计算搜索规模：

```js
totalKGroups = combination(n, k)
```

3. 选择求解分支：

- 如果 `totalKGroups <= 30`：
  - 运行 `backtrackSetCover()`
  - 方法名是 `backtrack`

- 否则，如果 `solveMode === 'fast'` 且特殊条件满足：
  - 运行 `fastRadiusCoverHeuristic()`
  - 方法名是 `grasp-fast`

- 否则：
  - 按时间预算运行 `greedySetCover()`
  - 方法名：
    - balanced 模式：`grasp`
    - fast 模式：`grasp-fast`
    - quality 模式：`grasp-quality`

4. 可选冗余删除：

- 较小的大规模情况允许做。
- quality 模式允许到更高阈值。

5. 返回标准化结果：

```js
{
  samples,
  groups,
  count,
  method
}
```

重要阈值：

- `EXACT_THRESHOLD = 30`
- `REDUNDANT_REMOVAL_THRESHOLD = 1500`
- `QUALITY_REDUNDANT_REMOVAL_THRESHOLD = 20000`

求解模式时间预算：

- `fast`：GRASP 阶段约 2.2 秒
- `balanced`：GRASP 阶段约 3.5 秒
- `quality`：GRASP 阶段约 5.5 秒

---

## 8. `api/verify-core.js`

验证逻辑和求解逻辑是分开的。这很重要，因为候选答案可能来自：

- 求解器输出
- 用户粘贴的候选答案
- 前端发送的预计算结果，也就是保存前的 `precomputed` 结果

验证器检查的是可行性，不检查全局最优性。

---

### `combination(arr, k)`

作用：为验证过程枚举组合。

和 `api/algorithm.js` 的区别：

- 这里接收数组，返回组合数组。
- `api/algorithm.js` 里的 `combination(n, k)` 只返回组合数量。

---

### `isPositiveInteger(value)`

作用：归一化之后检查是否为正整数。

用在哪里：

- `normalizeSamples()`
- `normalizeGroups()`
- `validateCandidate()`

---

### `isSubset(subset, groupSet)`

作用：检查 `subset` 里的每个值是否都存在于 `groupSet`。

用在哪里：

- `evaluateCoverage()`

---

### `normalizeSamples(samples)`

作用：验证并归一化选中的样本。

检查：

- 输入必须是非空数组。
- 每个值经过 `Number(...)` 后必须是正整数。
- 所有值必须唯一。

返回：

- 归一化后的数字样本数组。

---

### `normalizeGroups(groups)`

作用：验证并归一化候选组。

检查：

- 输入必须是数组。
- 每个组必须是非空数组。
- 每个组内的值经过 `Number(...)` 后必须是正整数。

返回：

- 归一化后的数字组数组。

安全意义：

- 会拒绝畸形值，比如字符串、HTML 注入一类 payload。

---

### `validateCandidate(samples, groups, k)`

作用：验证候选组结构。

检查：

- 样本有效且唯一。
- 组非空。
- `k` 是正整数。
- 每组长度必须等于 `k`。
- 每组内部不能有重复值。
- 每组里的值必须属于选中的样本集合。

这可以防止候选组使用不在当前 `n` 个样本里的值。

---

### `evaluateCoverage(samples, groups, j, s, atLeast = 1)`

作用：验证候选组是否满足所有覆盖约束。

步骤：

1. 从选中样本里生成所有 `j` 组合。
2. 把每个候选组转成 `Set`。
3. 对每个 `j` 组合：
   - 生成它内部所有 `s` 组合。
   - 计算有多少个 `s` 组合被任意候选组覆盖。
   - 所需数量是：
     - 如果 `j === s`，要求覆盖全部 `s` 组合。
     - 否则要求至少覆盖 `atLeast` 个。
4. 统计满足约束的数量。
5. 最多保存五个失败例子。

返回值：

```js
{
  total,
  satisfied,
  passed,
  coveragePct,
  failed
}
```

注意：

- 它验证的是可行性。
- 它不证明组数是全局最小。

---

### `verifyCoverageOrThrow(samples, groups, k, j, s, atLeast = 1)`

作用：严格验证包装函数。只有通过它的候选组，才可以被信任或保存。

步骤：

1. 归一化样本。
2. 归一化组。
3. 验证组结构。
4. 运行 `evaluateCoverage()`。
5. 如果覆盖失败，抛出错误，并带上第一个失败的 `j` 组合。

用在哪里：

- `api/solve.js` 保存 precomputed 结果前
- `cli/src/server.js` 本地 web 模式保存 precomputed 结果前
- 测试

---

## 9. API 集成

### `POST /api/solve`

文件：`api/solve.js`

职责：

- 验证参数。
- 验证 `solveMode`。
- 普通求解请求调用 `solveOptimalSamples()`。
- precomputed 保存请求调用 `verifyCoverageOrThrow()`。
- 可选保存结果到 Supabase。
- 返回结果和 timing 信息。

重要安全行为：

- 如果 precomputed 结果是伪造的或覆盖不完整，会在持久化之前被拒绝。

---

### `POST /api/verify`

文件：`api/verify.js`

职责：

- 验证 `k`、`j`、`s`、`atLeast`。
- 归一化 samples 和 groups。
- 验证组结构。
- 运行 `evaluateCoverage()`。
- 返回 pass/fail 和覆盖数据。

这个接口支撑 UI 里的 **Verify Candidate** 按钮。

---

## 10. `npm test` 能证明什么，不能证明什么

`npm test` 是项目回归检查。它不是数学证明，不保证每个启发式结果都是全局最优。

当前测试检查：

- 精确分支对经典小案例返回 4 组。
- 验证器会拒绝不完整候选组。
- 验证器会拒绝畸形值 / 注入式值。
- 伪造的 precomputed 保存会在持久化前被拒绝。
- 本地 DB 文件名校验会阻止路径穿越。

它能证明：

- 关键项目行为在改代码后仍然能跑。
- 精确分支和验证路径没有明显坏掉。
- 一些安全敏感路径有保护。

它不能证明：

- GRASP 对大规模情况全局最优。
- 所有参数组合都被穷尽测试。
- 启发式总能返回最小组数。

对大规模情况，正确性主要靠 coverage verification 检查；质量则用组数和运行时间 evidence 评估。
