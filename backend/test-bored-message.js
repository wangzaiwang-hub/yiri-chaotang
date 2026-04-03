const axios = require('axios');

// 测试无聊提示语 API
async function testBoredMessage() {
  try {
    console.log('🧪 测试无聊提示语 API...\n');
    
    // 替换为你的实际 emperor_id
    const emperorId = 'YOUR_EMPEROR_USER_ID';
    
    console.log('📡 发送请求到 /api/tasks/bored-message');
    console.log('参数:', { emperor_id: emperorId });
    
    const response = await axios.post('http://localhost:3001/api/tasks/bored-message', {
      emperor_id: emperorId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ API 响应成功！');
    console.log('状态码:', response.status);
    console.log('返回数据:', JSON.stringify(response.data, null, 2));
    console.log('\n生成的消息:', response.data.data.message);
    
  } catch (error) {
    console.error('\n❌ 测试失败！');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 运行测试
testBoredMessage();
