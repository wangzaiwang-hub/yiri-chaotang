#!/usr/bin/env node

/**
 * 测试日志 API 是否正常工作
 */

const axios = require('axios');

// 使用你的 API URL
const API_BASE_URL = 'https://backend-production-a216.up.railway.app/api';

// 使用 "aaa" 朝堂的数据
const COURT_ID = '88526e62-8c31-469c-8114-fccf49155410';
const MINISTER_ID = '7b0b3f51-c3cd-4482-ae0f-0c29373c6d2f'; // 第一个大臣

async function testLogsAPI() {
  console.log('\n========== 测试日志 API ==========\n');

  try {
    // 1. 测试获取未查看日志
    console.log('📡 测试 GET /api/logs/unviewed/:courtId/:userId');
    console.log(`   Court ID: ${COURT_ID}`);
    console.log(`   User ID: ${MINISTER_ID}`);
    
    const url = `${API_BASE_URL}/logs/unviewed/${COURT_ID}/${MINISTER_ID}`;
    console.log(`   URL: ${url}\n`);

    const response = await axios.get(url);

    console.log('✅ API 响应成功');
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应数据:`, JSON.stringify(response.data, null, 2));

    if (response.data.unviewedLogs && response.data.unviewedLogs.length > 0) {
      console.log(`\n✅ 找到 ${response.data.unviewedLogs.length} 条未查看的日志`);
      console.log('\n日志内容:');
      response.data.unviewedLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.log_type}`);
        console.log(`   消息: ${log.log_message}`);
        console.log(`   创建时间: ${log.created_at}`);
      });
    } else {
      console.log('\n⚠️ 没有未查看的日志');
    }

  } catch (error) {
    console.error('\n❌ API 请求失败');
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   错误信息:`, error.response.data);
    } else {
      console.error(`   错误:`, error.message);
    }
  }

  console.log('\n========== 测试完成 ==========\n');
}

testLogsAPI();
