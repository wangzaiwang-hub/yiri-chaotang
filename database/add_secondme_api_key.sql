-- 添加 SecondMe API Key 字段到 users 表
-- 用于存储每个用户的虚拟人 API Key，以便皇帝可以向大臣的虚拟人发送任务

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS secondme_api_key TEXT;

-- 添加注释
COMMENT ON COLUMN users.secondme_api_key IS '用户的 SecondMe 虚拟人 API Key (sk- 开头)';

SELECT 'SecondMe API Key field added successfully!' AS status;
