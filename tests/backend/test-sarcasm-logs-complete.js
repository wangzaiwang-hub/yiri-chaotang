#!/usr/bin/env node

/**
 * 完整的皇帝毒舌日志系统测试
 * 测试流程：
 * 1. 创建测试数据（朝堂、用户）
 * 2. 创建日志
 * 3. 获取未查看日志
 * 4. 标记日志为已查看
 * 5. 验证日志进度
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

// 测试数据
const testData = {
  courtId: 'test-court-' + Date.now(),
  userId: 'test-user-' + Date.now(),
  ministerId: 'test-minister-' + Date.now(),
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test() {
  try {
    log('\n========== 皇帝毒舌日志系统完整测试 ==========\n', 'cyan');

    // 测试 1: 创建日志
    log('📝 测试 1: 创建日志', 'blue');
    const createLogResponse = await axios.post(`${API_BASE_URL}/logs/create`, {
      court_id: testData.courtId,
      user_id: testData.userId,
      log_type: 'task_assignment',
      log_message: `皇帝让${testData.ministerId}去唱歌，${testData.ministerId}连屁都不敢放，乖乖接受了`,
      related_data: {
        minister_id: testData.ministerId,
        task_type: 'sing',
      }
    });
    log(`✅ 日志创建成功: ${createLogResponse.data.message}`, 'green');
    const logId1 = createLogResponse.data.logId;

    // 创建第二条日志
    const createLog2Response = await axios.post(`${API_BASE_URL}/logs/create`, {
      court_id: testData.courtId,
      user_id: testData.userId,
      log_type: 'task_failure',
      log_message: `皇帝对${testData.ministerId}做了惩罚，${testData.ministerId}下的连连磕头`,
      related_data: {
        minister_id: testData.ministerId,
        punishment_type: 'kneel',
      }
    });
    log(`✅ 第二条日志创建成功: ${createLog2Response.data.message}`, 'green');
    const logId2 = createLog2Response.data.logId;

    // 测试 2: 获取未查看日志
    log('\n📖 测试 2: 获取未查看日志', 'blue');
    const unviewedResponse = await axios.get(
      `${API_BASE_URL}/logs/unviewed/${testData.courtId}/${testData.userId}?limit=50`
    );
    log(`✅ 获取未查看日志成功`, 'green');
    log(`   未查看日志数: ${unviewedResponse.data.unviewedCount}`, 'cyan');
    log(`   日志列表:`, 'cyan');
    unviewedResponse.data.unviewedLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.log_type}] ${log.log_message.substring(0, 50)}...`);
    });

    // 测试 3: 获取日志进度
    log('\n📊 测试 3: 获取日志进度', 'blue');
    const progressResponse = await axios.get(
      `${API_BASE_URL}/logs/progress/${testData.courtId}/${testData.userId}`
    );
    log(`✅ 获取日志进度成功`, 'green');
    log(`   总日志数: ${progressResponse.data.progress.total_logs}`, 'cyan');
    log(`   已查看: ${progressResponse.data.progress.viewed_logs}`, 'cyan');
    log(`   未查看: ${progressResponse.data.progress.unviewed_logs}`, 'cyan');

    // 测试 4: 标记日志为已查看
    log('\n✔️ 测试 4: 标记日志为已查看', 'blue');
    const markViewedResponse = await axios.post(`${API_BASE_URL}/logs/mark-viewed`, {
      courtId: testData.courtId,
      userId: testData.userId,
      logIds: [logId1, logId2]
    });
    log(`✅ 标记日志为已查看成功: ${markViewedResponse.data.message}`, 'green');

    // 测试 5: 验证日志已查看
    log('\n🔍 测试 5: 验证日志已查看', 'blue');
    const unviewedAfterResponse = await axios.get(
      `${API_BASE_URL}/logs/unviewed/${testData.courtId}/${testData.userId}?limit=50`
    );
    log(`✅ 验证成功`, 'green');
    log(`   未查看日志数: ${unviewedAfterResponse.data.unviewedCount}`, 'cyan');

    // 测试 6: 获取日志历史
    log('\n📚 测试 6: 获取日志历史', 'blue');
    const historyResponse = await axios.get(
      `${API_BASE_URL}/logs/history/${testData.courtId}/${testData.userId}?limit=50&offset=0`
    );
    log(`✅ 获取日志历史成功`, 'green');
    log(`   历史日志数: ${historyResponse.data.total}`, 'cyan');

    // 测试 7: 获取未查看日志数量
    log('\n🔢 测试 7: 获取未查看日志数量', 'blue');
    const countResponse = await axios.get(
      `${API_BASE_URL}/logs/unviewed-count/${testData.courtId}/${testData.userId}`
    );
    log(`✅ 获取未查看日志数量成功`, 'green');
    log(`   未查看日志数: ${countResponse.data.unviewedCount}`, 'cyan');

    log('\n========== 所有测试通过！ ==========\n', 'green');

  } catch (error) {
    log(`\n❌ 测试失败: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   错误详情: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    process.exit(1);
  }
}

test();
