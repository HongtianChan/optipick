# 使用者手冊（User Manual）

## 封面資訊

- 組號：`<fill>`
- 科目：`CS360/SE360 D1 Artificial Intelligence`
- 專題：`An Optimal Samples Selection System`
- 組員 1：`陳鴻天 / 1230002551`
- 組員 2：`陳樂怡 / <student id>`
- 組員 3：`馮宏臻 / <student id>`
- 組員 4：`余昇斌 / <student id>`
- 日期：`2026.4.28`

---

## 1. 系統概述

本系統用於求解最優樣本選擇問題。  
給定參數 `m, n, k, j, s`，系統會在滿足覆蓋條件下，找出最少（或近似最少）數量的 `k` 組合。

主要功能：

- 參數輸入（`m, n, k, j, s, at least`）
- 兩種樣本模式（`Random n`、`Input n manually`）
- 計算結果組合
- 儲存／顯示／刪除歷史紀錄
- 匯出 DB 紀錄為 JSON

---

## 2. 環境需求

### 方案 A：使用已部署的網頁版

- 現代瀏覽器（Chrome / Safari / Edge）
- 網路連線

### 方案 B：本機執行

- Node.js 18+
- npm

---

## 3. 安裝與啟動

### 3.1 本機安裝

```bash
cd /path/to/optimal-samples-selector
npm install
cd cli && npm install && cd ..
```

### 3.2 使用者執行模式

一般使用者與展示情境下，**不需要自行設定資料庫**。

- 已部署網頁版：直接開啟專案網址使用。
- 本機離線模式：在本機執行，歷史紀錄只存於你的電腦。
- 本機離線模式完整說明：`docs/local-mode.md`

### 3.3 啟動方式

- 已部署版本：開啟專案網址
- 本機網頁模式：`npm run local:web`，再開啟 `http://localhost:3000`
- 本機 CLI 解算：`npm run local:solve -- solve --m 45 --n 8 --k 6 --j 6 --s 5 --atLeast 1`

---

## 4. 系統操作步驟

### 步驟 1：輸入參數

請輸入：

- `m`（45-54）
- `n`（7-25）
- `k`（4-7）
- `j`（需滿足 `s <= j <= k`）
- `s`（3-7）
- `at least`（預設 1）

### 步驟 2：選擇樣本模式

- `Random n`：系統自 `1..m` 隨機選出 `n` 個數值
- `Input n manually`：使用者手動輸入恰好 `n` 個數值

### 步驟 3：執行計算

按下 `Calculate`。  
系統會顯示：

- 已選出的 `n` 個樣本
- 演算法方法（精確法或近似法）
- 最小／近似最小組數
- 所有選出的 `k` 組合

### 步驟 4：儲存到資料庫

按下 `Save to history`。  
檔名格式：

`m-n-k-j-s-x-y`

- `x`：執行次序（run index）
- `y`：輸出組數

### 步驟 5：在 History 顯示或刪除

1. 開啟 `History` 分頁
2. 選擇一筆檔案
3. 按 `Display` 查看內容
4. 按 `Delete` 刪除紀錄

### 步驟 6：匯出 DB JSON（用於 USB 提交）

在 `History` 點擊 `Export DB`。  
下載檔名格式：

`db-export-YYYY-MM-DDTHH-MM-SS-sssZ.json`

請將檔案放入：

`submission/db/`

---

## 5. 輸入驗證規則

系統會檢查：

- 僅允許正整數
- 範圍約束：
  - `45 <= m <= 54`
  - `7 <= n <= 25`
  - `4 <= k <= 7`
  - `3 <= s <= 7`
- 關係約束：
  - `n <= m`
  - `k <= n`
  - `s <= j <= k`
  - `j <= n`
- 手動樣本輸入：
  - 必須剛好 `n` 個數字
  - 每個數值須在 `[1, m]`
  - 不可重複

---

## 6. 範例執行（Example 5）

輸入：

- `m=45, n=8, k=6, j=6, s=5, at least=1`

預期：

- 結果組數接近已知基準（經典設定最小值約為 4 組）

請補上截圖：

- 截圖 A：參數輸入畫面
- 截圖 B：結果輸出畫面
- 截圖 C：History 儲存項目

---

## 7. 常見問題排查

- **Error: invalid parameters**
  - 檢查整數、範圍與參數關係限制
- **Cloud save unavailable (deployment only)**
  - 這不影響本機離線模式使用
  - 若為部署環境問題，請由團隊維運人員檢查部署環境變數
- **No history displayed**
  - 檢查資料表是否存在、寫入權限是否正確

---

## 8. 最終提交檔案位置

- 原始碼：`submission/source-code/`
- DB 檔案／匯出：`submission/db/`
- 範例執行：`submission/sample-runs/`
- 本手冊（PDF）：`submission/reports/User-Manual.pdf`
- 專題報告（PDF）：`submission/reports/Project-Report.pdf`

