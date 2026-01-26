# 故障排查

## "Failed to fetch" 错误

### 可能原因

1. **本地打开 HTML 文件**
   - 如果直接用浏览器打开 `index.html`（file:// 协议），会有 CORS 限制
   - **解决**：需要通过服务器访问

2. **服务器未启动**（本地测试）
   - **解决**：运行 `node cli/index.js web` 启动本地服务器

3. **浏览器缓存问题**
   - **解决**：清除缓存或硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）

4. **网络问题**
   - **解决**：检查网络连接

### 解决方案

#### 方案 1：使用在线版本（推荐）
访问：https://optipick-system.vercel.app

#### 方案 2：本地运行服务器
```bash
cd /Users/chenhongtian/Desktop/optimal-samples-selector/cli
node index.js web
```
然后访问：http://localhost:3000

#### 方案 3：检查浏览器控制台
1. 按 F12 打开开发者工具
2. 查看 Console 标签的错误信息
3. 查看 Network 标签，检查 API 请求状态

### 验证 API 是否正常

测试 API 端点：
```bash
curl -X POST https://optipick-system.vercel.app/api/solve \
  -H "Content-Type: application/json" \
  -d '{"m":45,"n":8,"k":6,"j":6,"s":5,"atLeast":1}'
```

如果返回 JSON 结果，说明 API 正常。
