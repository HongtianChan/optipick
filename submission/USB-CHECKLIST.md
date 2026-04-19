# USB 最终封包清单（Week 15）

> 目标：把老师要求的东西一次装齐，现场可演示，交付可打印。

## 1) USB 目录结构（必须有）

- [ ] `source-code/`：完整源码（可离线运行）
- [ ] `db/`：数据库文件与导出结果
- [ ] `sample-runs/`：样例运行截图/输出
- [ ] `reports/`：两份报告 PDF
- [ ] `presentation/`：演示 PPT 与讲稿

## 2) source-code（必须有）

- [ ] 拷贝当前可运行版本全部源码
- [ ] 包含 `web-ui/`、`api/`、`cli/`、`database/`、`docs/`、`scripts/`
- [ ] 包含 `package.json` 与 `package-lock.json`
- [ ] 清除无关大文件和临时文件（避免 USB 爆容量）

## 3) db（必须有）

- [ ] `database/supabase-setup.sql`
- [ ] 至少 1 份最新线上导出：`db-export-*.json`
- [ ] 至少 1 份本地导出（如有）：`localdb/db-export-*.json`
- [ ] 确认 JSON 可打开、字段完整（参数/方法/组数/时间）

## 4) sample-runs（必须有）

- [ ] 至少 3 组样例（小/中/大规模）
- [ ] 每组都有：参数、方法、组数、耗时、截图
- [ ] 包含 correctness/evidence 文件（`evidence-*.md`）
- [ ] 样例数据与报告表格一致

## 5) reports（必须有，且会打印）

- [ ] `User-Manual.pdf`
- [ ] `Project-Report.pdf`
- [ ] 两份首页都包含：Group number、成员姓名、学号
- [ ] 文中没有 `<fill>` 占位符
- [ ] 文中没有个人绝对路径（`/Users/...`）

## 6) presentation（必须有）

- [ ] `slides.pptx`（15 分钟版）
- [ ] 演示流程页（brief intro / methods / achievements / live demo）
- [ ] Demo 参数固定（短时间可稳定跑出结果）
- [ ] 备用截图准备好（防网络波动）

## 7) 现场演示可用性（加分关键）

- [ ] 手机端可打开并操作
- [ ] 支持多参数输入（`m,n,k,j,s`）
- [ ] 可在短时间得到 optimal / nearly optimal
- [ ] 本地模式可跑（不依赖团队后端）

## 8) 提交前 10 分钟终检

- [ ] 在另一台电脑插入 USB，可正常读取全部文件
- [ ] 随机打开 1 个 PDF、1 个 JSON、1 个样例截图，确认不损坏
- [ ] 纸质版两份报告已打印并装订
- [ ] USB + 纸质版 + 讲解人分工确认完毕

---

## 推荐最小文件清单（直接对照）

- `source-code/`（完整项目）
- `db/supabase-setup.sql`
- `db/db-export-*.json`（至少 1 份）
- `sample-runs/`（截图 + evidence）
- `reports/User-Manual.pdf`
- `reports/Project-Report.pdf`
- `presentation/slides.pptx`
