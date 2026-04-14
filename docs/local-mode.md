# 本地离线模式

这个模式用于用户在自己电脑上运行系统，数据只写入本机，不经过团队后端数据库。

## 你会得到什么

- 本地网页：`http://localhost:3000`
- 本地历史记录：保存在你的电脑目录 `~/.optimal-samples-selector/db/`
- 本地导出：History 里的 `Export DB` 会导出你自己电脑的数据

## 一次性准备

```bash
cd optimal-samples-selector
npm install
cd cli
npm install
cd ..
```

## 启动本地网页版

```bash
npm run local:web
```

打开浏览器访问：`http://localhost:3000`

## 本地数据位置

- 目录：`~/.optimal-samples-selector/db/`
- 命名：`m-n-k-j-s-x-y`
- 含义：`x` 为运行次数，`y` 为结果组数

## 常用本地命令

```bash
# 跑一次并保存到本机 DB
npm run local:solve

# 查看本机已有记录
node cli/index.js list
```

## 说明

- 本地模式不会调用 Supabase，因此不会受 RLS、网络或云端额度影响。
- 每位成员看到的 History 只属于自己电脑，天然隔离，适合并行做实验和准备展示。
