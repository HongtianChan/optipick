# Optimal Samples Selector

最优样本选择系统 - 集合覆盖问题求解器

## 功能

- 计算最优样本组（集合覆盖问题）
- 支持随机/手动输入样本
- 结果保存到 DB 文件
- CLI 命令行工具
- Web UI 图形界面

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

DB 文件保存在：`~/.optimal-samples-selector/db/`

文件名格式：`m-n-k-j-s-x-y`
- x: 运行次数
- y: 结果数量

