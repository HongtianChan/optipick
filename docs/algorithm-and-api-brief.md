# 算法与 API 简介（汇报用）

## 一、api/algorithm.js 函数说明

| 函数 | 作用 |
|------|------|
| `combination(n, k)` | 计算组合数 C(n,k)，循环乘法实现。 |
| `generateCombinations(arr, k)` | 从数组 arr 中生成所有选 k 个的组合，回溯枚举。 |
| `intersectionSize(set1, set2)` | 求两个集合交集的元素个数。 |
| `coversRequirement(kGroup, jCombination, j, s, atLeast)` | 判断一个 k 组是否“覆盖”某个 j 组合：交集≥s；若 j=s 则要求该 j 组合内所有 s 子集都在 k 组中出现；若 j≠s 则要求至少 atLeast 个 s 子集被覆盖。 |
| `buildCoverageIndexes(...)` | **新增**：预计算每个 k 组覆盖的 j 组合下标列表，供贪心/回溯加速及启发式排序使用。 |
| `greedySetCover(nSamples, k, j, s, atLeast)` | 贪心集合覆盖：用覆盖下标快速找能新覆盖最多 j 组合的 k 组。近似解。 |
| `removeRedundantGroups(...)` | **新增**：贪心解后处理——若某组覆盖的 j 组合都已被其他组覆盖则删除（分层精修）。 |
| `backtrackSetCover(nSamples, k, j, s, atLeast)` | 回溯集合覆盖：先跑贪心得上界，k 组按覆盖数降序（启发式），下界剪枝。精确解（C(n,k)≤100）。 |
| `solveOptimalSamples(...)` | 入口：确定 n 个样本，按 C(n,k) 是否≤100 选回溯或贪心；贪心后调 `removeRedundantGroups`。返回 samples、groups、count、method。 |

> 详细优化说明见 [algorithm-optimizations.md](./algorithm-optimizations.md)

---

## 二、我们调用的 API

### 1. 本系统提供的 HTTP API（前端调用）

| 接口 | 方法 | 作用 |
|------|------|------|
| `/api/solve` | POST | 传入 m,n,k,j,s,atLeast,samples,save；跑算法，可选写 Supabase；返回 samples、groups、count、method、fileName。 |
| `/api/files` | GET | 从 Supabase 拉取 results 表的 file_name 列表，按时间倒序。 |
| `/api/file` | GET | 查询参数 f=文件名，从 Supabase 读该条记录的 m,n,k,j,s,samples,groups,count。 |
| `/api/file` | DELETE | body 传 `{ f: 文件名 }`，在 Supabase 中删除该条记录。 |

### 2. 外部依赖（后端调用）

- **Supabase REST API**（通过 `@supabase/supabase-js`）  
  - 使用：`createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` 后对表 `results` 做 `.from('results').select/insert/delete`。  
  - 用途：存/取/删每次求解的结果（文件名、参数、samples、groups、count 等）。

除 Supabase 外，算法与业务逻辑**不调用**其他第三方 API。

---

## 三、系统流程概览

1. **输入**：m,n,k,j,s；可指定 n 个样本，或由系统从 1..m 中随机取 n 个。  
2. **问题**：在 n 个样本上，用最少的“k 组”（每个组为 k 个样本）覆盖所有“j 组合”的约束（每个 j 组合需满足与某 k 组的交集对 s、atLeast 的覆盖条件）。  
3. **算法选择**：若 C(n,k)≤100 用回溯（含启发式排序+下界剪枝）求最优；否则用贪心+冗余移除求近似。  
4. **输出**：最少（或近似最少）的 k 组集合；前端展示，可选“保存”写入 Supabase。  
5. **持久化**：保存/列表/查看/删除均通过本项目 HTTP API 转发到 Supabase 完成。

---

## 四、算法思想（一句话）

在“k 组集合”上做集合覆盖：目标是用最少的 k 组，使每一个 j 组合都被至少一个 k 组在 s、atLeast 意义下覆盖；小规模用回溯求最优，大规模用贪心求近似。

---

## 五、创新点

1. **问题形式化**  
   不是标准 Set Cover，而是带 (j,s,atLeast) 的约束型集合覆盖：j=s 时要求每个 j 组合的**所有** s 子集都被某 k 组包含（全覆盖）；j≠s 时要求**至少** atLeast 个 s 子集被覆盖（部分覆盖）。`coversRequirement` 把这两种语义统一形式化并实现。

2. **规模自适应策略**  
   以 C(n,k)≤100 为界自动选算法：小规模用回溯得最优解，大规模用贪心得近似解，无需用户调参，在可接受时间内兼顾最优性与可算性。

3. **覆盖判定与求解器解耦**  
   “一个 k 组是否覆盖一个 j 组合”全部由 `coversRequirement` 负责，backtrack/greedy 只依赖该判定。覆盖语义可扩展（如加新规则主要改判定），求解逻辑复用。

4. **分层与启发式优化**  
   - **分层**：贪心后做冗余组移除（精修层）；回溯前先跑贪心得上界。  
   - **启发式**：覆盖预计算（`buildCoverageIndexes`）、k 组按覆盖数降序排列、下界剪枝。  
   详见 [algorithm-optimizations.md](./algorithm-optimizations.md)。

5. **说明**  
   回溯与贪心均为经典方法，未提出新算法或新复杂度结论；创新主要在**建模**（约束型覆盖形式化）与**工程策略**（规模自适应 + 分层精修 + 启发式剪枝）。
