/**
 * 检查数据库中的用户
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUsers() {
  console.log('=== 检查数据库用户 ===\n');
  
  // 获取所有用户
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  console.log(`📊 总共有 ${users.length} 个用户\n`);
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nickname || '未命名'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   创建时间: ${user.created_at}`);
    console.log('');
  });
  
  // 检查当前朝堂的成员
  const courtId = 'd7473899-9582-4fbe-927b-cb396cb15815';
  console.log(`\n=== 检查朝堂 ${courtId} 的成员 ===\n`);
  
  const { data: members, error: membersError } = await supabase
    .from('court_members')
    .select('user_id, users(nickname)')
    .eq('court_id', courtId);
  
  if (membersError) {
    console.error('❌ 查询朝堂成员失败:', membersError);
    return;
  }
  
  console.log(`📊 朝堂中有 ${members.length} 个成员\n`);
  
  members.forEach((member, index) => {
    console.log(`${index + 1}. ${member.users?.nickname || '未命名'}`);
    console.log(`   User ID: ${member.user_id}`);
    console.log('');
  });
  
  // 计算可召唤的用户
  const memberIds = members.map(m => m.user_id);
  const availableUsers = users.filter(u => !memberIds.includes(u.id));
  
  console.log(`\n=== 可召唤的用户 ===\n`);
  console.log(`📊 可召唤 ${availableUsers.length} 个用户\n`);
  
  if (availableUsers.length > 0) {
    availableUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nickname || '未命名'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  } else {
    console.log('⚠️ 所有用户都已在朝堂中，无法召唤');
  }
}

checkUsers();
