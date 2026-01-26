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

-- 启用 Row Level Security (RLS)
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取和写入（可根据需要调整）
CREATE POLICY "Allow all operations" ON results
  FOR ALL
  USING (true)
  WITH CHECK (true);
