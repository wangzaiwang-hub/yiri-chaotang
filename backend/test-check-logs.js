#!/usr/bin/env node

/**
 * 检查日志系统是否正常工作
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

async function checkLogs() {
  console.log('\n========== 检查日志系统 ==========\n');

  try {
    // 1. 检查表是否存在
    console.log('📋 检查表结构...');
    const { data: tables, error: tablesError } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ emperor_sarcasm_logs 表不存在或无法访问:', tablesError.message);
      return;
    }
    console.log('✅ emperor_sarcasm_logs 表存在');

    // 2. 检查是否有日志数据
    console.log('\n📊 检查日志数据...');
    const { data: logs, error: logsError, count } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ 查询日志失败:', logsError.message);
      return;
    }

    console.log(`✅ 找到 ${count} 条日志记录`);
    
    if (logs && logs.length > 0) {
      console.log('\n最近的日志:');
      logs.forEach((log, index) => {
        console.log(`\n${index + 1}. ID: ${log.id}`);
        console.log(`   Court ID: ${log.court_id}`);
        console.log(`   User ID: ${log.user_id}`);
        console.log(`   类型: ${log.log_type}`);
        console.log(`   消息: ${log.log_message}`);
        console.log(`   已查看: ${log.viewed_by_minister ? '是' : '否'}`);
        console.log(`   创建时间: ${log.created_at}`);
      });

      // 3. 检查未查看的日志
      console.log('\n📬 检查未查看的日志...');
      const { data: unviewedLogs, error: unviewedError } = await supabase
        .from('emperor_sarcasm_logs')
        .select('*')
        .eq('viewed_by_minister', false)
        .order('created_at', { ascending: false });

      if (unviewedError) {
        console.error('❌ 查询未查看日志失败:', unviewedError.message);
        return;
      }

      console.log(`✅ 找到 ${unviewedLogs.length} 条未查看的日志`);
      
      if (unviewedLogs.length > 0) {
        console.log('\n未查看的日志:');
        unviewedLogs.forEach((log, index) => {
          console.log(`\n${index + 1}. Court ID: ${log.court_id}, User ID: ${log.user_id}`);
          console.log(`   消息: ${log.log_message}`);
        });
      }

      // 4. 检查函数是否存在
      console.log('\n🔧 检查 PL/pgSQL 函数...');
      const { data: funcResult, error: funcError } = await supabase.rpc('get_unviewed_logs', {
        p_court_id: logs[0].court_id,
        p_user_id: logs[0].user_id,
        p_limit: 10
      });

      if (funcError) {
        console.error('❌ get_unviewed_logs 函数调用失败:', funcError.message);
        console.log('   可能原因: 函数不存在或参数错误');
      } else {
        console.log('✅ get_unviewed_logs 函数正常工作');
        console.log(`   返回 ${funcResult ? funcResult.length : 0} 条日志`);
      }

    } else {
      console.log('\n⚠️ 数据库中没有日志数据');
      console.log('   请先创建一些测试日志');
    }

    // 5. 检查 minister_log_progress 表
    console.log('\n📈 检查日志进度表...');
    const { data: progress, error: progressError } = await supabase
      .from('minister_log_progress')
      .select('*')
      .limit(10);

    if (progressError) {
      console.error('❌ minister_log_progress 表查询失败:', progressError.message);
    } else {
      console.log(`✅ minister_log_progress 表存在，有 ${progress.length} 条记录`);
      if (progress.length > 0) {
        progress.forEach((p, index) => {
          console.log(`\n${index + 1}. Court ID: ${p.court_id}, User ID: ${p.user_id}`);
          console.log(`   未查看数量: ${p.unviewed_count}`);
          console.log(`   最后查看时间: ${p.last_viewed_at || '从未查看'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }

  console.log('\n========== 检查完成 ==========\n');
}

checkLogs();
