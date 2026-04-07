-- 疆土拓展系统数据库迁移
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 在 court_members 表中添加疆土拓展相关字段
ALTER TABLE court_members
ADD COLUMN IF NOT EXISTS happiness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unlocked_scenes TEXT[] DEFAULT ARRAY['default'],
ADD COLUMN IF NOT EXISTS current_scene TEXT DEFAULT 'default';

-- 2. 添加注释
COMMENT ON COLUMN court_members.happiness IS '百姓幸福度，用于解锁新场景';
COMMENT ON COLUMN court_members.unlocked_scenes IS '已解锁的场景列表';
COMMENT ON COLUMN court_members.current_scene IS '当前选择的场景背景';

-- 3. 创建场景配置表（可选，用于管理场景信息）
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  unlock_happiness INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 插入默认场景数据
INSERT INTO scenes (id, name, description, unlock_happiness, display_order) VALUES
  ('default', '初始', '朝堂初景，万象更新', 0, 0),
  ('huaxia', '华夏', '中原大地，繁华盛世', 100, 1),
  ('dongying', '东瀛', '东海之滨，樱花之国', 200, 2),
  ('gaoli', '高丽', '半岛之邦，礼仪之国', 350, 3),
  ('annan', '安南', '南国风情，稻香之地', 550, 4),
  ('xianluo', '暹罗', '热带王国，佛教圣地', 800, 5),
  ('dashi', '大食', '沙漠明珠，商贸之都', 1100, 6)
ON CONFLICT (id) DO NOTHING;

-- 5. 创建幸福值变更记录表
CREATE TABLE IF NOT EXISTS happiness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  happiness_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_happiness_records_court_id ON happiness_records(court_id);
CREATE INDEX IF NOT EXISTS idx_happiness_records_user_id ON happiness_records(user_id);

COMMENT ON TABLE happiness_records IS '幸福值变更记录表';
COMMENT ON COLUMN happiness_records.event_type IS '事件类型：task_created, task_approved, task_rejected 等';
COMMENT ON COLUMN happiness_records.happiness_amount IS '幸福值变化量（正数为增加，负数为减少）';

-- 迁移完成
SELECT 'Territory expansion migration completed successfully!' AS status;
