#!/bin/bash

echo "🔍 一日朝堂部署前检查"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASS=0
FAIL=0
WARN=0

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "📦 检查项目文件..."

# 检查必要的文件
if [ -f "backend/package.json" ]; then
    check_pass "后端 package.json 存在"
else
    check_fail "后端 package.json 不存在"
fi

if [ -f "frontend/package.json" ]; then
    check_pass "前端 package.json 存在"
else
    check_fail "前端 package.json 不存在"
fi

if [ -f "backend/.env.example" ]; then
    check_pass "后端环境变量示例文件存在"
else
    check_warn "后端环境变量示例文件不存在"
fi

if [ -f "frontend/.env.example" ]; then
    check_pass "前端环境变量示例文件存在"
else
    check_warn "前端环境变量示例文件不存在"
fi

echo ""
echo "🔧 检查配置文件..."

if [ -f "backend/vercel.json" ]; then
    check_pass "后端 Vercel 配置存在"
else
    check_warn "后端 Vercel 配置不存在（如果使用 Railway 可忽略）"
fi

if [ -f "frontend/vercel.json" ]; then
    check_pass "前端 Vercel 配置存在"
else
    check_fail "前端 Vercel 配置不存在"
fi

if [ -f "backend/railway.toml" ]; then
    check_pass "后端 Railway 配置存在"
else
    check_warn "后端 Railway 配置不存在（如果使用 Vercel 可忽略）"
fi

echo ""
echo "📝 检查文档..."

if [ -f "docs/Vercel部署指南.md" ]; then
    check_pass "部署指南文档存在"
else
    check_fail "部署指南文档不存在"
fi

if [ -f "docs/部署步骤清单.md" ]; then
    check_pass "部署步骤清单存在"
else
    check_warn "部署步骤清单不存在"
fi

echo ""
echo "🔨 检查构建..."

# 检查后端构建
echo "检查后端构建..."
cd backend
if npm run build > /dev/null 2>&1; then
    check_pass "后端构建成功"
else
    check_fail "后端构建失败"
fi
cd ..

# 检查前端构建
echo "检查前端构建..."
cd frontend
if npm run build > /dev/null 2>&1; then
    check_pass "前端构建成功"
else
    check_fail "前端构建失败"
fi
cd ..

echo ""
echo "📊 检查结果："
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${YELLOW}警告: $WARN${NC}"
echo -e "${RED}失败: $FAIL${NC}"

echo ""
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有关键检查通过，可以开始部署！${NC}"
    echo ""
    echo "下一步："
    echo "1. 运行 ./deploy.sh 开始部署"
    echo "2. 或查看 docs/部署步骤清单.md 手动部署"
    exit 0
else
    echo -e "${RED}✗ 有 $FAIL 项检查失败，请修复后再部署${NC}"
    exit 1
fi
