-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 创建 results 表
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_results_params ON results(m, n, k, j, s);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_file_name ON results(file_name);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 删除旧的全开放策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations" ON results;

-- 允许所有人读取（公开只读）
CREATE POLICY "Public read access" ON results
  FOR SELECT
  USING (true);

-- 只允许已认证用户写入 / 更新 / 删除
CREATE POLICY "Authenticated users can insert" ON results
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON results
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON results
  FOR DELETE
  USING (auth.role() = 'authenticated');
