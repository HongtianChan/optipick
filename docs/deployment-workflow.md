# 部署工作流程

## 自动部署（推荐）

### 如果已配置 GitHub 集成

**Vercel 会自动部署**，无需手动操作：

1. **修改代码**
   ```bash
   # 修改文件
   # ...
   ```

2. **提交并推送**
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

3. **Vercel 自动部署**
   - Vercel 检测到 GitHub push
   - 自动触发部署
   - 几分钟后新版本上线

**检查自动部署状态：**
- 访问 Vercel Dashboard：https://vercel.com/dashboard
- 查看项目的 Deployments 标签
- 可以看到每次 push 的部署状态

## 手动部署

### 如果需要立即部署或自动部署未触发

```bash
# 在项目根目录
vercel --prod
```

这会立即触发生产环境部署。

## 更新流程总结

### 标准流程（自动部署）

```
修改代码
  ↓
git add .
  ↓
git commit -m "更新说明"
  ↓
git push
  ↓
Vercel 自动检测并部署（约 1-3 分钟）
  ↓
新版本上线
```

### 需要手动部署的情况

1. **自动部署失败**
   - 检查 Vercel Dashboard 的错误日志
   - 修复后手动部署：`vercel --prod`

2. **需要立即上线**
   - 不想等待自动部署
   - 手动执行：`vercel --prod`

3. **环境变量更新**
   - 修改环境变量后需要重新部署
   - 在 Vercel Dashboard 更新环境变量
   - 或手动部署：`vercel --prod`

## 检查部署状态

### 方法 1：Vercel Dashboard
1. 访问：https://vercel.com/dashboard
2. 进入项目
3. 查看 Deployments 标签

### 方法 2：命令行
```bash
vercel ls
```

### 方法 3：检查网站
访问：https://optipick-system.vercel.app
查看是否有更新

## 注意事项

### 1. public 目录同步
如果修改了 `web-ui/index.html`，需要同步到 `public/`：
```bash
cp web-ui/index.html public/index.html
git add public/index.html
git commit -m "同步 public 目录"
git push
```

### 2. 环境变量
修改环境变量后需要重新部署：
- 在 Vercel Dashboard 更新
- 或手动部署：`vercel --prod`

### 3. API 文件修改
修改 `api/` 目录下的文件后：
- 推送代码，Vercel 会自动重新部署
- 或手动部署：`vercel --prod`

## 快速检查清单

更新代码后：
- [ ] 代码已提交：`git add . && git commit -m "..." && git push`
- [ ] 等待 1-3 分钟（自动部署）
- [ ] 检查 Vercel Dashboard 确认部署成功
- [ ] 访问网站验证更新

## 常见问题

### Q: 推送后没有自动部署？
**A:** 检查：
1. Vercel 项目是否关联了正确的 GitHub 仓库
2. Vercel Dashboard → Settings → Git → 确认仓库连接
3. 查看 Deployments 标签是否有错误

### Q: 部署需要多长时间？
**A:** 
- 自动部署：通常 1-3 分钟
- 手动部署：通常 1-2 分钟

### Q: 如何回滚到之前的版本？
**A:** 
1. Vercel Dashboard → Deployments
2. 找到之前的部署
3. 点击 "..." → "Promote to Production"

### Q: 本地测试 vs 部署
**A:**
- **本地测试**：`node cli/index.js web` → http://localhost:3000
- **部署**：推送到 GitHub → Vercel 自动部署 → https://optipick-system.vercel.app
