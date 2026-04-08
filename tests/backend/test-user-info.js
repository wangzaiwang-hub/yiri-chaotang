const axios = require('axios');
require('dotenv').config();

async function testGetUserInfo() {
  try {
    console.log('=== 测试获取 SecondMe 用户信息 ===\n');
    
    // 从环境变量获取 access token
    const accessToken = process.env.TEST_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('❌ 错误：请在 .env 文件中设置 TEST_ACCESS_TOKEN');
      console.log('提示：你可以从浏览器的 localStorage 中获取 access_token');
      return;
    }
    
    console.log('📡 正在调用 SecondMe API...');
    console.log('Token 前缀:', accessToken.substring(0, 20) + '...\n');
    
    const response = await axios.get(
      'https://api.mindverse.com/gate/lab/api/secondme/user/info',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log('✅ API 调用成功！\n');
    console.log('=== 用户信息 ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    const userData = response.data.data;
    console.log('\n=== 关键字段 ===');
    console.log('用户ID:', userData.userId);
    console.log('昵称:', userData.name);
    console.log('邮箱:', userData.email);
    console.log('头像:', userData.avatar);
    console.log('个人简介 (bio):', userData.bio || '(未设置)');
    console.log('自我介绍 (selfIntroduction):', userData.selfIntroduction || '(未设置)');
    console.log('资料完整度:', userData.profileCompleteness + '%');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGetUserInfo();
