-- 添加审批系统相关字段
-- 为 virtual_tasks 表添加审批状态和对话历史

ALTER TABLE virtual_tasks
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;

-- 审批状态说明：
-- pending: 待审批（大臣刚回复完）
-- approved: 已准奏（皇帝同意）
-- rejected: 已驳回（皇帝驳回，需要重新设计）
-- closed: 已结束（皇帝选择结束对话）

-- conversation_history 格式：
-- [
--   { "role": "emperor", "content": "任务描述", "timestamp": "2024-01-01T00:00:00Z" },
--   { "role": "minister", "content": "大臣回复", "timestamp": "2024-01-01T00:01:00Z" },
--   { "role": "emperor", "content": "驳回理由", "timestamp": "2024-01-01T00:02:00Z" },
--   { "role": "minister", "content": "重新设计", "timestamp": "2024-01-01T00:03:00Z" }
-- ]

COMMENT ON COLUMN virtual_tasks.approval_status IS '审批状态：pending/approved/rejected/closed';
COMMENT ON COLUMN virtual_tasks.conversation_history IS '完整对话历史记录';
COMMENT ON COLUMN virtual_tasks.rejection_count IS '被驳回次数';
