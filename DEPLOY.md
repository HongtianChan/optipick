# 部署指南

## 前置准备

1. GitHub 仓库已创建：`HongtianChan/optipick`
2. Vercel 账号已注册并关联 GitHub
3. Supabase 项目已创建

## 步骤 1: 配置 Supabase 数据库

### 1.1 创建数据库表

1. 访问 Supabase Dashboard: https://supabase.com/dashboard/project/vmguvykpqihuifpdpvfl
2. 点击左侧菜单 "SQL Editor"
3. 点击 "New query"
4. 复制 `supabase-setup.sql` 文件内容并粘贴
5. 点击 "Run" 执行

### 1.2 获取 API 密钥

1. 在 Supabase Dashboard，点击 Settings → API
2. 复制以下信息：
   - **Project URL**: `https://vmguvykpqihuifpdpvfl.supabase.co`
   - **anon public key**: 在 "Project API keys" 下的 `anon` `public` key

## 步骤 2: 部署到 Vercel

### 方式 1: 通过 Vercel Dashboard（推荐）

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New Project"
3. 选择 GitHub 仓库 `HongtianChan/optipick`
4. 配置项目：
   - **Framework Preset**: Other
   - **Root Directory**: `./` (保持默认)
   - **Build Command**: 留空
   - **Output Directory**: 留空
   - **Install Command**: `cd api && npm install` (可选，Vercel 会自动检测)
5. **添加环境变量**：
   - 点击 "Environment Variables"
   - 添加：
     - `SUPABASE_URL` = `https://vmguvykpqihuifpdpvfl.supabase.co`
     - `SUPABASE_ANON_KEY` = (你的 anon key)
6. 点击 "Deploy"

### 方式 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目根目录执行
cd /Users/chenhongtian/Desktop/optimal-samples-selector

# 部署（会提示配置环境变量）
vercel

# 添加环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# 生产环境部署
vercel --prod
```

## 步骤 3: 验证部署

部署完成后，Vercel 会提供 URL，例如：
- `https://optipick.vercel.app`

访问该 URL，测试功能：
1. 输入参数并点击 execute
2. 测试 save 功能
3. 测试 list/show/delete 命令

## 项目结构

```
optimal-samples-selector/
├── api/
│   ├── solve.js          # /api/solve 端点
│   ├── files.js          # /api/files 端点
│   ├── file.js           # /api/file 端点
│   └── package.json      # API 依赖（@supabase/supabase-js）
├── cli/                  # CLI 工具（本地使用）
├── web-ui/
│   └── index.html        # 前端界面
├── vercel.json           # Vercel 配置
└── supabase-setup.sql    # 数据库初始化脚本
```

## 故障排查

### API 返回错误

1. 检查 Vercel 环境变量是否正确设置
2. 检查 Supabase 表是否创建成功
3. 查看 Vercel 函数日志：Vercel Dashboard → 项目 → Functions → 查看日志

### 数据库连接失败

1. 确认 Supabase 项目状态为 Active
2. 检查 API key 是否正确
3. 确认 RLS (Row Level Security) 策略已设置

## 更新代码

代码更新后，Vercel 会自动重新部署（如果启用了 GitHub 集成）

```bash
git add .
git commit -m "更新说明"
git push
# Vercel 会自动触发部署
```
