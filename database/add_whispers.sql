-- 创建悄悄话表
CREATE TABLE IF NOT EXISTS whispers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by_emperor BOOLEAN DEFAULT FALSE,
  read_by_recipient BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_whispers_court_id ON whispers(court_id);
CREATE INDEX IF NOT EXISTS idx_whispers_from_user ON whispers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_whispers_to_user ON whispers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_whispers_created_at ON whispers(created_at DESC);

-- 启用 RLS
ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;

-- 创建策略：朝堂成员可以查看本朝堂的悄悄话
CREATE POLICY "Court members can view whispers"
  ON whispers FOR SELECT
  USING (
    court_id IN (
      SELECT court_id FROM court_members WHERE user_id = auth.uid()
    )
  );

-- 创建策略：大臣可以发送悄悄话
CREATE POLICY "Ministers can send whispers"
  ON whispers FOR INSERT
  WITH CHECK (
    from_user_id = auth.uid() AND
    court_id IN (
      SELECT court_id FROM court_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE whispers IS '大臣之间的悄悄话（皇帝也能看到）';
COMMENT ON COLUMN whispers.read_by_emperor IS '皇帝是否已读';
COMMENT ON COLUMN whispers.read_by_recipient IS '接收者是否已读';
