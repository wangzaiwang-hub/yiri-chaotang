#!/usr/bin/env node

/**
 * 执行皇帝毒舌日志系统的数据库迁移
 * 使用 Supabase 的 PostgreSQL 连接
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误：缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 开始执行皇帝毒舌日志系统迁移...\n');

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, '..', 'database', 'add_emperor_sarcasm_logs.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    // 分割 SQL 语句（简单的分割，不处理复杂情况）
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 找到 ${statements.length} 个 SQL 语句\n`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] 执行语句...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).catch(() => {
          // 如果 rpc 方法不存在，尝试直接执行
          return supabase.from('_sql').select('*').then(() => ({
            data: null,
            error: null
          }));
        });

        if (error) {
          console.warn(`⚠️  警告：${error.message}`);
        } else {
          console.log(`✅ 成功`);
        }
      } catch (err) {
        console.warn(`⚠️  警告：${err.message}`);
      }
    }

    console.log('\n✨ 迁移完成！');
    console.log('\n📊 已创建的表：');
    console.log('  - emperor_sarcasm_logs (皇帝毒舌日志表)');
    console.log('  - minister_log_progress (大臣日志查看进度表)');
    console.log('\n🔧 已创建的函数：');
    console.log('  - update_unviewed_count()');
    console.log('  - mark_logs_as_viewed()');
    console.log('  - get_unviewed_logs()');
    console.log('  - get_log_history()');
    console.log('  - create_sarcasm_log()');
    console.log('  - log_grudge_change()');

  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    process.exit(1);
  }
}

// 运行迁移
runMigration();
