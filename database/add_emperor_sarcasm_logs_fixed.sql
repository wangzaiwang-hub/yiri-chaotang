-- 皇帝毒舌日志系统 - 简化版（修复版）

-- 1. 皇帝毒舌日志表
CREATE TABLE IF NOT EXISTS emperor_sarcasm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_type VARCHAR(50) NOT NULL,
  log_message TEXT NOT NULL,
  related_data JSONB DEFAULT '{}',
  viewed_by_minister BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 大臣的日志查看进度表
CREATE TABLE IF NOT EXISTS minister_log_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_viewed_log_id UUID REFERENCES emperor_sarcasm_logs(id) ON DELETE SET NULL,
  last_viewed_at TIMESTAMPTZ,
  unviewed_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, user_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_emperor_logs_court_user ON emperor_sarcasm_logs(court_id, user_id);
CREATE INDEX IF NOT EXISTS idx_emperor_logs_created_at ON emperor_sarcasm_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_emperor_logs_viewed ON emperor_sarcasm_logs(viewed_by_minister);
CREATE INDEX IF NOT EXISTS idx_minister_progress_court_user ON minister_log_progress(court_id, user_id);

-- 4. 创建视图：获取未查看的日志
CREATE OR REPLACE VIEW unviewed_logs_view AS
SELECT 
  esl.id,
  esl.court_id,
  esl.user_id,
  esl.log_type,
  esl.log_message,
  esl.related_data,
  esl.created_at,
  mlp.last_viewed_log_id
FROM emperor_sarcasm_logs esl
LEFT JOIN minister_log_progress mlp ON esl.court_id = mlp.court_id AND esl.user_id = mlp.user_id
WHERE esl.viewed_by_minister = FALSE
  OR (mlp.last_viewed_log_id IS NOT NULL AND esl.id > mlp.last_viewed_log_id)
ORDER BY esl.created_at ASC;

-- 5. 创建函数：更新未查看日志计数
CREATE OR REPLACE FUNCTION update_unviewed_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE minister_log_progress
  SET unviewed_count = (
    SELECT COUNT(*)
    FROM emperor_sarcasm_logs
    WHERE court_id = NEW.court_id
      AND user_id = NEW.user_id
      AND viewed_by_minister = FALSE
  ),
  updated_at = NOW()
  WHERE court_id = NEW.court_id AND user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    INSERT INTO minister_log_progress (court_id, user_id, unviewed_count)
    VALUES (NEW.court_id, NEW.user_id, 1)
    ON CONFLICT (court_id, user_id) DO UPDATE
    SET unviewed_count = minister_log_progress.unviewed_count + 1,
        updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器：当新增日志时更新计数
DROP TRIGGER IF EXISTS trigger_update_unviewed_count ON emperor_sarcasm_logs;
CREATE TRIGGER trigger_update_unviewed_count
AFTER INSERT ON emperor_sarcasm_logs
FOR EACH ROW
EXECUTE FUNCTION update_unviewed_count();

-- 7. 创建函数：标记日志为已查看
CREATE OR REPLACE FUNCTION mark_logs_as_viewed(
  p_court_id UUID,
  p_user_id UUID,
  p_log_ids UUID[]
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE emperor_sarcasm_logs
  SET viewed_by_minister = TRUE,
      viewed_at = NOW()
  WHERE court_id = p_court_id
    AND user_id = p_user_id
    AND id = ANY(p_log_ids);
  
  UPDATE minister_log_progress
  SET last_viewed_log_id = (
    SELECT MAX(id)
    FROM emperor_sarcasm_logs
    WHERE court_id = p_court_id
      AND user_id = p_user_id
      AND viewed_by_minister = TRUE
  ),
  last_viewed_at = NOW(),
  unviewed_count = (
    SELECT COUNT(*)
    FROM emperor_sarcasm_logs
    WHERE court_id = p_court_id
      AND user_id = p_user_id
      AND viewed_by_minister = FALSE
  ),
  updated_at = NOW()
  WHERE court_id = p_court_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Logs marked as viewed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：获取未查看的日志
CREATE OR REPLACE FUNCTION get_unviewed_logs(
  p_court_id UUID,
  p_user_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  log_type VARCHAR,
  log_message TEXT,
  related_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esl.id,
    esl.log_type,
    esl.log_message,
    esl.related_data,
    esl.created_at
  FROM emperor_sarcasm_logs esl
  WHERE esl.court_id = p_court_id
    AND esl.user_id = p_user_id
    AND esl.viewed_by_minister = FALSE
  ORDER BY esl.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数：获取日志历史
CREATE OR REPLACE FUNCTION get_log_history(
  p_court_id UUID,
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  log_type VARCHAR,
  log_message TEXT,
  related_data JSONB,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esl.id,
    esl.log_type,
    esl.log_message,
    esl.related_data,
    esl.viewed_at,
    esl.created_at
  FROM emperor_sarcasm_logs esl
  WHERE esl.court_id = p_court_id
    AND esl.user_id = p_user_id
  ORDER BY esl.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建函数：创建日志
CREATE OR REPLACE FUNCTION create_sarcasm_log(
  p_court_id UUID,
  p_user_id UUID,
  p_log_type VARCHAR,
  p_log_message TEXT,
  p_related_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO emperor_sarcasm_logs (court_id, user_id, log_type, log_message, related_data)
  VALUES (p_court_id, p_user_id, p_log_type, p_log_message, p_related_data)
  RETURNING emperor_sarcasm_logs.id INTO v_log_id;
  
  RETURN QUERY SELECT v_log_id, TRUE, 'Log created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;
