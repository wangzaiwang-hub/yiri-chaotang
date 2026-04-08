#!/usr/bin/env node

/**
 * 检查朝堂数据完整性
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkCourtData() {
  console.log('\n========== 检查朝堂数据 ==========\n');

  try {
    const { data: courts } = await supabase
      .from('courts')
      .select('*');

    console.log(`找到 ${courts.length} 个朝堂:\n`);

    for (const court of courts) {
      console.log(`朝堂: ${court.name}`);
      console.log(`  ID: ${court.id}`);
      console.log(`  Emperor ID: ${court.emperor_id || '❌ 缺失'}`);
      
      // 查询成员
      const { data: members } = await supabase
        .from('court_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('court_id', court.id);

      console.log(`  成员数量: ${members?.length || 0}`);
      
      if (members && members.length > 0) {
        members.forEach(member => {
          console.log(`    - ${member.user.nickname || member.user.username} (${member.department || '无部门'})`);
        });
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('错误:', error);
  }
}

checkCourtData();
