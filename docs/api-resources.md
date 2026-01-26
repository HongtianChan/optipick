# API 资源参考

## 项目需求

我们的项目是**集合覆盖问题（Set Cover Problem）**，属于：
- 组合优化（Combinatorial Optimization）
- NP-hard 问题
- 需要精确解（小规模）或近似解（大规模）

## 搜索关键词

### 英文关键词
1. **Set Cover Problem API**
2. **Combinatorial Optimization API**
3. **Mathematical Optimization Service**
4. **Integer Linear Programming API**
5. **Constraint Programming API**
6. **OR-Tools API**（Google 的优化工具）
7. **Gurobi API**（商业优化求解器）
8. **CPLEX API**（IBM 的优化求解器）
9. **OptaPlanner API**（开源规划引擎）
10. **Constraint Solver API**

### 中文关键词
1. 集合覆盖问题 API
2. 组合优化服务
3. 数学优化 API
4. 整数规划求解器

## 可能的 API 服务

### 1. Google OR-Tools
- **类型**：开源优化工具库
- **特点**：支持多种优化问题，包括集合覆盖
- **API**：主要是库，不是 Web API
- **适用性**：⭐⭐⭐⭐（需要自己封装）
- **链接**：https://developers.google.com/optimization

### 2. Gurobi Optimizer
- **类型**：商业优化求解器
- **特点**：强大的整数规划求解器
- **API**：有 Python/Java/C++ API，也有 Web API（需要许可证）
- **适用性**：⭐⭐⭐⭐⭐（功能强大但需要付费）
- **链接**：https://www.gurobi.com/

### 3. IBM CPLEX
- **类型**：商业优化求解器
- **特点**：企业级优化工具
- **API**：多种语言支持，有云服务
- **适用性**：⭐⭐⭐⭐（商业产品）
- **链接**：https://www.ibm.com/products/ilog-cplex-optimization-studio

### 4. OptaPlanner
- **类型**：开源规划引擎
- **特点**：Java 框架，支持约束规划
- **API**：Java 库，可封装为 REST API
- **适用性**：⭐⭐⭐（需要 Java 后端）
- **链接**：https://www.optaplanner.org/

### 5. Z3 Theorem Prover
- **类型**：开源 SMT 求解器
- **特点**：支持约束求解
- **API**：多种语言绑定
- **适用性**：⭐⭐⭐（可能过度复杂）
- **链接**：https://github.com/Z3Prover/z3

### 6. 云服务 API

#### AWS Braket / Azure Quantum
- **类型**：量子计算服务（可能过度）
- **适用性**：⭐（不适合当前项目）

#### Google Cloud Optimization AI
- **类型**：优化服务
- **适用性**：⭐⭐⭐（需要确认是否支持集合覆盖）

## 推荐方案

### 对于当前项目

**不推荐使用外部 API**，原因：
1. **问题规模小**：我们的 n ≤ 25，k ≤ 7，可以本地快速求解
2. **成本考虑**：商业 API 需要付费
3. **依赖风险**：外部 API 可能不稳定
4. **已有实现**：我们已经实现了回溯和贪心算法

### 如果需要优化性能

**可以考虑：**
1. **使用 OR-Tools 库**（本地）
   - 集成到 Node.js（通过 Python 桥接或直接使用）
   - 提供更好的优化算法

2. **自己实现更高级算法**
   - 分支限界（Branch and Bound）
   - 线性规划松弛
   - 启发式算法

3. **使用 WebAssembly**
   - 将 C++ 优化算法编译为 WASM
   - 在浏览器中运行

## 实际建议

### 当前实现已经足够
- 小规模（n ≤ 10）：回溯算法，精确解
- 大规模（n > 10）：贪心算法，近似解
- 性能：秒级完成

### 如果确实需要 API

**搜索方向：**
1. GitHub 搜索："set cover solver API"
2. npm 搜索："set-cover"、"combinatorial-optimization"
3. 查看论文实现：arXiv 上的算法实现

**关键词组合搜索：**
- "set cover problem REST API"
- "combinatorial optimization as a service"
- "mathematical optimization API free"
- "integer programming solver API"

## 相关论文和资源

1. **Feige (1998)** - Set Cover 近似下界
2. **OR-Tools 文档** - Google 优化工具
3. **CPLEX 文档** - IBM 优化器
4. **arXiv** - 搜索 "set cover algorithm"

## 总结

**对于你的项目：**
- ✅ 当前实现已经足够好
- ❌ 不需要外部 API（成本、依赖、复杂度）
- 💡 如果优化，考虑集成 OR-Tools 或改进算法

**搜索建议：**
- 主要搜索："set cover problem solver"
- 次要搜索："combinatorial optimization API"
- 学术搜索："minimum set cover algorithm implementation"
