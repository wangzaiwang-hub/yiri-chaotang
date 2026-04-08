/**
 * 重置用户性别为 unknown，用于测试性别选择功能
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetUserGender() {
  console.log('🔄 重置所有用户性别为 unknown\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ gender: 'unknown' })
      .neq('id', '00000000-0000-0000-0000-000000000000') // 更新所有用户
      .select();
    
    if (error) throw error;
    
    console.log(`✅ 已重置 ${data.length} 个用户的性别\n`);
    
    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nickname || '未命名'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   性别: ${user.gender}`);
      console.log('');
    });
    
    console.log('💡 提示：现在刷新前端页面，应该会跳转到性别选择页面');
    
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
  }
}

resetUserGender();
