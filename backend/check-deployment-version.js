#!/usr/bin/env node

/**
 * 检查 Railway 部署的代码版本
 */

const axios = require('axios');

const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

async function checkVersion() {
  console.log('\n========== 检查部署版本 ==========\n');

  try {
    // 测试新添加的日志路由是否存在
    console.log('📊 测试 1: 检查日志路由是否存在\n');
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/logs/unviewed/test/test`
      );
      console.log('✅ 日志路由存在（新代码已部署）');
      console.log(`   状态码: ${response.status}\n`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ 日志路由不存在（旧代码）');
        console.log('   Railway 可能没有部署最新代码\n');
      } else {
        console.log('✅ 日志路由存在（返回了错误但路由存在）');
        console.log(`   状态码: ${error.response?.status}\n`);
      }
    }

    // 测试任务创建是否包含日志代码
    console.log('📊 测试 2: 尝试创建任务（会失败但能看到错误）\n');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, {
        court_id: 'test',
        emperor_id: 'test',
        assignee_id: 'test',
        title: 'test',
        description: 'test',
        task_type: 'test',
        deadline: new Date().toISOString(),
        grudge_reward: 10
      });
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️ 任务创建返回 500 错误');
        console.log('   这可能是因为新代码有问题');
        console.log('   或者是因为测试数据无效\n');
      } else {
        console.log(`   状态码: ${error.response?.status}`);
        console.log(`   错误: ${JSON.stringify(error.response?.data)}\n`);
      }
    }

    console.log('========================================');
    console.log('  结论');
    console.log('========================================\n');
    
    console.log('如果日志路由存在，说明新代码已部署。');
    console.log('如果任务创建返回 500，说明我们添加的代码有问题。\n');
    
    console.log('建议:');
    console.log('  1. 查看 Railway 控制台的最新部署时间');
    console.log('  2. 如果不是最新的，手动触发重新部署');
    console.log('  3. 查看 Railway 日志找到具体错误\n');

  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

checkVersion();
