/**
 * 检查用户性别信息
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUserGender() {
  console.log('🔍 检查用户性别信息\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, nickname, gender')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`找到 ${users.length} 个用户：\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nickname || '未命名'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   性别: ${user.gender || '❌ 未设置'}`);
      console.log('');
    });
    
    const noGenderUsers = users.filter(u => !u.gender);
    if (noGenderUsers.length > 0) {
      console.log(`⚠️  有 ${noGenderUsers.length} 个用户未设置性别`);
      console.log('这些用户登录时会被要求选择性别\n');
    } else {
      console.log('✅ 所有用户都已设置性别\n');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkUserGender();
