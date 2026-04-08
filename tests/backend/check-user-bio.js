const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUserBio() {
  try {
    console.log('=== 检查数据库中的用户 bio 信息 ===\n');
    
    // 查询所有用户
    const { data: users, error } = await supabase
      .from('users')
      .select('id, nickname, avatar, bio, secondme_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`找到 ${users.length} 个用户：\n`);
    
    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  昵称:', user.nickname);
      console.log('  SecondMe ID:', user.secondme_id);
      console.log('  头像:', user.avatar ? '✅ 有' : '❌ 无');
      console.log('  Bio:', user.bio || '❌ 未设置');
      console.log('');
    });
    
    const usersWithBio = users.filter(u => u.bio);
    const usersWithoutBio = users.filter(u => !u.bio);
    
    console.log('=== 统计 ===');
    console.log(`有 bio 的用户: ${usersWithBio.length}`);
    console.log(`没有 bio 的用户: ${usersWithoutBio.length}`);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

checkUserBio();
