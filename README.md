# Optipick - Optimal Samples Selector

最优样本选择系统 - 集合覆盖问题求解器

**在线访问**: https://optipick-system.vercel.app

## 功能

- 计算最优样本组（集合覆盖问题）
- 支持随机/手动输入样本
- 结果保存到数据库（Supabase）
- CLI 命令行工具
- Web UI 图形界面（终端风格）
- Vercel 部署，支持在线使用

## 项目结构

```
optimal-samples-selector/
├── api/                    # Vercel serverless functions
│   ├── solve.js           # 求解 API
│   ├── files.js           # 文件列表 API
│   ├── file.js            # 文件操作 API
│   └── algorithm.js       # 算法核心
├── cli/                   # CLI 工具
│   ├── index.js          # CLI 入口
│   └── src/              # 源代码
├── web-ui/                # Web UI 源码
│   └── index.html        # 前端界面
├── public/                # 静态文件（部署用）
│   └── index.html
├── docs/                  # 文档
│   ├── vercel-deployment-guide.md  # 部署指南
│   ├── bentossell-style.md         # 设计风格
│   └── color-palette.md            # 颜色调色板
├── package.json           # 根目录依赖
├── vercel.json            # Vercel 配置
└── supabase-setup.sql     # 数据库初始化脚本
```

## 安装

```bash
cd cli
npm install
```

## 使用方法

### CLI 命令行

```bash
# 基本用法
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5

# 手动输入样本
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --samples "1,2,3,4,5,6,7,8"

# 保存结果
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5 --save

# 列出所有 DB 文件
node index.js list

# 显示文件内容
node index.js show -f 45-8-6-6-5-1-4

# 删除文件
node index.js delete -f 45-8-6-6-5-1-4

# 启动 Web UI
node index.js web
# 然后访问 http://localhost:3000
```

### Web UI

1. 启动服务器：
```bash
node index.js web
```

2. 打开浏览器访问：http://localhost:3000

3. 功能：
   - 输入参数 m, n, k, j, s
   - 选择随机或手动输入模式
   - 执行计算
   - 保存结果
   - 查看/删除 DB 文件

## 参数说明

- **m**: 总样本数 (45-54)
- **n**: 从 m 中选的样本数 (7-25)
- **k**: 组大小 (4-7)
- **j**: j 参数 (s <= j <= k)
- **s**: s 参数 (3-7)
- **at-least**: 至少覆盖的 s 组合数 (默认 1)

## 算法

- **小规模** (n ≤ 10): 回溯搜索（精确解）
- **大规模** (n > 10): 贪心算法（近似解）

## 示例

### E.g. 5: m=45, n=8, k=6, j=6, s=5
```bash
node index.js solve -m 45 -n 8 -k 6 -j 6 -s 5
```
结果：最少 4 组

## 文件存储

### 本地 CLI
DB 文件保存在：`~/.optimal-samples-selector/db/`

文件名格式：`m-n-k-j-s-x-y`
- x: 运行次数
- y: 结果数量

### 在线版本
数据存储在 Supabase 数据库

## 部署

### 在线版本
已部署到 Vercel：https://optipick-system.vercel.app

### 本地部署
详细部署流程见：[docs/vercel-deployment-guide.md](./docs/vercel-deployment-guide.md)

## 文档

- [部署指南](./docs/vercel-deployment-guide.md) - Vercel + Supabase 完整部署流程
- [设计风格](./docs/bentossell-style.md) - Web UI 设计参考
- [颜色调色板](./docs/color-palette.md) - UI 颜色规范
- [项目说明](./Group%20Project%20说明.md) - 项目需求文档

## 技术栈

- **后端**: Node.js, Vercel Serverless Functions
- **数据库**: Supabase (PostgreSQL)
- **前端**: HTML, CSS, JavaScript (终端风格 UI)
- **部署**: Vercel
- **CLI**: Commander.js

