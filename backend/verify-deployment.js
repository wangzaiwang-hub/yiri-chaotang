#!/usr/bin/env node

/**
 * 验证部署 - 检查日志系统是否正常工作
 */

const axios = require('axios');

const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

async function verifyDeployment() {
  console.log('\n========================================');
  console.log('  验证部署 - 日志系统');
  console.log('========================================\n');

  console.log(`🔗 API: ${API_BASE_URL}\n`);

  let allPassed = true;

  try {
    // 测试 1: 检查日志 API 端点是否存在
    console.log('📊 测试 1: 检查日志 API 端点\n');
    
    try {
      // 使用一个测试 ID，即使不存在也应该返回 200 和空数组
      const testCourtId = '00000000-0000-0000-0000-000000000000';
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      const response = await axios.get(
        `${API_BASE_URL}/logs/unviewed/${testCourtId}/${testUserId}`
      );
      
      if (response.status === 200) {
        console.log('✅ 日志 API 端点正常工作');
        console.log(`   状态码: ${response.status}`);
        console.log(`   响应结构: ${JSON.stringify(Object.keys(response.data))}\n`);
      } else {
        console.log(`⚠️ 意外的状态码: ${response.status}\n`);
        allPassed = false;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ 日志 API 端点不存在（404）');
        console.log('   可能原因: 代码还未部署完成\n');
        allPassed = false;
      } else {
        console.log(`⚠️ API 请求失败: ${error.message}\n`);
        allPassed = false;
      }
    }

    // 测试 2: 检查任务 API 是否正常
    console.log('📊 测试 2: 检查任务 API\n');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      
      if (response.status === 200) {
        console.log('✅ 任务 API 正常工作');
        console.log(`   状态码: ${response.status}\n`);
      } else {
        console.log(`⚠️ 意外的状态码: ${response.status}\n`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ 任务 API 失败: ${error.message}\n`);
      allPassed = false;
    }

    // 测试 3: 检查健康状态
    console.log('📊 测试 3: 检查服务健康状态\n');
    
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      
      if (response.status === 200) {
        console.log('✅ 服务健康检查通过');
        console.log(`   状态码: ${response.status}\n`);
      }
    } catch (error) {
      // 健康检查端点可能不存在，这不是致命错误
      console.log(`⚠️ 健康检查端点不存在（这是正常的）\n`);
    }

    // 总结
    console.log('========================================');
    console.log('  验证结果');
    console.log('========================================\n');

    if (allPassed) {
      console.log('✅ 所有测试通过！日志系统已成功部署\n');
      console.log('下一步:');
      console.log('  1. 登录游戏作为皇帝');
      console.log('  2. 创建一个新任务');
      console.log('  3. 批准或驳回任务');
      console.log('  4. 刷新大臣页面');
      console.log('  5. 应该看到日志弹窗\n');
      
      console.log('或者运行完整测试:');
      console.log('  node backend/test-task-log-flow.js\n');
    } else {
      console.log('❌ 部分测试失败\n');
      console.log('可能原因:');
      console.log('  1. Railway 还在部署中（等待 2-3 分钟）');
      console.log('  2. 部署失败（检查 Railway 日志）');
      console.log('  3. API 路由配置有问题\n');
      
      console.log('建议:');
      console.log('  1. 等待几分钟后重新运行此脚本');
      console.log('  2. 检查 Railway 控制台的部署日志');
      console.log('  3. 确认代码已成功推送到 GitHub\n');
    }

  } catch (error) {
    console.error('\n❌ 验证过程出错:', error.message);
  }
}

// 运行验证
verifyDeployment();
