#!/usr/bin/env node

/**
 * 直接测试日志创建函数
 * 绕过任务创建，直接调用日志服务
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testDirectLogCreation() {
  console.log('\n========== 直接测试日志创建 ==========\n');

  try {
    // 1. 查询一个朝堂和大臣
    console.log('📊 步骤 1: 查询朝堂和大臣\n');

    const { data: courts } = await supabase
      .from('courts')
      .select('*')
      .limit(1);

    if (!courts || courts.length === 0) {
      throw new Error('没有找到朝堂');
    }

    const testCourt = courts[0];
    console.log(`朝堂: ${testCourt.name} (${testCourt.id})\n`);

    const { data: members } = await supabase
      .from('court_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('court_id', testCourt.id)
      .limit(1);

    if (!members || members.length === 0) {
      throw new Error('朝堂没有成员');
    }

    const testMinister = members[0];
    const ministerName = testMinister.user.nickname || testMinister.user.username;
    console.log(`大臣: ${ministerName} (${testMinister.user_id})\n`);

    // 2. 检查初始日志数量
    console.log('📊 步骤 2: 检查初始日志数量\n');

    const { data: initialLogs } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', testCourt.id)
      .eq('user_id', testMinister.user_id)
      .eq('viewed_by_minister', false);

    const initialCount = initialLogs?.length || 0;
    console.log(`初始未查看日志: ${initialCount} 条\n`);

    // 3. 直接调用数据库函数创建日志
    console.log('📝 步骤 3: 直接调用数据库函数创建日志\n');

    const testMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 皇帝让${ministerName}去写报告，${ministerName}连屁都不敢放，乖乖接受了`;

    console.log(`创建日志: ${testMessage}\n`);

    const { data: createResult, error: createError } = await supabase.rpc('create_sarcasm_log', {
      p_court_id: testCourt.id,
      p_user_id: testMinister.user_id,
      p_log_type: 'task_assigned',
      p_log_message: testMessage,
      p_related_data: {
        taskId: 'test-task-id',
        taskName: '测试任务'
      }
    });

    if (createError) {
      console.error('❌ 创建日志失败:', createError);
      throw createError;
    }

    console.log('✅ 日志创建成功!\n');
    console.log('返回结果:', JSON.stringify(createResult, null, 2), '\n');

    // 4. 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. 检查日志是否真的创建了
    console.log('📊 步骤 4: 验证日志是否创建\n');

    const { data: afterLogs } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', testCourt.id)
      .eq('user_id', testMinister.user_id)
      .eq('viewed_by_minister', false)
      .order('created_at', { ascending: false });

    const afterCount = afterLogs?.length || 0;
    console.log(`现在未查看日志: ${afterCount} 条`);
    console.log(`新增日志: ${afterCount - initialCount} 条\n`);

    if (afterCount > initialCount) {
      console.log('✅ 日志创建成功!\n');
      console.log('最新日志:');
      const latestLog = afterLogs[0];
      console.log(`  ID: ${latestLog.id}`);
      console.log(`  类型: ${latestLog.log_type}`);
      console.log(`  消息: ${latestLog.log_message}`);
      console.log(`  创建时间: ${latestLog.created_at}`);
      console.log(`  已查看: ${latestLog.viewed_by_minister}\n`);
    } else {
      console.log('❌ 日志未创建!\n');
    }

    // 6. 测试 API 端点
    console.log('📊 步骤 5: 测试 API 端点\n');

    const axios = require('axios');
    const apiUrl = `https://backend-production-a216.up.railway.app/api/logs/unviewed/${testCourt.id}/${testMinister.user_id}`;
    
    console.log(`请求: ${apiUrl}\n`);

    try {
      const apiResponse = await axios.get(apiUrl);
      console.log('✅ API 响应成功!');
      console.log(`  状态码: ${apiResponse.status}`);
      console.log(`  未查看日志: ${apiResponse.data.unviewedLogs?.length || 0} 条`);
      console.log(`  总日志: ${apiResponse.data.totalLogs || 0} 条\n`);

      if (apiResponse.data.unviewedLogs && apiResponse.data.unviewedLogs.length > 0) {
        console.log('最新的 3 条日志:');
        apiResponse.data.unviewedLogs.slice(0, 3).forEach((log, index) => {
          console.log(`\n${index + 1}. [${log.log_type}]`);
          console.log(`   ${log.log_message}`);
        });
      }
    } catch (error) {
      console.error('❌ API 请求失败:', error.response?.data || error.message);
    }

    console.log('\n========== 测试完成 ==========\n');

    // 总结
    console.log('总结:');
    console.log(`  数据库函数: ${createError ? '❌ 失败' : '✅ 成功'}`);
    console.log(`  日志创建: ${afterCount > initialCount ? '✅ 成功' : '❌ 失败'}`);
    console.log(`  API 端点: 见上方结果\n`);

    if (afterCount > initialCount) {
      console.log('✅ 日志系统的数据库层工作正常!\n');
      console.log('问题可能在于:');
      console.log('  1. tasks.ts 中的日志调用未执行');
      console.log('  2. 任务创建失败，导致日志代码未运行');
      console.log('  3. 参数传递有问题\n');
    } else {
      console.log('❌ 日志系统的数据库层有问题!\n');
      console.log('需要检查:');
      console.log('  1. 数据库函数是否正确部署');
      console.log('  2. 函数权限是否正确');
      console.log('  3. 参数是否正确\n');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

testDirectLogCreation();
