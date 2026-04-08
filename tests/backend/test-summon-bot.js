/**
 * 测试召唤分身功能
 * 
 * 使用方法：
 * node backend/test-summon-bot.js
 */

const axios = require('axios');

const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

async function testSummonBot() {
  try {
    console.log('=== 测试召唤分身功能 ===\n');
    
    // 替换为你的实际朝堂 ID
    const courtId = 'YOUR_COURT_ID';
    const currentUserId = 'YOUR_USER_ID';
    
    console.log('1. 获取可用的人机列表...');
    const botsResponse = await axios.get(
      `${API_BASE_URL}/courts/${courtId}/available-bots?current_user_id=${currentUserId}`
    );
    
    console.log('✅ 可用人机列表:');
    console.log(JSON.stringify(botsResponse.data, null, 2));
    
    if (botsResponse.data.data && botsResponse.data.data.length > 0) {
      const firstBot = botsResponse.data.data[0];
      console.log(`\n2. 召唤第一个分身: ${firstBot.nickname} (${firstBot.id})...`);
      
      const summonResponse = await axios.post(
        `${API_BASE_URL}/courts/${courtId}/summon-bot`,
        { user_id: firstBot.id }
      );
      
      console.log('✅ 召唤成功:');
      console.log(JSON.stringify(summonResponse.data, null, 2));
    } else {
      console.log('\n⚠️ 没有可用的人机');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testSummonBot();
