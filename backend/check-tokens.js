const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTokens() {
  console.log('=== 检查用户 Token ===\n');
  
  const { data: tokens, error } = await supabase
    .from('user_tokens')
    .select('user_id, access_token')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log(`找到 ${tokens.length} 个用户的 token:\n`);
  
  for (const token of tokens) {
    console.log(`用户 ID: ${token.user_id}`);
    console.log(`Token: ${token.access_token.substring(0, 30)}...`);
    console.log('');
  }
}

checkTokens().then(() => process.exit(0));
