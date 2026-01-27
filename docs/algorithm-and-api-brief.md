# 算法与 API 简介（汇报用）

## 一、api/algorithm.js 函数说明

| 函数 | 作用 |
|------|------|
| `combination(n, k)` | 计算组合数 C(n,k)，循环乘法实现。 |
| `generateCombinations(arr, k)` | 从数组 arr 中生成所有选 k 个的组合，回溯枚举。 |
| `intersectionSize(set1, set2)` | 求两个集合交集的元素个数。 |
| `coversRequirement(kGroup, jCombination, j, s, atLeast)` | 判断一个 k 组是否“覆盖”某个 j 组合：交集≥s；若 j=s 则要求该 j 组合内所有 s 子集都在 k 组中出现；若 j≠s 则要求至少 atLeast 个 s 子集被覆盖。 |
| `greedySetCover(nSamples, k, j, s, atLeast)` | 贪心集合覆盖：每轮选能新覆盖最多未覆盖 j 组合的 k 组，直到全部覆盖。近似解，适用于规模大时。 |
| `backtrackSetCover(nSamples, k, j, s, atLeast)` | 回溯集合覆盖：枚举选/不选每个 k 组，剪枝（当前组数≥已知最优则停），得到最少组数的精确解。仅在小规模（C(n,k)≤100）时使用。 |
| `solveOptimalSamples(m, n, k, j, s, atLeast, randomSamples)` | 入口：确定 n 个样本（传入或从 1..m 随机），按 C(n,k) 是否≤100 选回溯或贪心，返回 samples、groups、count、method。 |

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
3. **算法选择**：若 C(n,k)≤100 用回溯求最优；否则用贪心求近似。  
4. **输出**：最少（或近似最少）的 k 组集合；前端展示，可选“保存”写入 Supabase。  
5. **持久化**：保存/列表/查看/删除均通过本项目 HTTP API 转发到 Supabase 完成。

---

## 四、算法思想（一句话）

在“k 组集合”上做集合覆盖：目标是用最少的 k 组，使每一个 j 组合都被至少一个 k 组在 s、atLeast 意义下覆盖；小规模用回溯求最优，大规模用贪心求近似。
