-- 三省六部架构数据库迁移脚本
-- Migration for Three Provinces Six Ministries Architecture

-- 1. 为 court_members 表添加 department 字段
ALTER TABLE court_members 
ADD COLUMN IF NOT EXISTS department TEXT CHECK (department IN (
  'emperor',      -- 皇帝
  'zhongshu',     -- 中书省
  'menxia',       -- 门下省
  'shangshu',     -- 尚书省
  'hubu',         -- 户部
  'libu',         -- 礼部
  'bingbu',       -- 兵部
  'xingbu',       -- 刑部
  'gongbu',       -- 工部
  'libu_hr'       -- 吏部
));

-- 2. 为 virtual_tasks 表添加三省六部相关字段
ALTER TABLE virtual_tasks
ADD COLUMN IF NOT EXISTS department TEXT,           -- 负责部门
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES virtual_tasks(id) ON DELETE CASCADE,  -- 父任务ID
ADD COLUMN IF NOT EXISTS plan TEXT,                 -- 中书省的规划方案
ADD COLUMN IF NOT EXISTS review_comment TEXT,       -- 门下省的审核意见
ADD COLUMN IF NOT EXISTS sub_tasks JSONB;           -- 子任务列表

-- 3. 更新 status 字段的约束
ALTER TABLE virtual_tasks 
DROP CONSTRAINT IF EXISTS virtual_tasks_status_check;

ALTER TABLE virtual_tasks
ADD CONSTRAINT virtual_tasks_status_check CHECK (status IN (
  'pending',      -- 待中书省规划
  'planning',     -- 中书省规划中
  'reviewing',    -- 门下省审核中
  'rejected',     -- 门下省封驳
  'approved',     -- 门下省准奏
  'dispatching',  -- 尚书省派发中
  'executing',    -- 六部执行中
  'reporting',    -- 尚书省汇总中
  'completed',    -- 已完成
  'failed',       -- 失败
  'in_progress',  -- 兼容旧状态
  'done'          -- 兼容旧状态
));

-- 4. 为现有皇帝设置 department
UPDATE court_members 
SET department = 'emperor' 
WHERE role = 'emperor' AND department IS NULL;

-- 5. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_court_members_department ON court_members(department);
CREATE INDEX IF NOT EXISTS idx_virtual_tasks_department ON virtual_tasks(department);
CREATE INDEX IF NOT EXISTS idx_virtual_tasks_parent_task_id ON virtual_tasks(parent_task_id);

-- 迁移完成
SELECT 'Three Provinces Six Ministries migration completed successfully!' AS status;
