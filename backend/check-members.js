const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkMembers() {
  console.log('=== 检查朝堂成员 ===\n');
  
  const { data: members, error } = await supabase
    .from('court_members')
    .select(`
      *,
      user:users(id, nickname),
      court:courts(id, name)
    `);
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log(`找到 ${members.length} 个成员:\n`);
  
  for (const member of members) {
    console.log(`朝堂: ${member.court.name} (${member.court_id})`);
    console.log(`用户: ${member.user.nickname} (${member.user_id})`);
    console.log(`角色: ${member.role === 'emperor' ? '👑 皇帝' : '🧑‍💼 大臣'}`);
    console.log(`部门: ${member.department || '无'}`);
    console.log('');
  }
}

checkMembers().then(() => process.exit(0));
