-- 添加性别字段到用户表
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unknown')) DEFAULT 'unknown';

-- 更新现有用户的性别为 unknown
UPDATE users SET gender = 'unknown' WHERE gender IS NULL;

SELECT 'Gender column added successfully!' AS status;
