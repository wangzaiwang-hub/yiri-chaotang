const axios = require('axios');

/**
 * 简单的 SecondMe TTS API 测试脚本
 * 
 * 使用方法:
 * 1. 从浏览器开发者工具或数据库获取 access_token
 * 2. 修改下面的 ACCESS_TOKEN 变量
 * 3. 运行: node backend/test-tts-simple.js
 */

// ========== 配置区域 ==========
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // 替换为实际的 access token
const TEST_TEXT = '陛下，臣已完成您交代的任务，请您过目。';
const EMOTION = 'fluent'; // 可选: happy/sad/angry/fearful/disgusted/surprised/calm/fluent
// ==============================

async function testTTS() {
  try {
    console.log('=== SecondMe TTS API 测试 ===\n');
    
    if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
      console.error('❌ 请先设置 ACCESS_TOKEN');
      console.log('\n获取 ACCESS_TOKEN 的方法:');
      console.log('1. 登录朝堂游戏');
      console.log('2. 打开浏览器开发者工具 (F12)');
      console.log('3. 在 Console 中输入: localStorage.getItem("auth-storage")');
      console.log('4. 找到 state.token 的值');
      console.log('5. 或者从数据库 users 表的 secondme_access_token 字段获取\n');
      return;
    }

    console.log('测试参数:');
    console.log('- 文本:', TEST_TEXT);
    console.log('- 情绪:', EMOTION);
    console.log('- Token前缀:', ACCESS_TOKEN.substring(0, 20) + '...\n');

    console.log('正在调用 SecondMe TTS API...\n');

    const response = await axios.post(
      'https://api.mindverse.com/gate/lab/api/secondme/tts/generate',
      {
        text: TEST_TEXT,
        emotion: EMOTION,
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ TTS 生成成功!\n');
    console.log('完整响应:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data?.data?.url) {
      console.log('\n=== 音频信息 ===');
      console.log('🔊 音频 URL:', response.data.data.url);
      console.log('⏱️  时长:', response.data.data.durationMs, 'ms');
      console.log('📊 采样率:', response.data.data.sampleRate, 'Hz');
      console.log('📁 格式:', response.data.data.format);
      console.log('\n💡 可以复制音频URL在浏览器中打开试听');
    } else {
      console.log('\n⚠️  响应中没有音频URL');
    }

  } catch (error) {
    console.error('\n❌ TTS 测试失败:\n');
    
    if (error.response) {
      console.error('HTTP 状态码:', error.response.status);
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
      
      const errorCode = error.response.data?.subCode;
      const errorMessage = error.response.data?.message;
      
      console.log('\n=== 错误分析 ===');
      
      if (errorCode === 'tts.voice_id.not_set') {
        console.log('❌ 错误原因: 用户未设置语音');
        console.log('\n💡 解决方案:');
        console.log('1. 打开 SecondMe 应用 (https://second.me)');
        console.log('2. 登录账号');
        console.log('3. 进入 "我的" -> "设置"');
        console.log('4. 找到 "语音设置" 或 "声音克隆"');
        console.log('5. 设置个人语音或选择预设语音');
        console.log('6. 完成设置后重新测试');
        
      } else if (errorCode === 'apikey.permission.denied') {
        console.log('❌ 错误原因: API权限不足');
        console.log('\n💡 解决方案:');
        console.log('1. 检查 OAuth2 配置的权限范围');
        console.log('2. 当前可能只有: userinfo chat.write chat.read');
        console.log('3. 需要添加: voice 权限');
        console.log('4. 更新 backend/.env 中的 OAuth2 配置');
        console.log('5. 用户需要重新授权登录');
        
      } else if (error.response.status === 401) {
        console.log('❌ 错误原因: 认证失败');
        console.log('\n💡 解决方案:');
        console.log('1. Access Token 可能已过期');
        console.log('2. 请重新获取 Access Token');
        console.log('3. 或者让用户重新登录游戏');
        
      } else if (errorCode === 'tts.text.too_long') {
        console.log('❌ 错误原因: 文本过长');
        console.log('\n💡 解决方案:');
        console.log('1. 文本长度超过限制 (通常是10000字符)');
        console.log('2. 请缩短文本内容');
        
      } else {
        console.log('❌ 未知错误');
        console.log('错误码:', errorCode);
        console.log('错误信息:', errorMessage);
      }
      
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ 请求超时 (30秒)');
      console.log('\n💡 可能的原因:');
      console.log('1. 网络连接不稳定');
      console.log('2. SecondMe API 响应缓慢');
      console.log('3. 文本过长导致生成时间过长');
      
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('❌ 无法连接到 SecondMe API');
      console.log('\n💡 可能的原因:');
      console.log('1. 网络连接问题');
      console.log('2. DNS解析失败');
      console.log('3. 防火墙阻止');
      
    } else {
      console.error('❌ 未知错误:', error.message);
      console.error('错误详情:', error);
    }
  }
}

// 运行测试
console.log('SecondMe TTS API 测试工具\n');
testTTS();
