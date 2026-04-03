/**
 * 检查 court_members 表中的数据
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkCourtMembers() {
  console.log('🔍 检查 court_members 表数据\n');
  
  try {
    const { data: members, error } = await supabase
      .from('court_members')
      .select('id, court_id, user_id, role, gender, users(nickname)')
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`找到 ${members.length} 条记录：\n`);
    
    // 按用户分组
    const userGroups = new Map();
    members.forEach(member => {
      const key = `${member.user_id}-${member.court_id}`;
      if (!userGroups.has(key)) {
        userGroups.set(key, []);
      }
      userGroups.get(key).push(member);
    });
    
    // 检查是否有重复
    let hasDuplicates = false;
    userGroups.forEach((records, key) => {
      if (records.length > 1) {
        hasDuplicates = true;
        console.log(`⚠️  发现重复记录：`);
        console.log(`   用户: ${records[0].users?.nickname}`);
        console.log(`   朝堂ID: ${records[0].court_id}`);
        console.log(`   重复次数: ${records.length}`);
        records.forEach((r, i) => {
          console.log(`   记录 ${i + 1}: ID=${r.id}, 角色=${r.role}, 性别=${r.gender}`);
        });
        console.log('');
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ 没有发现重复记录\n');
    }
    
    // 显示所有记录
    console.log('所有记录：\n');
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.users?.nickname || '未命名'}`);
      console.log(`   ID: ${member.id}`);
      console.log(`   朝堂ID: ${member.court_id}`);
      console.log(`   角色: ${member.role}`);
      console.log(`   性别: ${member.gender || 'unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkCourtMembers();
