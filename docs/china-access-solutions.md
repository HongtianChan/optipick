# 中国大陆访问解决方案

Vercel 在中国大陆可能无法直接访问。以下是几种解决方案：

## 方案 1: 自定义域名 + Cloudflare（推荐）

如果有域名，这是最稳定的方案。

### 步骤

1. **购买域名**
   - 国内：阿里云、腾讯云、华为云
   - 国外：Namecheap、GoDaddy

2. **在 Vercel 绑定域名**
   - Vercel Dashboard → Project → Settings → Domains
   - 添加你的域名（如 `optipick.yourdomain.com`）
   - 按提示配置 DNS

3. **配置 Cloudflare 代理**
   - 注册 Cloudflare 账号（免费）
   - 添加域名到 Cloudflare
   - 修改 DNS 记录指向 Vercel
   - 开启 Cloudflare 代理（橙色云朵）
   - Cloudflare 会自动加速并解决访问问题

**优点**：
- 免费（Cloudflare 免费套餐）
- 稳定可靠
- 自动加速
- 支持 HTTPS

**缺点**：
- 需要域名（通常几十元/年）

## 方案 2: 国内平台部署

### 2.1 腾讯云 Serverless

```bash
# 安装 Serverless Framework
npm install -g serverless

# 部署
serverless deploy
```

**优点**：
- 国内访问快
- 免费额度充足

**缺点**：
- 需要重新配置
- 可能需要备案（如果使用国内域名）

### 2.2 阿里云函数计算

类似腾讯云，需要重新配置部署。

### 2.3 华为云

同样需要重新配置。

## 方案 3: GitHub Pages（功能受限）

GitHub Pages 不支持 serverless functions，需要改造：

1. 前端改为纯静态
2. API 调用改为直接调用 Supabase
3. 或使用 GitHub Actions 做后端

**优点**：
- 免费
- 国内可访问

**缺点**：
- 需要大幅改造代码
- 失去 serverless 优势

## 方案 4: Netlify（可能同样问题）

Netlify 和 Vercel 类似，可能也有访问问题。

## 方案 5: Cloudflare Pages（推荐备选）

如果 Cloudflare 可访问：

1. 连接 GitHub 仓库
2. 自动部署
3. 使用 Cloudflare Workers 做 API

**优点**：
- 免费
- 全球 CDN
- 可能比 Vercel 访问更稳定

**缺点**：
- 需要重新配置
- Workers 有免费额度限制

## 方案 6: 使用代理/VPN

临时方案：
- 使用 VPN 访问
- 或使用代理工具

**不推荐**：对普通用户不友好。

## 推荐方案

### 短期（立即可用）
- 使用 VPN/代理访问现有网站

### 长期（最佳方案）
1. **购买域名**（如 `.com` 约 50-100 元/年）
2. **绑定到 Vercel**
3. **配置 Cloudflare 代理**（免费）
4. 完成，国内可正常访问

### 如果不想买域名
- 尝试 Cloudflare Pages
- 或使用国内平台（需要重新配置）

## 实施步骤（方案 1）

### 1. 购买域名
- 阿里云：https://wanwang.aliyun.com
- 腾讯云：https://dnspod.cloud.tencent.com

### 2. 在 Vercel 添加域名
```bash
# 或通过 Dashboard
vercel domains add yourdomain.com
```

### 3. 配置 Cloudflare
1. 注册：https://www.cloudflare.com
2. 添加站点
3. 修改 DNS 记录：
   - 类型：CNAME
   - 名称：@ 或 www
   - 目标：cname.vercel-dns.com
   - 代理：开启（橙色云朵）

### 4. 等待生效
- DNS 传播：几分钟到几小时
- 完成后即可访问

## 参考链接

- Vercel 域名配置：https://vercel.com/docs/concepts/projects/domains
- Cloudflare 免费套餐：https://www.cloudflare.com/plans/free/
- 腾讯云 Serverless：https://cloud.tencent.com/product/scf
- 阿里云函数计算：https://www.aliyun.com/product/fc
