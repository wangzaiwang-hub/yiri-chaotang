#!/bin/bash

echo "🚀 一日朝堂部署脚本"
echo ""

# 检查是否安装了必要的 CLI 工具
check_cli() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安装"
        echo "   安装命令: npm i -g $2"
        return 1
    else
        echo "✅ $1 已安装"
        return 0
    fi
}

echo "检查 CLI 工具..."
check_cli "railway" "@railway/cli"
RAILWAY_INSTALLED=$?

check_cli "vercel" "vercel"
VERCEL_INSTALLED=$?

echo ""

# 部署后端到 Railway
if [ $RAILWAY_INSTALLED -eq 0 ]; then
    echo "📦 部署后端到 Railway..."
    read -p "是否部署后端? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        echo "正在部署后端..."
        railway up
        echo "✅ 后端部署完成"
        echo "请在 Railway 控制台查看部署的 URL"
        cd ..
    fi
else
    echo "⚠️  跳过后端部署（Railway CLI 未安装）"
fi

echo ""

# 部署前端到 Vercel
if [ $VERCEL_INSTALLED -eq 0 ]; then
    echo "🎨 部署前端到 Vercel..."
    read -p "是否部署前端? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd frontend
        echo "正在部署前端..."
        vercel --prod
        echo "✅ 前端部署完成"
        cd ..
    fi
else
    echo "⚠️  跳过前端部署（Vercel CLI 未安装）"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📝 下一步操作："
echo "1. 在 Railway 控制台获取后端 URL"
echo "2. 在 Vercel 项目设置中添加环境变量 VITE_API_URL"
echo "3. 在 Railway 项目设置中更新 FRONTEND_URL"
echo "4. 在 SecondMe 开发者平台更新回调 URL"
echo "5. 在 Supabase 项目设置中添加允许的域名"
echo ""
echo "详细步骤请查看: docs/Vercel部署指南.md"
