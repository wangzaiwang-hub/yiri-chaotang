#!/usr/bin/env node

/**
 * 创建测试日志数据
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

async function createSampleLogs() {
  console.log('\n========== 创建测试日志 ==========\n');

  try {
    // 1. 获取一个朝堂和大臣
    console.log('📋 查找朝堂和大臣...');
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('*')
      .limit(1);

    if (courtsError || !courts || courts.length === 0) {
      console.error('❌ 没有找到朝堂，请先创建一个朝堂');
      return;
    }

    const courtId = courts[0].id;
    console.log(`✅ 找到朝堂: ${courts[0].name} (${courtId})`);

    // 2. 获取朝堂成员
    const { data: members, error: membersError } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', courtId);

    if (membersError || !members || members.length === 0) {
      console.error('❌ 朝堂中没有成员');
      return;
    }

    const emperor = members.find(m => m.role === 'emperor');
    const minister = members.find(m => m.role === 'minister');

    if (!emperor) {
      console.error('❌ 没有找到皇帝');
      return;
    }

    if (!minister) {
      console.error('❌ 没有找到大臣，请先邀请一个大臣加入朝堂');
      return;
    }

    console.log(`✅ 找到皇帝: ${emperor.user_id}`);
    console.log(`✅ 找到大臣: ${minister.user_id}`);

    // 3. 获取用户信息
    const { data: ministerUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', minister.user_id)
      .single();

    if (userError) {
      console.error('❌ 获取大臣信息失败:', userError.message);
      return;
    }

    const ministerName = ministerUser.username || ministerUser.email || '大臣';
    console.log(`✅ 大臣名字: ${ministerName}`);

    // 4. 创建测试日志
    console.log('\n📝 创建测试日志...');

    const testLogs = [
      {
        court_id: courtId,
        user_id: minister.user_id,
        log_type: 'task_assigned',
        log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] 皇帝让${ministerName}去唱歌，${ministerName}连屁都不敢放，乖乖接受了`,
        related_data: { task_name: '唱歌', task_id: 'test-task-1' }
      },
      {
        court_id: courtId,
        user_id: minister.user_id,
        log_type: 'task_failed',
        log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${ministerName}唱歌失败了，50分的成绩，皇帝看了一眼就摇头了`,
        related_data: { task_name: '唱歌', task_id: 'test-task-1', score: 50 }
      },
      {
        court_id: courtId,
        user_id: minister.user_id,
        log_type: 'punishment',
        log_message: `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] 皇帝对${ministerName}进行了虚拟惩罚，${ministerName}下的连连磕头，求饶都没用`,
        related_data: { punishment_type: 'virtual' }
      }
    ];

    for (const log of testLogs) {
      const { data, error } = await supabase
        .from('emperor_sarcasm_logs')
        .insert([log])
        .select();

      if (error) {
        console.error(`❌ 创建日志失败:`, error.message);
      } else {
        console.log(`✅ 创建日志成功: ${log.log_type}`);
        console.log(`   消息: ${log.log_message}`);
      }
    }

    // 5. 验证日志创建
    console.log('\n🔍 验证日志创建...');
    const { data: createdLogs, error: verifyError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .eq('court_id', courtId)
      .eq('user_id', minister.user_id)
      .eq('viewed_by_minister', false);

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
    } else {
      console.log(`✅ 验证成功: 找到 ${createdLogs.length} 条未查看的日志`);
      console.log('\n现在大臣登录时应该能看到这些日志了！');
      console.log(`\n大臣 ID: ${minister.user_id}`);
      console.log(`朝堂 ID: ${courtId}`);
    }

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
  }

  console.log('\n========== 创建完成 ==========\n');
}

createSampleLogs();
