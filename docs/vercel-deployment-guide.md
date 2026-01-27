# Vercel 部署流程指南

基于 optipick 项目的实际部署经验，记录完整的 Vercel + Supabase 部署流程。

## 前置准备

1. **GitHub 仓库**
   - 项目已推送到 GitHub
   - 仓库名称：`HongtianChan/optipick`

2. **Vercel 账号**
   - 注册 Vercel 账号：https://vercel.com
   - 关联 GitHub 账号

3. **Supabase 项目**
   - 创建 Supabase 项目
   - 获取 Project URL 和 API Key

## 步骤 1: 安装 Vercel CLI

```bash
npm i -g vercel
```

验证安装：
```bash
vercel --version
```

## 步骤 2: 登录 Vercel

```bash
vercel login
```

按提示在浏览器完成认证。

## 步骤 3: 项目配置

### 3.1 创建必要的文件

**根目录 `package.json`**（如果还没有）：
```json
{
  "name": "project-name",
  "version": "1.0.0",
  "scripts": {
    "build": "echo 'No build step required'"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.91.1"
  }
}
```

**`vercel.json`**：
```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/index.html"
    }
  ]
}
```

**项目结构**：
```
project/
├── api/              # Serverless functions
│   ├── solve.js
│   ├── files.js
│   └── package.json
├── public/            # 静态文件（Vercel 需要）
│   └── index.html
├── package.json       # 根目录依赖
└── vercel.json        # Vercel 配置
```

### 3.2 创建 public 目录

Vercel 需要 `public` 目录来服务静态文件：

```bash
mkdir -p public
cp web-ui/index.html public/index.html
# 或直接移动静态文件到 public/
```

## 步骤 4: 配置 Supabase

### 4.1 创建数据库表

1. 访问 Supabase Dashboard
2. 进入 SQL Editor → New query
3. 复制项目内 `database/supabase-setup.sql` 内容并执行

表结构示例（results 表）：
```sql
CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT UNIQUE NOT NULL,
  m INTEGER NOT NULL,
  n INTEGER NOT NULL,
  k INTEGER NOT NULL,
  j INTEGER NOT NULL,
  s INTEGER NOT NULL,
  samples JSONB NOT NULL,
  groups JSONB NOT NULL,
  count INTEGER NOT NULL,
  run_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_params ON results(m, n, k, j, s);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON results
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 4.2 获取 API 密钥

1. Supabase Dashboard → Settings → API
2. 复制：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: 在 "Project API keys" 下

## 步骤 5: 部署到 Vercel

### 5.1 首次部署

在项目根目录执行：
```bash
vercel
```

按提示操作：
- 是否链接现有项目：`N`（首次部署）
- 项目名称：直接回车（使用默认）
- 目录：直接回车（使用 `./`）

### 5.2 设置环境变量

**添加 SUPABASE_URL**：
```bash
vercel env add SUPABASE_URL
```
- 是否敏感：`y`
- 值：`https://xxx.supabase.co`
- 环境：选择 **Production** 和 **Preview**（敏感变量不能选 Development）

**添加 SUPABASE_ANON_KEY**：
```bash
vercel env add SUPABASE_ANON_KEY
```
- 是否敏感：`y`
- 值：你的 anon key
- 环境：选择 **Production** 和 **Preview**

**查看环境变量**：
```bash
vercel env ls
```

### 5.3 生产环境部署

```bash
vercel --prod
```

部署完成后会显示：
- 部署 URL：`https://project-name-xxx.vercel.app`
- 别名：`https://project-name.vercel.app`

## 步骤 6: 配置域名

### 6.1 修改项目名称

**通过 Dashboard**：
1. Vercel Dashboard → 项目 → Settings → General
2. 修改 Project Name
3. 新域名：`https://new-name.vercel.app`

**注意**：如果域名被占用，尝试变体：
- `project-name-app.vercel.app`
- `project-name-system.vercel.app`
- `project-name-web.vercel.app`

### 6.2 删除旧项目（如需要）

```bash
vercel remove old-project-name --yes
```

### 6.3 查看项目列表

```bash
vercel projects ls
```

## 步骤 7: 验证部署

### 7.1 检查部署状态

```bash
vercel ls
```

### 7.2 测试访问

```bash
curl -I https://your-domain.vercel.app
```

应该返回 `HTTP/2 200`。

### 7.3 查看日志

```bash
vercel inspect https://your-deployment.vercel.app --logs
```

## 常见问题

### 1. 404 NOT_FOUND

**原因**：缺少 `public` 目录或路由配置错误

**解决**：
- 确保有 `public/` 目录
- 检查 `vercel.json` 的 rewrites 配置
- 确保静态文件在 `public/` 目录下

### 2. 环境变量未生效

**原因**：环境变量未设置或设置错误

**解决**：
```bash
vercel env ls  # 检查环境变量
vercel --prod  # 重新部署
```

### 3. 域名被占用

**原因**：域名已被其他项目使用

**解决**：
- 使用域名变体
- 或删除占用该域名的旧项目

### 4. 敏感变量不能设置到 Development

**原因**：Vercel 限制

**解决**：只选择 Production 和 Preview 环境

### 5. API 函数 404

**原因**：API 文件路径或导出格式错误

**解决**：
- 确保 API 文件在 `api/` 目录下
- 确保使用正确的导出格式：`module.exports = async (req, res) => { ... }`
- 检查 `vercel.json` 路由配置

## 项目结构示例

```
project/
├── api/
│   ├── solve.js          # /api/solve
│   ├── files.js          # /api/files
│   ├── file.js           # /api/file
│   ├── algorithm.js      # 算法核心（复制到 api/ 避免路径问题）
│   └── package.json      # API 依赖
├── public/
│   └── index.html        # 前端页面
├── package.json          # 根目录依赖
├── vercel.json           # Vercel 配置
└── .gitignore           # 确保不忽略必要文件
```

## 部署工作流程

**自动部署**：push 到 GitHub 后 Vercel 自动部署（约 1–3 分钟）。需在 Vercel 中正确关联仓库。

**手动部署**：`vercel --prod`

**修改 `web-ui/index.html` 后**：同步到 `public/` 再提交  
`cp web-ui/index.html public/index.html`

**环境变量修改后**：需重新部署（Dashboard 改完或 `vercel --prod`）才生效。

## 故障排查

**Failed to fetch**：  
- 本地需用 `node cli/index.js web` 起服务访问，不要直接打开 HTML。  
- 线上用 https://optipick-system.vercel.app。  
- 检查 Network/Console，验证 API：  
  `curl -X POST https://optipick-system.vercel.app/api/solve -H "Content-Type: application/json" -d '{"m":45,"n":8,"k":6,"j":6,"s":5}'`

**API/DB 异常**：检查 Vercel 环境变量、Supabase 表与 RLS、Vercel 函数日志。

**国内无法访问**：见 [中国大陆访问解决方案](./china-access-solutions.md)。

---

## 更新部署

代码更新后：`git add . && git commit -m "更新说明" && git push`，再视需要执行 `vercel --prod` 或等待自动部署。

## 有用的命令

```bash
# 查看项目列表
vercel projects ls

# 查看部署列表
vercel ls

# 查看环境变量
vercel env ls

# 删除项目
vercel remove project-name --yes

# 查看部署详情
vercel inspect deployment-url

# 查看日志
vercel inspect deployment-url --logs

# 重新部署
vercel --prod
```

## 注意事项

1. **敏感信息**：环境变量标记为敏感后，不能设置到 Development 环境
2. **public 目录**：Vercel 需要 `public/` 目录来服务静态文件
3. **API 路径**：`api/` 目录下的文件自动映射为 `/api/*` 路由
4. **域名限制**：`.vercel.app` 域名如果被占用，需要选择其他名称
5. **环境变量**：修改环境变量后需要重新部署才能生效

## 参考

- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
- 项目仓库：https://github.com/HongtianChan/optipick
