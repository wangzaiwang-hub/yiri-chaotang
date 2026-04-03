-- 朝堂数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secondme_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')) DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_secondme_id ON users(secondme_id);

-- 2. 用户 Token 表
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);

-- 3. 朝堂表
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_emperor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_creator_id ON courts(creator_id);
CREATE INDEX idx_courts_current_emperor_id ON courts(current_emperor_id);

-- 4. 朝堂成员表
CREATE TABLE court_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('emperor', 'minister')),
  grudge_value INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, user_id)
);

CREATE INDEX idx_court_members_court_id ON court_members(court_id);
CREATE INDEX idx_court_members_user_id ON court_members(user_id);
CREATE INDEX idx_court_members_grudge_value ON court_members(grudge_value DESC);

-- 5. 虚拟任务表
CREATE TABLE virtual_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  emperor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('brain', 'creative', 'social', 'talent', 'entertainment')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'rejected', 'approved')),
  result TEXT,
  feedback TEXT,
  session_id TEXT,
  grudge_reward INTEGER DEFAULT 10,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_virtual_tasks_court_id ON virtual_tasks(court_id);
CREATE INDEX idx_virtual_tasks_emperor_id ON virtual_tasks(emperor_id);
CREATE INDEX idx_virtual_tasks_assignee_id ON virtual_tasks(assignee_id);
CREATE INDEX idx_virtual_tasks_status ON virtual_tasks(status);
CREATE INDEX idx_virtual_tasks_deadline ON virtual_tasks(deadline);

-- 6. 登基记录表
CREATE TABLE throne_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_quality DECIMAL(3, 2) DEFAULT 0,
  final_grudge_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, date)
);

CREATE INDEX idx_throne_records_court_id ON throne_records(court_id);
CREATE INDEX idx_throne_records_user_id ON throne_records(user_id);
CREATE INDEX idx_throne_records_date ON throne_records(date DESC);

-- 7. 复仇记录表
CREATE TABLE grudge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caused_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  grudge_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grudge_records_court_id ON grudge_records(court_id);
CREATE INDEX idx_grudge_records_user_id ON grudge_records(user_id);
CREATE INDEX idx_grudge_records_caused_by_id ON grudge_records(caused_by_id);

-- 8. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_tasks_updated_at BEFORE UPDATE ON virtual_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 启用 Row Level Security (可选，根据需求配置)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
-- 等等...

-- 初始化完成
SELECT 'Database initialized successfully!' AS status;
