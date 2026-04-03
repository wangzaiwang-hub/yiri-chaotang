-- 将性别字段从 users 表移到 court_members 表
-- 这样用户可以在不同朝堂中选择不同的性别

-- 1. 为 court_members 表添加 gender 字段
ALTER TABLE court_members 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unknown')) DEFAULT 'unknown';

-- 2. 从 users 表复制现有的性别数据到 court_members
-- 如果用户在 users 表中有性别，将其复制到所有该用户的 court_members 记录
UPDATE court_members cm
SET gender = u.gender
FROM users u
WHERE cm.user_id = u.id 
  AND u.gender IS NOT NULL 
  AND u.gender != 'unknown'
  AND cm.gender = 'unknown';

-- 3. 创建索引（可选，如果需要按性别查询）
CREATE INDEX IF NOT EXISTS idx_court_members_gender ON court_members(gender);

-- 注意：我们保留 users 表中的 gender 字段作为默认值
-- 但实际使用时优先使用 court_members 表中的 gender
