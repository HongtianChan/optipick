-- Supabase schema for Optimal Samples Selector
-- Run this script in Supabase SQL Editor

-- results table
CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT UNIQUE NOT NULL,
  m INTEGER NOT NULL CHECK (m BETWEEN 45 AND 54),
  n INTEGER NOT NULL CHECK (n BETWEEN 7 AND 25),
  k INTEGER NOT NULL CHECK (k BETWEEN 4 AND 7),
  j INTEGER NOT NULL CHECK (j BETWEEN 3 AND 7),
  s INTEGER NOT NULL CHECK (s BETWEEN 3 AND 7),
  samples JSONB NOT NULL,
  groups JSONB NOT NULL,
  count INTEGER NOT NULL,
  run_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (n <= m),
  CHECK (k <= n),
  CHECK (j <= k),
  CHECK (s <= j)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_results_params ON results(m, n, k, j, s);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_file_name ON results(file_name);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policy if present
DROP POLICY IF EXISTS "Allow all operations" ON results;
DROP POLICY IF EXISTS "Public read access" ON results;
DROP POLICY IF EXISTS "Authenticated users can insert" ON results;
DROP POLICY IF EXISTS "Authenticated users can update" ON results;
DROP POLICY IF EXISTS "Authenticated users can delete" ON results;

-- Public read/write (web app currently uses anon key via serverless API)
CREATE POLICY "Public read access" ON results
  FOR SELECT
  USING (true);

CREATE POLICY "Public insert access" ON results
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access" ON results
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access" ON results
  FOR DELETE
  USING (true);
