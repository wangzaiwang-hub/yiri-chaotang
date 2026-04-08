/**
 * 测试 SecondMe 聊天 API
 * 
 * 使用场景：
 * 1. 皇帝给大臣下达任务
 * 2. 使用大臣的 OAuth2 access token
 * 3. 调用大臣自己的虚拟人
 * 4. 虚拟人回复任务
 */

const axios = require('axios');

const BASE_URL = 'https://api.mindverse.com/gate/lab';

// 从命令行参数获取
const ACCESS_TOKEN = process.argv[2]; // 大臣的 access token
const MESSAGE = process.argv[3] || '你好，请帮我完成一个任务：写一份项目总结报告';
const SYSTEM_PROMPT = '你是一位朝堂大臣，负责完成皇帝交代的任务。请以恭敬但略带憋屈的语气回复，表现出既想好好完成任务又有点无奈的心情。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、星号、列表、标题等），像真人对话一样回复，可以适当使用"……"、"唉"等语气词来表达情绪。';

if (!ACCESS_TOKEN) {
  console.error('用法: node test-chat-api.js <ACCESS_TOKEN> [MESSAGE]');
  console.error('');
  console.error('参数说明:');
  console.error('  ACCESS_TOKEN - 大臣的 OAuth2 access token');
  console.error('  MESSAGE      - 要发送的消息（可选）');
  console.error('');
  console.error('示例:');
  console.error('  node test-chat-api.js "lba_at_xxx..." "帮我写代码"');
  console.error('');
  console.error('如何获取 ACCESS_TOKEN:');
  console.error('  1. 登录朝堂系统');
  console.error('  2. 打开浏览器开发者工具 (F12)');
  console.error('  3. 查看 localStorage 中的 token');
  process.exit(1);
}

async function testChatAPI() {
  try {
    console.log('=== 测试 SecondMe 聊天 API ===\n');
    console.log(`📤 发送消息: "${MESSAGE}"`);
    console.log(`🎭 系统提示: "${SYSTEM_PROMPT}"`);
    console.log('');
    
    // 调用流式聊天 API
    const response = await axios.post(
      `${BASE_URL}/api/secondme/chat/stream`,
      {
        message: MESSAGE,
        systemPrompt: SYSTEM_PROMPT
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );
    
    console.log('✅ 连接成功，接收 AI 回复...\n');
    console.log('--- AI 回复 ---');
    
    let fullReply = '';
    let sessionId = null;
    
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('event: session')) {
          // 下一行是 session data
          continue;
        }
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n--- 回复结束 ---\n');
            console.log('✅ 测试成功！');
            console.log('');
            console.log('=== 完整回复 ===');
            console.log(fullReply);
            console.log('');
            if (sessionId) {
              console.log(`Session ID: ${sessionId}`);
            }
            process.exit(0);
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // 处理 session ID
            if (parsed.sessionId) {
              sessionId = parsed.sessionId;
              console.log(`📝 Session ID: ${sessionId}\n`);
              continue;
            }
            
            // 处理聊天内容
            if (parsed.choices?.[0]?.delta?.content) {
              const text = parsed.choices[0].delta.content;
              process.stdout.write(text);
              fullReply += text;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });
    
    response.data.on('error', (error) => {
      console.error('\n❌ 流式响应错误:', error.message);
      process.exit(1);
    });
    
    response.data.on('end', () => {
      if (!fullReply) {
        console.log('\n⚠️  未收到任何回复');
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('');
      console.error('错误详情:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.response?.status === 401) {
      console.error('');
      console.error('💡 提示: Access Token 可能已过期，请重新登录获取新的 token');
    }
    
    process.exit(1);
  }
}

// 运行测试
testChatAPI();
