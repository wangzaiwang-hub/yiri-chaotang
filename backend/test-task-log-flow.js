#!/usr/bin/env node

/**
 * 完整测试：创建任务 → 等待完成 → 检查日志
 * 
 * 这个脚本会：
 * 1. 查询现有的朝堂和成员
 * 2. 创建一个测试任务
 * 3. 等待任务完成
 * 4. 检查是否创建了日志
 * 5. 批准任务
 * 6. 再次检查日志
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// API 基础 URL - 使用 Railway 生产环境
const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

console.log(`\n🔗 使用 API: ${API_BASE_URL}\n`);

// 辅助函数：等待
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 辅助函数：格式化时间
function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

async function main() {
  console.log('========================================');
  console.log('  任务-日志流程完整测试');
  console.log('========================================\n');

  try {
    // ============================================
    // 步骤 1: 查询现有朝堂和成员
    // ============================================
    console.log(`[${formatTime()}] 📊 步骤 1: 查询朝堂和成员\n`);

    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('*')
      .limit(5);

    if (courtsError) {
      throw new Error(`查询朝堂失败: ${courtsError.message}`);
    }

    if (!courts || courts.length === 0) {
      throw new Error('没有找到任何朝堂，请先创建朝堂');
    }

    console.log(`找到 ${courts.length} 个朝堂:\n`);
    for (const court of courts) {
      // 单独查询皇帝信息
      const { data: emperor } = await supabase
        .from('users')
        .select('nickname, username')
        .eq('id', court.emperor_id)
        .single();
      
      console.log(`${courts.indexOf(court) + 1}. ${court.name} (ID: ${court.id})`);
      console.log(`   皇帝: ${emperor?.nickname || emperor?.username || court.emperor_id}`);
    }

    // 使用第一个朝堂
    const testCourt = courts[0];
    console.log(`\n✅ 使用朝堂: ${testCourt.name}\n`);

    // 查询朝堂成员
    const { data: members, error: membersError } = await supabase
      .from('court_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('court_id', testCourt.id);

    if (membersError) {
      throw new Error(`查询成员失败: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      throw new Error('朝堂没有成员，请先加入朝堂');
    }

    console.log(`找到 ${members.length} 个成员:\n`);
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.user.nickname || member.user.username}`);
      console.log(`   ID: ${member.user_id}`);
      console.log(`   部门: ${member.department || '未分配'}`);
      console.log(`   怨气值: ${member.grudge_value || 0}`);
    });

    // 找到皇帝
    const emperor = members.find(m => m.department === 'emperor');
    if (!emperor) {
      throw new Error('朝堂没有皇帝');
    }

    console.log(`\n✅ 皇帝: ${emperor.user.nickname || emperor.user.username}\n`);

    // 找到一个非皇帝的成员作为测试大臣
    const testMinister = members.find(m => m.department !== 'emperor') || members[0];
    console.log(`✅ 使用大臣: ${testMinister.user.nickname || testMinister.user.username}\n`);

    // ============================================
    // 步骤 2: 检查初始日志数量
    // ============================================
    console.log(`[${formatTime()}] 📊 步骤 2: 检查初始日志数量\n`);

    const { data: initialLogs, error: initialLogsError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', testCourt.id)
      .eq('user_id', testMinister.user_id)
      .eq('viewed_by_minister', false);

    if (initialLogsError) {
      console.error('⚠️ 查询初始日志失败:', initialLogsError.message);
    }

    const initialLogCount = initialLogs?.length || 0;
    console.log(`当前未查看日志数量: ${initialLogCount}\n`);

    // ============================================
    // 步骤 3: 创建测试任务
    // ============================================
    console.log(`[${formatTime()}] 📝 步骤 3: 创建测试任务\n`);

    const taskData = {
      court_id: testCourt.id,
      emperor_id: emperor.user_id, // 使用找到的皇帝 ID
      assignee_id: testMinister.user_id,
      title: `测试任务 - ${formatTime()}`,
      description: '请写一份简短的工作报告，说明你今天做了什么。',
      task_type: 'document',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      grudge_reward: 10
    };

    console.log('任务信息:');
    console.log(`  标题: ${taskData.title}`);
    console.log(`  描述: ${taskData.description}`);
    console.log(`  分配给: ${testMinister.user.nickname || testMinister.user.username}`);

    let taskResponse;
    try {
      taskResponse = await axios.post(`${API_BASE_URL}/tasks`, taskData);
      console.log(`\n✅ 任务创建成功! ID: ${taskResponse.data.data.id}\n`);
    } catch (error) {
      console.error('❌ 任务创建失败:', error.response?.data || error.message);
      throw error;
    }

    const taskId = taskResponse.data.data.id;

    // ============================================
    // 步骤 4: 立即检查日志（任务分配日志）
    // ============================================
    console.log(`[${formatTime()}] 📊 步骤 4: 检查任务分配日志\n`);

    await sleep(2000); // 等待 2 秒让日志创建

    const { data: afterCreateLogs, error: afterCreateLogsError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', testCourt.id)
      .eq('user_id', testMinister.user_id)
      .eq('viewed_by_minister', false)
      .order('created_at', { ascending: false });

    if (afterCreateLogsError) {
      console.error('⚠️ 查询日志失败:', afterCreateLogsError.message);
    }

    const afterCreateLogCount = afterCreateLogs?.length || 0;
    console.log(`当前未查看日志数量: ${afterCreateLogCount}`);
    console.log(`新增日志数量: ${afterCreateLogCount - initialLogCount}\n`);

    if (afterCreateLogCount > initialLogCount) {
      console.log('✅ 任务分配日志已创建!\n');
      console.log('最新日志:');
      const latestLog = afterCreateLogs[0];
      console.log(`  类型: ${latestLog.log_type}`);
      console.log(`  消息: ${latestLog.log_message}`);
      console.log(`  时间: ${latestLog.created_at}\n`);
    } else {
      console.log('❌ 任务分配日志未创建!\n');
      console.log('可能原因:');
      console.log('  1. 日志创建代码未执行');
      console.log('  2. 数据库函数有问题');
      console.log('  3. 参数传递错误\n');
    }

    // ============================================
    // 步骤 5: 等待大臣回复
    // ============================================
    console.log(`[${formatTime()}] ⏳ 步骤 5: 等待大臣回复\n`);

    let task = null;
    let attempts = 0;
    const maxAttempts = 30; // 最多等待 30 秒

    while (attempts < maxAttempts) {
      await sleep(1000);
      attempts++;

      const { data: taskData } = await supabase
        .from('virtual_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskData && taskData.result) {
        task = taskData;
        console.log(`✅ 大臣已回复! (等待了 ${attempts} 秒)\n`);
        console.log('大臣的回复:');
        console.log(`  ${taskData.result.substring(0, 200)}...\n`);
        break;
      }

      if (attempts % 5 === 0) {
        console.log(`  等待中... (${attempts}/${maxAttempts} 秒)`);
      }
    }

    if (!task || !task.result) {
      console.log('⚠️ 大臣未在 30 秒内回复，继续测试...\n');
    }

    // ============================================
    // 步骤 6: 批准任务
    // ============================================
    console.log(`[${formatTime()}] 👑 步骤 6: 批准任务\n`);

    try {
      await axios.post(`${API_BASE_URL}/tasks/${taskId}/approve`, {
        feedback: '准奏'
      });
      console.log('✅ 任务已批准!\n');
    } catch (error) {
      console.error('❌ 批准任务失败:', error.response?.data || error.message);
    }

    // ============================================
    // 步骤 7: 检查批准后的日志
    // ============================================
    console.log(`[${formatTime()}] 📊 步骤 7: 检查批准后的日志\n`);

    await sleep(2000); // 等待 2 秒让日志创建

    const { data: finalLogs, error: finalLogsError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', testCourt.id)
      .eq('user_id', testMinister.user_id)
      .eq('viewed_by_minister', false)
      .order('created_at', { ascending: false });

    if (finalLogsError) {
      console.error('⚠️ 查询最终日志失败:', finalLogsError.message);
    }

    const finalLogCount = finalLogs?.length || 0;
    console.log(`最终未查看日志数量: ${finalLogCount}`);
    console.log(`总共新增日志: ${finalLogCount - initialLogCount}\n`);

    if (finalLogCount > afterCreateLogCount) {
      console.log('✅ 任务批准日志已创建!\n');
    } else {
      console.log('❌ 任务批准日志未创建!\n');
    }

    // ============================================
    // 步骤 8: 显示所有新日志
    // ============================================
    console.log(`[${formatTime()}] 📋 步骤 8: 显示所有新日志\n`);

    if (finalLogs && finalLogs.length > 0) {
      console.log('所有未查看的日志:\n');
      finalLogs.forEach((log, index) => {
        console.log(`${index + 1}. [${log.log_type}]`);
        console.log(`   ${log.log_message}`);
        console.log(`   时间: ${new Date(log.created_at).toLocaleString('zh-CN')}\n`);
      });
    } else {
      console.log('没有未查看的日志\n');
    }

    // ============================================
    // 步骤 9: 测试 API 端点
    // ============================================
    console.log(`[${formatTime()}] 🔌 步骤 9: 测试 API 端点\n`);

    try {
      const apiResponse = await axios.get(
        `${API_BASE_URL}/logs/unviewed/${testCourt.id}/${testMinister.user_id}`
      );
      
      console.log('✅ API 响应成功!');
      console.log(`   状态码: ${apiResponse.status}`);
      console.log(`   未查看日志数量: ${apiResponse.data.unviewedLogs?.length || 0}`);
      console.log(`   总日志数量: ${apiResponse.data.totalLogs || 0}\n`);
    } catch (error) {
      console.error('❌ API 请求失败:', error.response?.data || error.message);
    }

    // ============================================
    // 总结
    // ============================================
    console.log('========================================');
    console.log('  测试总结');
    console.log('========================================\n');

    console.log(`初始日志数量: ${initialLogCount}`);
    console.log(`任务创建后: ${afterCreateLogCount} (${afterCreateLogCount > initialLogCount ? '✅' : '❌'})`);
    console.log(`任务批准后: ${finalLogCount} (${finalLogCount > afterCreateLogCount ? '✅' : '❌'})`);
    console.log(`总共新增: ${finalLogCount - initialLogCount} 条日志\n`);

    if (finalLogCount > initialLogCount) {
      console.log('✅ 日志系统工作正常!\n');
      console.log('下一步:');
      console.log('  1. 登录游戏作为大臣');
      console.log('  2. 刷新页面');
      console.log('  3. 应该看到日志弹窗\n');
    } else {
      console.log('❌ 日志系统未正常工作!\n');
      console.log('故障排查:');
      console.log('  1. 检查后端日志，搜索 "📝 创建"');
      console.log('  2. 检查数据库函数是否存在');
      console.log('  3. 检查 tasks.ts 中的日志调用是否执行\n');
      console.log('调试命令:');
      console.log(`  SELECT * FROM emperor_sarcasm_logs WHERE court_id = '${testCourt.id}' ORDER BY created_at DESC LIMIT 10;\n`);
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n详细错误:', error);
  }
}

// 运行测试
main().catch(console.error);
