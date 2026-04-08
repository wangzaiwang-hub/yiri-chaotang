/**
 * 测试工具调用功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testToolCall() {
  try {
    console.log('=== 测试工具调用功能 ===\n');

    // 1. 登录获取 token
    console.log('1. 登录...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'emperor@test.com',
      password: 'password123'
    });
    
    const token = loginRes.data.data.session.access_token;
    const userId = loginRes.data.data.user.id;
    console.log('✓ 登录成功\n');

    // 2. 获取朝堂列表
    console.log('2. 获取朝堂...');
    const courtsRes = await axios.get(`${BASE_URL}/api/courts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!courtsRes.data.data || courtsRes.data.data.length === 0) {
      console.log('✗ 没有朝堂，请先创建朝堂');
      return;
    }
    
    const courtId = courtsRes.data.data[0].id;
    console.log(`✓ 找到朝堂: ${courtId}\n`);

    // 3. 获取朝堂成员
    console.log('3. 获取朝堂成员...');
    const membersRes = await axios.get(`${BASE_URL}/api/courts/${courtId}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const ministers = membersRes.data.data.filter(m => m.user_id !== userId);
    if (ministers.length === 0) {
      console.log('✗ 没有大臣，请先邀请大臣加入');
      return;
    }
    
    const ministerId = ministers[0].user_id;
    console.log(`✓ 找到大臣: ${ministers[0].user.nickname}\n`);

    // 4. 创建需要工具调用的任务
    console.log('4. 创建任务（需要工具调用）...');
    const taskRes = await axios.post(
      `${BASE_URL}/api/tasks`,
      {
        court_id: courtId,
        emperor_id: userId,
        assignee_id: ministerId,
        title: '创建项目文档',
        description: '请帮我创建一个项目文档，标题是"朝堂系统设计"，内容包括：系统架构、核心功能、技术栈。',
        task_type: 'document',
        grudge_reward: 10
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const taskId = taskRes.data.data.id;
    console.log(`✓ 任务已创建: ${taskId}`);
    console.log('等待 AI 处理...\n');

    // 5. 轮询检查任务结果
    console.log('5. 等待任务完成...');
    let attempts = 0;
    const maxAttempts = 30; // 最多等待 30 秒
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const taskCheckRes = await axios.get(`${BASE_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const task = taskCheckRes.data.data;
      
      if (task.result) {
        console.log('\n✓ 任务完成！\n');
        console.log('=== AI 回复 ===');
        console.log(task.result);
        console.log('\n=== 对话历史 ===');
        console.log(JSON.stringify(task.conversation_history, null, 2));
        
        // 检查是否有工具调用痕迹
        const hasToolMarkers = task.result.includes('[TOOL_CALL]') || task.result.includes('[MCP_CALL]');
        if (hasToolMarkers) {
          console.log('\n⚠️  警告：回复中仍包含工具调用标记，说明清理失败');
        } else {
          console.log('\n✓ 回复已正确清理工具调用标记');
        }
        
        return;
      }
      
      process.stdout.write('.');
    }
    
    console.log('\n✗ 超时：任务未在预期时间内完成');
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testToolCall();
