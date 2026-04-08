const axios = require('axios');
require('dotenv').config();

async function testAvailableBots() {
  try {
    console.log('=== 测试 available-bots 接口 ===\n');
    
    // 使用一个测试朝堂 ID
    const courtId = 'f0e8e8e8-8e8e-8e8e-8e8e-8e8e8e8e8e8e'; // 替换为实际的朝堂 ID
    
    console.log('📡 正在调用 available-bots 接口...');
    console.log('Court ID:', courtId);
    console.log('URL: http://192.168.124.47:3001/api/courts/' + courtId + '/available-bots\n');
    
    const response = await axios.get(
      `http://192.168.124.47:3001/api/courts/${courtId}/available-bots`
    );
    
    console.log('✅ API 调用成功！\n');
    console.log('=== 响应数据 ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    const bots = response.data.data;
    console.log(`\n找到 ${bots.length} 个可用分身：\n`);
    
    bots.forEach((bot, index) => {
      console.log(`分身 ${index + 1}:`);
      console.log('  ID:', bot.id);
      console.log('  昵称:', bot.nickname);
      console.log('  头像:', bot.avatar ? '✅ 有' : '❌ 无');
      console.log('  Bio:', bot.bio ? '✅ 有 (' + bot.bio.substring(0, 50) + '...)' : '❌ 无');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 如果提供了命令行参数，使用它作为 courtId
const courtId = process.argv[2];
if (courtId) {
  testAvailableBots(courtId);
} else {
  console.log('用法: node test-available-bots.js <court_id>');
  console.log('示例: node test-available-bots.js f0e8e8e8-8e8e-8e8e-8e8e-8e8e8e8e8e8e');
}
