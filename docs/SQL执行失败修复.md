# SQL 执行失败修复

## 问题

执行 SQL 时出现错误：
```
ERROR: 42601: syntax error at or near "NOT" LINE 80: CREATE TRIGGER IF NOT EXISTS trigger_update_unviewed_count
```

## 原因

PostgreSQL 不支持 `CREATE TRIGGER IF NOT EXISTS` 语法。

## 解决方案

### 方案 1：使用修复版本（推荐）

使用新的修复版本文件：`database/add_emperor_sarcasm_logs_fixed.sql`

**步骤：**
1. 打开 Supabase 控制台
2. 点击 "SQL Editor" → "New Query"
3. 复制 `database/add_emperor_sarcasm_logs_fixed.sql` 中的所有代码
4. 粘贴到编辑器
5. 点击 "Run"

### 方案 2：手动修复

如果已经执行了旧版本，需要先清理：

```sql
-- 删除旧的触发器和函数
DROP TRIGGER IF EXISTS trigger_update_unviewed_count ON emperor_sarcasm_logs;
DROP FUNCTION IF EXISTS update_unviewed_count();
DROP FUNCTION IF EXISTS mark_logs_as_viewed(UUID, UUID, UUID[]);
DROP FUNCTION IF EXISTS get_unviewed_logs(UUID, UUID, INT);
DROP FUNCTION IF EXISTS get_log_history(UUID, UUID, INT, INT);
DROP FUNCTION IF EXISTS create_sarcasm_log(UUID, UUID, VARCHAR, TEXT, JSONB);
DROP VIEW IF EXISTS unviewed_logs_view;
DROP INDEX IF EXISTS idx_emperor_logs_court_user;
DROP INDEX IF EXISTS idx_emperor_logs_created_at;
DROP INDEX IF EXISTS idx_emperor_logs_viewed;
DROP INDEX IF EXISTS idx_minister_progress_court_user;
DROP TABLE IF EXISTS minister_log_progress;
DROP TABLE IF EXISTS emperor_sarcasm_logs;
```

然后执行修复版本的 SQL。

## 修复内容

关键改变：

**旧版本（错误）：**
```sql
CREATE TRIGGER IF NOT EXISTS trigger_update_unviewed_count
AFTER INSERT ON emperor_sarcasm_logs
FOR EACH ROW
EXECUTE FUNCTION update_unviewed_count();
```

**新版本（正确）：**
```sql
DROP TRIGGER IF EXISTS trigger_update_unviewed_count ON emperor_sarcasm_logs;
CREATE TRIGGER trigger_update_unviewed_count
AFTER INSERT ON emperor_sarcasm_logs
FOR EACH ROW
EXECUTE FUNCTION update_unviewed_count();
```

## 验证修复

执行以下查询验证：

```sql
-- 检查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('emperor_sarcasm_logs', 'minister_log_progress');

-- 检查函数
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%sarcasm%' OR routine_name LIKE '%log%';

-- 检查触发器
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'trigger_update_unviewed_count';
```

## 文件更新

已更新的文件：
- `database/add_emperor_sarcasm_logs_fixed.sql` - 新的修复版本
- `database/add_emperor_sarcasm_logs_simple.sql` - 已修复

## 下一步

1. 使用修复版本重新执行 SQL
2. 验证所有表和函数创建成功
3. 重启后端
4. 测试 API

---

**修复时间：2026-04-07**
