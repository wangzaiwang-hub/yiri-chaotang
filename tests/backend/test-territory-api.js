// 测试疆土拓展 API
const axios = require('axios');

const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

// 测试数据
const testCourtId = 'd54507d6-5ecb-49fe-9d29-eed938587dc1'; // 替换为你的朝堂 ID
const testUserId = 'your-user-id'; // 替换为你的用户 ID

async function testTerritoryAPI() {
  console.log('🧪 开始测试疆土拓展 API...\n');

  try {
    // 1. 测试获取疆土拓展数据
    console.log('1️⃣ 测试获取疆土拓展数据...');
    const getResponse = await axios.get(`${API_BASE_URL}/territory/${testCourtId}?user_id=${testUserId}`);
    console.log('✅ 获取成功:', JSON.stringify(getResponse.data, null, 2));
    console.log('');

    // 2. 测试更新幸福值
    console.log('2️⃣ 测试更新幸福值...');
    const updateResponse = await axios.post(`${API_BASE_URL}/territory/${testCourtId}/happiness`, {
      user_id: testUserId,
      amount: 15,
      eventType: 'test',
      eventDescription: '测试增加幸福值'
    });
    console.log('✅ 更新成功:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // 3. 再次获取验证
    console.log('3️⃣ 验证幸福值是否更新...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/territory/${testCourtId}?user_id=${testUserId}`);
    console.log('✅ 验证结果:', JSON.stringify(verifyResponse.data, null, 2));
    console.log('');

    console.log('🎉 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testTerritoryAPI();
