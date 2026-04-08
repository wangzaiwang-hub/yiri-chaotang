#!/usr/bin/env node

/**
 * 为指定朝堂创建测试日志
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 使用 "aaa" 朝堂
const COURT_ID = '88526e62-8c31-469c-8114-fccf49155410';

async function createLogsForCourt() {
  console.log('\n========== 为朝堂创建测试日志 ==========\n');

  try {
    // 1. 获取朝堂信息
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', COURT_ID)
      .single();

    if (courtError) {
      console.error('❌ 查询朝堂失败:', courtError.message);
      return;
    }

    console.log(`✅ 朝堂: ${court.name} (${COURT_ID})`);

    // 2. 获取所有大臣
    const { data: ministers, error: ministersError } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', COURT_ID)
      .eq('role', 'minister');

    if (ministersError || !ministers || ministers.length === 0) {
      console.error('❌ 没有找到大臣');
      return;
    }

    console.log(`✅ 找到 ${ministers.length} 个大臣\n`);

    // 3. 为每个大臣创建日志
    for (const minister of ministers) {
      console.log(`📝 为大臣 ${minister.user_id} 创建日志...`);

      // 获取用户信息
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', minister.user_id)
        .single();

      const ministerName = user ? (user.username || user.email || '大臣') : '大臣';
      console.log(`   名字: ${ministerName}`);

      const testLogs = [
        {
          court_id: COURT_ID,
          user_id: minister.user_id,
          log_type: 'task_assigned',
          log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] 皇帝让${ministerName}去唱歌，${ministerName}连屁都不敢放，乖乖接受了`,
          related_data: { task_name: '唱歌', task_id: 'test-task-1' },
          viewed_by_minister: false
        },
        {
          court_id: COURT_ID,
          user_id: minister.user_id,
          log_type: 'task_failed',
          log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${ministerName}唱歌失败了，50分的成绩，皇帝看了一眼就摇头了`,
          related_data: { task_name: '唱歌', task_id: 'test-task-1', score: 50 },
          viewed_by_minister: false
        },
        {
          court_id: COURT_ID,
          user_id: minister.user_id,
          log_type: 'punishment',
          log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] 皇帝对${ministerName}进行了虚拟惩罚，${ministerName}下的连连磕头，求饶都没用`,
          related_data: { punishment_type: 'virtual' },
          viewed_by_minister: false
        }
      ];

      for (const log of testLogs) {
        const { data, error } = await supabase
          .from('emperor_sarcasm_logs')
          .insert([log])
          .select();

        if (error) {
          console.error(`   ❌ 创建日志失败:`, error.message);
        } else {
          console.log(`   ✅ 创建日志: ${log.log_type}`);
        }
      }

      console.log('');
    }

    // 4. 验证日志创建
    console.log('🔍 验证日志创建...');
    const { data: allLogs, error: verifyError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', COURT_ID)
      .eq('viewed_by_minister', false);

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
    } else {
      console.log(`✅ 验证成功: 找到 ${allLogs.length} 条未查看的日志`);
      console.log('\n现在大臣登录时应该能看到这些日志了！');
      console.log(`\n朝堂 ID: ${COURT_ID}`);
      console.log(`朝堂名称: ${court.name}`);
      
      // 按大臣分组显示
      const logsByMinister = {};
      allLogs.forEach(log => {
        if (!logsByMinister[log.user_id]) {
          logsByMinister[log.user_id] = [];
        }
        logsByMinister[log.user_id].push(log);
      });

      console.log('\n未查看日志统计:');
      for (const [userId, logs] of Object.entries(logsByMinister)) {
        console.log(`  大臣 ${userId}: ${logs.length} 条日志`);
      }
    }

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    console.error(error);
  }

  console.log('\n========== 创建完成 ==========\n');
}

createLogsForCourt();
