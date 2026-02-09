# Optipick 开发历程

完整记录本项目从零到上线的改进过程：页面设计、算法设计、性能优化、灵感来源。

---

## 一、项目概述

**Optipick** —— 最优样本选取系统。给定 m 个总样本，从中选 n 个，求最少的 k 组使得所有 j 组合在 (s, atLeast) 意义下被覆盖。本质是一个**约束型集合覆盖问题**。

- 线上地址：https://optipick-system.vercel.app
- 技术栈：HTML/CSS/JS（前端）、Node.js Serverless（API）、Supabase（数据库）、Vercel（部署）
- CLI 工具：纯本地 Node.js，不依赖外部服务

---

## 二、页面设计

### 2.1 风格灵感

参考 **Ben Tossell**（https://www.bentossell.com/）的终端/CLI 风格网站：
- 深色背景 + 等宽字体
- 命令提示符交互（`$ >`）
- macOS 风格的窗口按钮（红黄绿）

**核心理念**：让用户觉得自己在用一个真正的终端工具，而不是一个普通网页。

### 2.2 配色方案

基于 **GitHub Dark** 主题：

| 用途 | 色值 |
|------|------|
| 主背景 | `#0d1117` |
| 窗口背景 | `#161b22` / `#21262d` |
| 边框 | `#30363d`，hover `#484f58` |
| 主文字 | `#c9d1d9`，次要 `#8b949e` |
| 命令/链接 | `#58a6ff` |
| 成功 | `#7ee787` |
| 错误 | `#f85149` |
| 按钮 | `#238636` → hover `#2ea043` |

### 2.3 交互设计

1. **命令行提示符**：输入参数后，终端区域模拟 `solving: m=45, n=8, k=6, j=6, s=5` → `solution found: 4 groups (using 0.1 second)` 的真实 CLI 输出。
2. **8bit 点击效果**：点击页面时产生蓝色像素粒子（`#58a6ff` 系），致敬复古游戏风。
3. **文件选择器**：存储的结果以"文件列表"形式展示，点击高亮选中，模拟终端下的文件浏览。
4. **搜索空间提示**：参数区下方实时显示 `C(n,k)` 值，告知用户当前会走精确还是近似算法。
5. **打印优化**：print 只输出参数、样本、结果，不打印整个网页。

### 2.4 UI 迭代过程

| 阶段 | 改进 |
|------|------|
| v1 | 基础表单 + 结果展示，白色背景 |
| v2 | 切换到终端/CLI 深色主题，加窗口按钮 |
| v3 | 加命令行模拟输出、8bit 点击效果 |
| v4 | 优化 User Input / Values Input 布局，改善可读性 |
| v5 | 加搜索空间 C(n,k) 实时提示 |
| v6 | 打印功能专门输出参数+样本+结果，加条件说明 |
| v7（实验，已回退） | 尝试滚动时 ASCII 标题压缩消失（max-height + opacity 过渡），为下方内容留空间。实际效果不理想——过渡动画与终端风格不协调，回退保留原始固定标题 |

---

## 三、算法设计

### 3.1 问题建模

不是标准 Set Cover。我们定义了**约束型集合覆盖**：
- **全集**：所有 C(n,j) 个 j 组合
- **子集族**：所有 C(n,k) 个 k 组，每个 k 组"覆盖"若干 j 组合
- **覆盖条件**：`coversRequirement(kGroup, jCombination, j, s, atLeast)`
  - j = s 时：k 组必须**完全包含** j 组合（所有 s 子集都在 k 组中）
  - j ≠ s 时：k 组与 j 组合的交集 ≥ s，至少 atLeast 个 s 子集被覆盖

**创新点**：把 (j, s, atLeast) 三个参数统一形式化为覆盖判定函数，再套用集合覆盖框架。

### 3.2 双轨策略

以 `C(n,k) ≤ 100` 为界：
- **小规模** → 回溯（backtrack）：精确最优解
- **大规模** → 贪心（greedy）：近似解 + 冗余移除

用户无需手动选算法，系统自动判断。

### 3.3 基础实现

| 函数 | 作用 |
|------|------|
| `combination(n,k)` | 组合数 C(n,k) |
| `generateCombinations(arr,k)` | 枚举所有 k 组合 |
| `coversRequirement(...)` | 判断 k 组是否覆盖 j 组合 |
| `greedySetCover(...)` | 贪心：每轮选新增覆盖最多的 k 组 |
| `backtrackSetCover(...)` | 回溯：穷举找最少组数 |
| `solveOptimalSamples(...)` | 入口：选算法、返回结果 |

---

## 四、算法优化历程

### 第一轮：分层 + 启发式搜索

**灵感来源**：将产品设计中的「粗稿 → 精修」思想迁移到算法。

#### 4.1 分层（Layering）

1. **贪心 + 冗余移除**
   - 第一层：贪心得可行解
   - 第二层：`removeRedundantGroups` 逐个检查，若某组覆盖的 j 组合已被其他组覆盖则删除
   - 效果：贪心解往往有冗余，移除后组数减少

2. **回溯的"上界层"**
   - 回溯前先跑一遍贪心，用贪心解长度作为上界 `bestCount`
   - 剪枝条件更紧，更早停止无效搜索

#### 4.2 启发式搜索（Heuristic Search）

1. **覆盖预计算** — `buildCoverageIndexes`
   - 预计算每个 k 组覆盖哪些 j 组合的下标
   - 贪心/回溯共用，避免重复调用 `coversRequirement`

2. **启发式排序**
   - k 组按覆盖数降序排列
   - 回溯时先试覆盖多的组，更快找到好解

3. **下界剪枝**
   - `lb = ceil(未覆盖数 / 单组最大覆盖数)`
   - 若 `当前组数 + lb >= bestCount`，直接剪掉

---

### 第二轮：Burnside 式去重

**灵感来源**：群论中的 **Burnside 引理**——利用对称性，只数"本质不同"的情况。

**核心发现**：很多 k 组虽然元素不同，但覆盖的 j 组合集合完全相同——它们是"等价"的，选谁效果一样。

**实现** — `deduplicateByCoverage`：
- 对每个 k 组，用其覆盖下标列表 `sort().join(',')` 作为等价类 key
- 同一等价类只保留一个代表元
- 搜索空间从 C(n,k) 缩减到「本质不同的覆盖类数」

**应用**：贪心和回溯都在去重后的集合上搜索。

---

### 第三轮：性能工程优化

**问题**：n=15, k=6 时 C(15,6)=5005，`buildCoverageIndexes` 需要检查约 2500 万次 (k组, j组合) 对。

#### 4.3 Set 预计算复用

**问题**：每次 `coversRequirement` 都 `new Set(kGroup)`，2500 万次 Set 分配。

**优化**：
- 在 `buildCoverageIndexes` 入口对每个 k 组建一次 Set：`kGroupSets[g] = new Set(allKGroups[g])`
- `coversRequirement` 增加可选参数 `kGroupSet`，传入时直接用

#### 4.4 贪心内层位图化（Bitset Greedy）

**灵感来源**：竞赛编程中常见的 bitset 优化——用位运算替代集合操作，获得 32x 加速。

**实现**：
- 用 `Uint32Array` 表示覆盖关系
- 每轮选组：`newCov = popcount(groupBits & ~coveredBits)`
- 更新：`coveredBits |= groupBits`
- 相关函数：`popcount32`、`bitsetFromIndexList`、`popcountBitset`、`popcountAndNot`、`bitsetOrInto`

#### 4.5 覆盖检查早退

当 `j ≠ s` 且 `atLeast = 1` 时，只需判断「交集是否 ≥ s」：
- `intersectionAtLeastWithSet`：遍历 j 组合时，计数到 s 即返回 true
- 在 `buildCoverageIndexes` 的热路径中调用

#### 性能对比（m=45, n=15, k=6, j=6, s=5）

| 版本 | 耗时 |
|------|------|
| 优化前（基础实现） | ~50s |
| + 分层 + 启发式 | ~47s |
| + Set 预计算复用 | ~45s |
| + 位图 + 早退 | **~20s** |

---

## 五、系统架构

```
用户浏览器
  ↓ POST /api/solve
Vercel Serverless Function
  → algorithm.js 计算
  → Supabase 存储（可选）
  ↓ 返回 JSON
用户浏览器展示结果
```

### 本地 CLI

```bash
cd cli && node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5
```

纯本地运行，不依赖网络。

---

## 六、部署

- **平台**：Vercel（免费 Hobby 计划）
- **数据库**：Supabase（免费 PostgreSQL）
- **域名**：https://optipick-system.vercel.app
- **部署方式**：`vercel --prod` 手动部署，或 GitHub push 自动部署
- **环境变量**：`SUPABASE_URL`、`SUPABASE_ANON_KEY`（在 Vercel Dashboard 配置）

---

## 七、灵感来源总结

| 灵感 | 来源 | 应用 |
|------|------|------|
| 终端风格 UI | Ben Tossell 个人网站 | 整体页面设计 |
| GitHub Dark 配色 | GitHub 暗色主题 | 色值体系 |
| 8bit 粒子效果 | 复古游戏 | 点击反馈 |
| 分层求解 | 产品设计「粗稿→精修」 | 贪心+冗余移除、回溯用贪心上界 |
| Burnside 引理 | 群论/对称性 | 覆盖等价类去重 |
| Bitset 优化 | 竞赛编程（USACO/Codeforces） | 贪心内层位运算加速 |
| 早退策略 | 短路求值（Short-circuit） | 覆盖检查达到阈值即返回 |

---

## 八、文件结构

```
optimal-samples-selector/
├── api/                 # Vercel serverless functions
│   ├── algorithm.js     # 算法核心（与 cli 同步）
│   ├── solve.js         # POST /api/solve
│   ├── files.js         # GET /api/files
│   └── file.js          # GET/DELETE /api/file
├── cli/                 # 命令行工具（纯本地）
│   └── src/algorithm.js # 算法核心
├── web-ui/              # 前端源码
│   └── index.html       # 主页面
├── public/              # Vercel 静态文件
│   └── index.html       # 部署用（与 web-ui 同步）
├── database/            # 数据库脚本
│   └── supabase-setup.sql
├── docs/                # 文档
├── assets/              # 静态资源
└── vercel.json          # Vercel 配置
```

---

## 九、关键决策

| 决策 | 选择 | 原因 |
|------|------|------|
| C(n,k)≤100 为精确/近似分界 | 100 | 回溯在此规模内可接受时间完成 |
| Vercel 而非自建服务器 | Vercel | 免费、自动 HTTPS、Serverless 免运维 |
| Supabase 而非 SQLite | Supabase | 免费 PostgreSQL、有 REST API、适合 Serverless |
| 不用框架（React/Vue） | 原生 HTML/CSS/JS | 项目简单，无需构建工具 |
| CLI 和 Web 共享算法文件 | 手动同步 | 避免引入 monorepo 工具的复杂度 |
