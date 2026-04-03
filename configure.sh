#!/bin/bash

# 朝堂项目配置脚本
# 用于快速配置 Supabase 环境变量

echo "🎯 朝堂项目配置向导"
echo "===================="
echo ""

# 检查 backend/.env 是否存在
if [ ! -f "backend/.env" ]; then
    echo "❌ 错误：backend/.env 文件不存在"
    exit 1
fi

echo "📝 请按照以下步骤操作："
echo ""
echo "1. 访问 https://supabase.com 并登录"
echo "2. 创建新项目（如果还没有）"
echo "3. 执行 database/init.sql 初始化数据库"
echo "4. 进入 Settings > API 获取密钥"
echo ""

# 读取 Supabase URL
echo "请输入 Supabase Project URL:"
echo "（格式：https://xxxxx.supabase.co）"
read -p "> " SUPABASE_URL

# 读取 anon key
echo ""
echo "请输入 Supabase anon public key:"
echo "（以 eyJhbGc 开头的长字符串）"
read -p "> " SUPABASE_ANON_KEY

# 读取 service_role key
echo ""
echo "请输入 Supabase service_role key:"
echo "（以 eyJhbGc 开头的长字符串，注意保密）"
read -p "> " SUPABASE_SERVICE_KEY

# 验证输入
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo ""
    echo "❌ 错误：所有字段都必须填写"
    exit 1
fi

# 更新 .env 文件
echo ""
echo "📝 正在更新 backend/.env 文件..."

# 使用 sed 替换环境变量
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|g" backend/.env
    sed -i '' "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" backend/.env
    sed -i '' "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY|g" backend/.env
else
    # Linux
    sed -i "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|g" backend/.env
    sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" backend/.env
    sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY|g" backend/.env
fi

echo "✅ 配置已更新！"
echo ""
echo "🚀 下一步："
echo "1. 启动后端：cd backend && npm run dev"
echo "2. 访问前端：http://localhost:3000"
echo "3. 点击登录按钮测试"
echo ""
echo "📖 详细说明请查看 SUPABASE_SETUP.md"
