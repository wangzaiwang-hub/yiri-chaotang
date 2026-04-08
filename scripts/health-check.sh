#!/bin/bash

echo "🏥 一日朝堂健康检查"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 读取配置
read -p "请输入后端 URL (如: https://xxx.up.railway.app): " BACKEND_URL
read -p "请输入前端 URL (如: https://xxx.vercel.app): " FRONTEND_URL

echo ""
echo "开始检查..."
echo ""

# 检查后端健康
echo "🔍 检查后端健康状态..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓${NC} 后端健康检查通过 (HTTP $BACKEND_HEALTH)"
else
    echo -e "${RED}✗${NC} 后端健康检查失败 (HTTP $BACKEND_HEALTH)"
fi

# 检查前端
echo "🔍 检查前端页面..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} 前端页面可访问 (HTTP $FRONTEND_STATUS)"
else
    echo -e "${RED}✗${NC} 前端页面无法访问 (HTTP $FRONTEND_STATUS)"
fi

# 检查 API 端点
echo "🔍 检查 API 端点..."

# 检查认证端点
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/me")
if [ "$AUTH_STATUS" = "401" ] || [ "$AUTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} 认证端点正常 (HTTP $AUTH_STATUS)"
else
    echo -e "${RED}✗${NC} 认证端点异常 (HTTP $AUTH_STATUS)"
fi

# 检查 CORS
echo "🔍 检查 CORS 配置..."
CORS_HEADER=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" | grep -i "access-control-allow-origin")

if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓${NC} CORS 配置正常"
    echo "   $CORS_HEADER"
else
    echo -e "${YELLOW}⚠${NC} CORS 配置可能有问题"
fi

# 检查 SSL 证书
echo "🔍 检查 SSL 证书..."

if [[ $BACKEND_URL == https://* ]]; then
    BACKEND_SSL=$(curl -s -o /dev/null -w "%{ssl_verify_result}" "$BACKEND_URL")
    if [ "$BACKEND_SSL" = "0" ]; then
        echo -e "${GREEN}✓${NC} 后端 SSL 证书有效"
    else
        echo -e "${RED}✗${NC} 后端 SSL 证书无效"
    fi
fi

if [[ $FRONTEND_URL == https://* ]]; then
    FRONTEND_SSL=$(curl -s -o /dev/null -w "%{ssl_verify_result}" "$FRONTEND_URL")
    if [ "$FRONTEND_SSL" = "0" ]; then
        echo -e "${GREEN}✓${NC} 前端 SSL 证书有效"
    else
        echo -e "${RED}✗${NC} 前端 SSL 证书无效"
    fi
fi

echo ""
echo "📊 检查完成！"
echo ""
echo "💡 提示："
echo "- 如果后端健康检查失败，请检查 Railway 部署日志"
echo "- 如果前端无法访问，请检查 Vercel 部署状态"
echo "- 如果 CORS 有问题，请检查后端的 FRONTEND_URL 环境变量"
echo "- 完整测试请在浏览器中访问前端 URL 并尝试登录"
