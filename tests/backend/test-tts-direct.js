const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 测试 SecondMe TTS API
async function testSecondMeTTS() {
  try {
    console.log('=== SecondMe TTS API 测试 ===\n');

    // 1. 从数据库获取一个有效的用户和token
    console.log('步骤 1: 从数据库获取用户信息和token...');
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select(`
        access_token,
        user_id,
        users (
          id,
          nickname
        )
      `)
      .not('access_token', 'is', null)
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      console.error('❌ 无法获取用户token信息:', tokenError);
      console.log('\n提示: 请确保至少有一个用户已登录并授权');
      return;
    }

    const tokenData = tokens[0];
    const user = tokenData.users;
    console.log('✅ 找到用户:', user.nickname);
    console.log('   用户ID:', user.id);
    console.log('   Token前缀:', tokenData.access_token.substring(0, 20) + '...\n');

    // 2. 准备测试文本
    const testText = '陛下，臣已完成您交代的任务，请您过目。';
    console.log('步骤 2: 准备测试文本');
    console.log('   文本:', testText);
    console.log('   长度:', testText.length, '字符\n');

    // 3. 调用 SecondMe TTS API
    console.log('步骤 3: 调用 SecondMe TTS API...');
    const response = await axios.post(
      'https://api.mindverse.com/gate/lab/api/secondme/tts/generate',
      {
        text: testText,
        emotion: 'fluent', // 可选: happy/sad/angry/fearful/disgusted/surprised/calm/fluent
      },
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30秒超时
      }
    );

    console.log('✅ TTS 生成成功!\n');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data?.data?.url) {
      console.log('\n=== 音频信息 ===');
      console.log('音频 URL:', response.data.data.url);
      console.log('时长:', response.data.data.durationMs, 'ms');
      console.log('采样率:', response.data.data.sampleRate, 'Hz');
      console.log('格式:', response.data.data.format);
      console.log('\n✅ 可以在浏览器中打开音频URL试听');
    } else {
      console.log('\n⚠️  响应中没有音频URL');
    }

  } catch (error) {
    console.error('\n❌ TTS 测试失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      
      // 常见错误提示
      if (error.response.data?.subCode === 'tts.voice_id.not_set') {
        console.log('\n💡 解决方案:');
        console.log('   用户需要在 SecondMe 应用中设置语音');
        console.log('   1. 登录 SecondMe 应用');
        console.log('   2. 进入个人设置');
        console.log('   3. 设置语音克隆或选择预设语音');
      } else if (error.response.data?.subCode === 'apikey.permission.denied') {
        console.log('\n💡 解决方案:');
        console.log('   OAuth2 权限不足，需要添加 voice 权限');
        console.log('   当前权限: userinfo chat.write chat.read');
        console.log('   需要权限: userinfo chat.write chat.read voice');
      } else if (error.response.status === 401) {
        console.log('\n💡 解决方案:');
        console.log('   Access Token 可能已过期，请重新登录');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('请求超时');
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 测试本地 TTS API
async function testLocalTTS() {
  try {
    console.log('\n\n=== 本地 TTS API 测试 ===\n');

    // 1. 从数据库获取用户
    console.log('步骤 1: 从数据库获取用户信息...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, nickname')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ 无法获取用户信息:', userError);
      return;
    }

    const user = users[0];
    console.log('✅ 找到用户:', user.nickname);
    console.log('   用户ID:', user.id, '\n');

    // 2. 调用本地 TTS API
    console.log('步骤 2: 调用本地 TTS API...');
    const response = await axios.post(
      'http://localhost:3001/api/tts/generate',
      {
        text: '陛下，臣已完成您交代的任务，请您过目。',
        userId: user.id,
        emotion: 'fluent'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ 本地 TTS API 调用成功!\n');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data?.data?.url) {
      console.log('\n音频 URL:', response.data.data.url);
    }

  } catch (error) {
    console.error('\n❌ 本地 TTS API 测试失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('无法连接到本地服务器');
      console.log('\n💡 请确保后端服务正在运行:');
      console.log('   cd backend && npm run dev');
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 主函数
async function main() {
  console.log('开始 TTS 功能测试...\n');
  
  // 测试 SecondMe TTS API
  await testSecondMeTTS();
  
  // 测试本地 TTS API
  await testLocalTTS();
  
  console.log('\n测试完成!');
}

main();
