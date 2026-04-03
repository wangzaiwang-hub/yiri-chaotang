/**
 * 执行性别字段迁移
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrate() {
  console.log('🔄 开始迁移性别字段到 court_members 表\n');
  
  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../database/add_gender_to_court_members.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果 rpc 不可用，尝试直接执行
      console.log('尝试直接执行 SQL...\n');
      
      // 分割 SQL 语句
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          console.log('执行:', statement.substring(0, 50) + '...');
          const { error: execError } = await supabase.rpc('exec', { query: statement });
          if (execError) {
            console.error('❌ 执行失败:', execError.message);
          }
        }
      }
    }
    
    // 验证迁移结果
    console.log('\n✅ 迁移完成！验证结果：\n');
    
    const { data: members, error: selectError } = await supabase
      .from('court_members')
      .select('id, user_id, court_id, gender, users(nickname)')
      .limit(10);
    
    if (selectError) {
      console.error('❌ 查询失败:', selectError.message);
      console.log('\n⚠️  请手动在 Supabase 控制台执行以下 SQL：');
      console.log('\n' + sql);
      return;
    }
    
    console.log(`找到 ${members.length} 条 court_members 记录：\n`);
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.users?.nickname || '未命名'}`);
      console.log(`   性别: ${member.gender || 'unknown'}`);
      console.log('');
    });
    
    console.log('✅ 迁移成功！');
    console.log('\n📝 说明：');
    console.log('   - 性别字段已添加到 court_members 表');
    console.log('   - 用户可以在不同朝堂中选择不同的性别');
    console.log('   - 加入新朝堂时会提示选择性别');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.log('\n⚠️  请手动在 Supabase 控制台执行 database/add_gender_to_court_members.sql');
  }
}

migrate();
