/**
 * 测试 SecondMe 访客聊天 API
 * 
 * 使用场景：
 * 1. 皇帝给大臣下达任务
 * 2. 使用大臣的 OAuth2 access token
 * 3. 使用大臣的虚拟人 API Key
 * 4. 虚拟人回复任务
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'https://api.mindverse.com/gate/lab';

// 从环境变量或命令行参数获取
const ACCESS_TOKEN = process.argv[2]; // 大臣的 access token
const AVATAR_API_KEY = process.argv[3]; // 大臣的虚拟人 API Key
const MESSAGE = process.argv[4] || '你好，请帮我完成一个任务：写一份项目总结报告';

if (!ACCESS_TOKEN || !AVATAR_API_KEY) {
  console.error('用法: node test-visitor-chat.js <ACCESS_TOKEN> <AVATAR_API_KEY> [MESSAGE]');
  console.error('');
  console.error('参数说明:');
  console.error('  ACCESS_TOKEN    - 大臣的 OAuth2 access token');
  console.error('  AVATAR_API_KEY  - 大臣的虚拟人 API Key (sk- 开头)');
  console.error('  MESSAGE         - 要发送的消息（可选）');
  console.error('');
  console.error('示例:');
  console.error('  node test-visitor-chat.js "lba_at_xxx..." "sk-xxx..." "帮我写代码"');
  process.exit(1);
}

async function testVisitorChat() {
  try {
    console.log('=== 测试 SecondMe 访客聊天 API ===\n');
    
    // 步骤 1: 初始化会话
    console.log('1️⃣  初始化会话...');
    const initResponse = await axios.post(
      `${BASE_URL}/api/secondme/visitor-chat/init`,
      {
        apiKey: AVATAR_API_KEY
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { sessionId, wsUrl, avatarName, opening } = initResponse.data.data;
    console.log('✅ 会话初始化成功！');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   分身名称: ${avatarName}`);
    console.log(`   开场白: ${opening || '(无)'}`);
    console.log(`   WebSocket URL: ${wsUrl.substring(0, 50)}...`);
    console.log('');
    
    // 步骤 2: 连接 WebSocket
    console.log('2️⃣  连接 WebSocket...');
    const ws = new WebSocket(wsUrl);
    
    let fullReply = '';
    let isReceiving = false;
    
    ws.on('open', () => {
      console.log('✅ WebSocket 连接成功！');
      console.log('');
    });
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        // 只处理 AI 回复
        if (msg.sender === 'umm') {
          if (msg.index === -1) {
            // 回复结束
            console.log('\n');
            console.log('✅ AI 回复完成！');
            console.log('');
            console.log('=== 完整回复 ===');
            console.log(fullReply);
            console.log('');
            
            ws.close();
            process.exit(0);
          } else {
            // 流式输出
            const text = msg.multipleData?.[0]?.modal?.answer;
            if (text) {
              if (!isReceiving) {
                console.log('3️⃣  接收 AI 回复...');
                isReceiving = true;
              }
              process.stdout.write(text);
              fullReply += text;
            }
          }
        }
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket 错误:', error.message);
      process.exit(1);
    });
    
    ws.on('close', () => {
      console.log('WebSocket 连接已关闭');
    });
    
    // 等待 WebSocket 连接建立
    await new Promise(resolve => {
      ws.on('open', resolve);
    });
    
    // 步骤 3: 发送消息
    console.log(`📤 发送消息: "${MESSAGE}"`);
    console.log('');
    
    await axios.post(
      `${BASE_URL}/api/secondme/visitor-chat/send`,
      {
        sessionId,
        apiKey: AVATAR_API_KEY,
        message: MESSAGE
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('');
      console.error('错误详情:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// 运行测试
testVisitorChat();
