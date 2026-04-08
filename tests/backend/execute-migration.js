#!/usr/bin/env node

/**
 * 执行皇帝毒舌日志系统的数据库迁移
 * 使用 PostgreSQL 客户端直接连接
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 从 Supabase URL 解析连接信息
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误：缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// 从 Supabase URL 提取项目 ID
const projectId = supabaseUrl.split('//')[1].split('.')[0];

// PostgreSQL 连接字符串
const connectionString = `postgresql://postgres.${projectId}:[PASSWORD]@aws-0-${process.env.REGION || 'us-east-1'}.pooler.supabase.com:6543/postgres`;

console.log('📝 注意：需要手动在 Supabase 控制台执行 SQL');
console.log('📍 访问：https://supabase.com/dashboard/project/' + projectId + '/sql/new');
console.log('\n📋 请复制以下 SQL 并在 Supabase SQL 编辑器中执行：\n');

// 读取 SQL 文件
const sqlFile = path.join(__dirname, '..', 'database', 'add_emperor_sarcasm_logs.sql');
const sql = fs.readFileSync(sqlFile, 'utf-8');

console.log(sql);

console.log('\n✅ 复制上面的 SQL 到 Supabase 控制台执行');
