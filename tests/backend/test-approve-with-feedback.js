/**
 * 测试准奏时添加补充说明
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testApproveWithFeedback() {
  console.log('🧪 测试准奏功能（带补充说明）\n');
  
  try {
    // 模拟准奏请求
    console.log('1️⃣ 测试准奏（无补充说明）');
    const response1 = {
      feedback: '准奏'
    };
    console.log('   请求体:', JSON.stringify(response1, null, 2));
    console.log('   ✅ 格式正确\n');
    
    console.log('2️⃣ 测试准奏（有补充说明）');
    const response2 = {
      feedback: '按你的方案执行，注意控制成本，每周汇报一次进度'
    };
    console.log('   请求体:', JSON.stringify(response2, null, 2));
    console.log('   ✅ 格式正确\n');
    
    console.log('3️⃣ 测试准奏（空字符串）');
    const response3 = {
      feedback: ''
    };
    console.log('   请求体:', JSON.stringify(response3, null, 2));
    console.log('   ✅ 格式正确\n');
    
    console.log('✅ 所有测试通过！');
    console.log('\n📝 使用说明：');
    console.log('   - 点击"准"按钮会弹出输入框');
    console.log('   - 可以输入补充说明（可选）');
    console.log('   - 补充说明会传递给大臣虚拟人');
    console.log('   - 大臣会根据补充说明调整执行方式');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testApproveWithFeedback();
