
-- Supabase Dashboard SQL Editor에서 아래 코드를 실행하세요.
-- 1. game_records 테이블 생성
CREATE TABLE IF NOT EXISTS game_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  time_seconds FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS(Row Level Security) 설정 (간단하게 모든 익명 접근 허용)
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON game_records FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert access"
ON game_records FOR INSERT
TO public
WITH CHECK (true);

-- 3. 인덱스 생성 (성능 최적화 - 시도 횟수가 적고 시간이 짧은 순서)
CREATE INDEX IF NOT EXISTS idx_game_records_performance ON game_records (attempts ASC, time_seconds ASC);
