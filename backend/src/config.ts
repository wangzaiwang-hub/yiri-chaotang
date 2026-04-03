// 配置文件 - 必须在所有其他模块之前加载
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 验证必需的环境变量
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SECONDME_CLIENT_ID',
  'SECONDME_CLIENT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n请检查 backend/.env 文件是否正确配置');
  process.exit(1);
}

// 调试：显示配置信息（隐藏敏感信息）
console.log('✅ 环境变量加载成功');
console.log('📋 配置信息:');
console.log(`   SECONDME_CLIENT_ID: ${process.env.SECONDME_CLIENT_ID}`);
console.log(`   SECONDME_CLIENT_SECRET: ${process.env.SECONDME_CLIENT_SECRET?.slice(0, 10)}...${process.env.SECONDME_CLIENT_SECRET?.slice(-10)}`);
console.log(`   BASE_URL: ${process.env.BASE_URL}`);
console.log(`   回调 URL: ${process.env.BASE_URL}/api/auth/callback`);
