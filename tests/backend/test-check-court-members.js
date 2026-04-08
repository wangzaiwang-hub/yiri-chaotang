#!/usr/bin/env node

/**
 * 检查朝堂成员
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourtMembers() {
  console.log('\n========== 检查朝堂成员 ==========\n');

  try {
    // 1. 获取所有朝堂
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('*');

    if (courtsError) {
      console.error('❌ 查询朝堂失败:', courtsError.message);
      return;
    }

    console.log(`✅ 找到 ${courts.length} 个朝堂\n`);

    for (const court of courts) {
      console.log(`📋 朝堂: ${court.name}`);
      console.log(`   ID: ${court.id}`);

      // 获取成员
      const { data: members, error: membersError } = await supabase
        .from('court_members')
        .select('*')
        .eq('court_id', court.id);

      if (membersError) {
        console.error('   ❌ 查询成员失败:', membersError.message);
        continue;
      }

      console.log(`   成员数: ${members.length}`);

      for (const member of members) {
        // 获取用户信息
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', member.user_id)
          .single();

        const userName = user ? (user.username || user.email || member.user_id) : member.user_id;
        console.log(`   - ${member.role === 'emperor' ? '👑' : '🧑'} ${userName} (${member.role})`);
        console.log(`     User ID: ${member.user_id}`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }

  console.log('========== 检查完成 ==========\n');
}

checkCourtMembers();
