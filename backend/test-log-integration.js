#!/usr/bin/env node

/**
 * 测试日志集成 - 验证游戏操作是否正确创建日志
 */

const axios = require('axios');

// 使用你的 API URL
const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

// 测试数据
const TEST_COURT_ID = '88526e62-8c31-469c-8114-fccf49155410'; // aaa 朝堂
const TEST_MINISTER_ID = '7b0b3f51-c3cd-4482-ae0f-0c29373c6d2f'; // 第一个大臣
const TEST_EMPEROR_ID = 'c8e0e8e0-8e0e-8e0e-8e0e-8e0e8e0e8e0e'; // 替换为实际的皇帝 ID

async function testLogIntegration() {
  console.log('\n========== 测试日志集成 ==========\n');

  try {
    // 1. 先检查当前未查看的日志数量
    console.log('📊 步骤 1: 检查当前未查看日志数量');
    const beforeUrl = `${API_BASE_URL}/logs/unviewed/${TEST_COURT_ID}/${TEST_MINISTER_ID}`;
    const beforeResponse = await axios.get(beforeUrl);
    const beforeCount = beforeResponse.data.unviewedLogs?.length || 0;
    console.log(`   当前未查看日志: ${beforeCount} 条\n`);

    // 2. 创建一个测试任务（这应该会触发日志创建）
    console.log('📊 步骤 2: 创建测试任务（应该触发日志创建）');
    console.log('   注意: 这需要有效的皇帝 ID 和大臣 token');
    console.log('   如果失败，请手动在游戏中创建任务来测试\n');

    // 3. 等待几秒钟让日志创建完成
    console.log('⏳ 等待 3 秒...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. 再次检查未查看的日志数量
    console.log('📊 步骤 3: 再次检查未查看日志数量');
    const afterResponse = await axios.get(beforeUrl);
    const afterCount = afterResponse.data.unviewedLogs?.length || 0;
    console.log(`   现在未查看日志: ${afterCount} 条\n`);

    // 5. 比较结果
    if (afterCount > beforeCount) {
      console.log('✅ 成功！日志集成正常工作');
      console.log(`   新增了 ${afterCount - beforeCount} 条日志\n`);
      
      // 显示新日志
      console.log('📝 新创建的日志:');
      const newLogs = afterResponse.data.unviewedLogs.slice(0, afterCount - beforeCount);
      newLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.log_type}`);
        console.log(`   消息: ${log.log_message}`);
        console.log(`   创建时间: ${log.created_at}`);
      });
    } else {
      console.log('⚠️ 警告：日志数量没有增加');
      console.log('   可能原因：');
      console.log('   1. 任务创建失败');
      console.log('   2. 日志创建代码未执行');
      console.log('   3. 需要手动在游戏中测试\n');
    }

    // 6. 显示如何手动测试
    console.log('\n📖 手动测试步骤:');
    console.log('   1. 登录游戏作为皇帝');
    console.log('   2. 创建一个新任务分配给大臣');
    console.log('   3. 等待大臣回复');
    console.log('   4. 批准或驳回任务');
    console.log('   5. 刷新大臣页面，应该看到日志弹窗\n');

  } catch (error) {
    console.error('\n❌ 测试失败');
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   错误信息:`, error.response.data);
    } else {
      console.error(`   错误:`, error.message);
    }
  }

  console.log('\n========== 测试完成 ==========\n');
}

testLogIntegration();
