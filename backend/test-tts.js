const axios = require('axios');

// 测试 TTS API
async function testTTS() {
  try {
    console.log('开始测试 TTS API...\n');

    // 替换为实际的用户 ID（大臣的 ID）
    const userId = 'YOUR_MINISTER_USER_ID';
    const testText = '陛下，臣已完成您交代的任务，请您过目。';

    console.log('测试参数:');
    console.log('- 用户ID:', userId);
    console.log('- 文本:', testText);
    console.log('- 情绪: fluent\n');

    const response = await axios.post(
      'http://localhost:3000/api/tts/generate',
      {
        text: testText,
        userId: userId,
        emotion: 'fluent'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ TTS 生成成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('\n音频 URL:', response.data.data?.url);
    console.log('时长:', response.data.data?.durationMs, 'ms');
    console.log('采样率:', response.data.data?.sampleRate, 'Hz');
    console.log('格式:', response.data.data?.format);

  } catch (error) {
    console.error('❌ TTS 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testTTS();
