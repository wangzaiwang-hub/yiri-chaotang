-- 修复 mark_logs_as_viewed 函数
-- 步骤 1: 删除旧函数
DROP FUNCTION IF EXISTS mark_logs_as_viewed(UUID, UUID, UUID[]);

-- 步骤 2: 创建新函数（返回 BOOLEAN 而不是 TABLE）
CREATE OR REPLACE FUNCTION mark_logs_as_viewed(
  p_court_id UUID,
  p_user_id UUID,
  p_log_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_unviewed_count INTEGER;
BEGIN
  -- 更新日志为已查看
  UPDATE emperor_sarcasm_logs
  SET viewed_by_minister = TRUE,
      viewed_at = NOW()
  WHERE court_id = p_court_id
    AND user_id = p_user_id
    AND id = ANY(p_log_ids);
  
  -- 计算未查看日志数量
  SELECT COUNT(*) INTO v_unviewed_count
  FROM emperor_sarcasm_logs
  WHERE court_id = p_court_id
    AND user_id = p_user_id
    AND viewed_by_minister = FALSE;
  
  -- 更新或插入进度记录
  INSERT INTO minister_log_progress (
    court_id, 
    user_id, 
    last_viewed_at, 
    unviewed_count, 
    updated_at
  )
  VALUES (
    p_court_id,
    p_user_id,
    NOW(),
    v_unviewed_count,
    NOW()
  )
  ON CONFLICT (court_id, user_id)
  DO UPDATE SET
    last_viewed_log_id = (
      SELECT id
      FROM emperor_sarcasm_logs
      WHERE court_id = p_court_id
        AND user_id = p_user_id
        AND viewed_by_minister = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    ),
    last_viewed_at = NOW(),
    unviewed_count = v_unviewed_count,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
