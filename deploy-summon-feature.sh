#!/bin/bash

# 部署召唤分身功能脚本

echo "=== 部署召唤分身功能 ==="
echo ""

# 1. 构建后端
echo "1. 构建后端代码..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 后端构建失败"
    exit 1
fi
echo "✅ 后端构建成功"
cd ..

# 2. 添加所有修改
echo ""
echo "2. 添加文件到 Git..."
git add backend/src/routes/courts.ts
git add backend/src/index.ts
git add frontend/src/services/api.ts
git add frontend/src/pages/Home.tsx
git add docs/召唤分身功能说明.md
git add 召唤分身功能完成.md
git add 召唤分身快速开始.md
git add 召唤分身UI预览.md
git add 部署召唤分身功能.md
git add backend/test-summon-bot.js
echo "✅ 文件已添加"

# 3. 提交
echo ""
echo "3. 提交代码..."
git commit -m "feat: 添加召唤分身功能

- 后端: 添加获取可用人机列表和召唤分身 API
- 前端: 添加召唤分身按钮和弹窗 UI
- 随机分配三省六部
- 完整的错误处理和用户反馈
- 详细的功能文档和测试脚本
"

if [ $? -ne 0 ]; then
    echo "❌ 提交失败"
    exit 1
fi
echo "✅ 代码已提交"

# 4. 推送
echo ""
echo "4. 推送到远程仓库..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ 推送失败"
    exit 1
fi
echo "✅ 代码已推送"

echo ""
echo "=== 部署完成 ==="
echo ""
echo "接下来："
echo "1. 访问 Railway Dashboard 查看部署状态"
echo "2. 等待 2-5 分钟让 Railway 完成部署"
echo "3. 刷新前端页面测试功能"
echo ""
echo "Railway Dashboard: https://railway.app"
echo ""
