# 朝堂 · 一日帝王

> 基于 SecondMe API 的虚拟分身权力游戏

## 项目简介

朝堂是一款创新的社交游戏，通过 SecondMe 虚拟分身技术，让好友之间体验"今日你压榨我的分身，明日我的分身当皇帝"的权力游戏。真人不动手，虚拟分身执行所有任务，每日自动结算，怨气最高者登基为帝。

## 核心特性

- ✅ SecondMe OAuth2 认证登录
- ✅ 创建朝堂（4-10人小组）
- ✅ 皇帝发布任务（圣旨）
- ✅ 虚拟分身执行任务（SSE 流式响应）
- ✅ 皇帝审批成果（通过/打回）
- ✅ 怨气值累计与排行榜
- ✅ 每日自动结算与皇帝轮换
- ✅ 虚拟朋友圈惩罚系统

## 技术栈

### 后端
- Node.js 20+ + TypeScript
- Express.js
- Supabase (PostgreSQL)
- SecondMe API
- OpenAI GPT-4 (可选)

### 前端
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js 20+
- npm 或 yarn

### 2. 克隆项目

```bash
git clone <repository-url>
cd 一日朝堂
```

### 3. 配置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 执行数据库初始化脚本（见 `database/init.sql`）
3. 获取 API Keys

### 4. 配置 SecondMe

1. 访问 [SecondMe Developer Console](https://develop.second-me.cn/integrations/list)
2. 创建 OAuth2 应用
3. 配置回调 URL：`http://localhost:3001/api/auth/callback`
4. 获取 Client ID 和 Client Secret

### 5. 后端配置

```bash
cd backend
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=...
# SECONDME_CLIENT_ID=...
# SECONDME_CLIENT_SECRET=...
```

### 6. 前端配置

```bash
cd frontend
npm install
```

### 7. 启动开发服务器

```bash
# 终端 1：启动后端
cd backend
npm run dev

# 终端 2：启动前端
cd frontend
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
一日朝堂/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑（含工具系统和MCP集成）
│   │   ├── jobs/           # 定时任务
│   │   ├── lib/            # 工具库
│   │   └── index.ts        # 入口文件
│   ├── outputs/            # 工具生成的文件
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── stores/         # 状态管理
│   │   ├── services/       # API 服务
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── database/                # 数据库脚本
│   └── init.sql
└── docs/                    # 文档
    ├── 朝堂 PRD.md
    ├── 朝堂-MVP开发文档.md
    ├── 三省六部架构设计.md
    ├── 三省六部实施指南.md
    ├── 工具系统使用指南.md
    ├── MCP集成指南.md
    ├── MCP服务器目录.md
    ├── 准奏补充说明功能.md
    └── 更多...
```

## 📚 文档导航

### 🚀 快速开始
- [从这里开始](docs/从这里开始.md) - 新手入门指南
- [快速开始](docs/快速开始.md) - 快速部署指南
- [设置指南](docs/设置指南.md) - 详细配置说明
- [MCP快速开始](docs/MCP快速开始.md) - MCP 功能快速上手

### 📖 核心文档
- [朝堂 PRD](docs/朝堂%20PRD.md) - 产品需求文档
- [MVP开发文档](docs/朝堂-MVP开发文档.md) - 最小可行产品开发指南
- [三省六部架构设计](docs/三省六部架构设计.md) - 系统架构设计
- [三省六部实施指南](docs/三省六部实施指南.md) - 实施步骤
- [三省六部快速开始](docs/三省六部快速开始.md) - 三省六部功能指南

### 🛠️ 功能文档
- [工具系统使用指南](docs/工具系统使用指南.md) - 虚拟人工具调用系统
- [工具系统总结](docs/工具系统总结.md) - 工具系统实现总结
- [MCP集成指南](docs/MCP集成指南.md) - Model Context Protocol 集成
- [MCP集成总结](docs/MCP集成总结.md) - MCP 集成实现总结
- [MCP服务器目录](docs/MCP服务器目录.md) - 可用的 MCP 服务器列表
- [天气MCP使用指南](docs/天气MCP使用指南.md) - 天气查询功能
- [准奏补充说明功能](docs/准奏补充说明功能.md) - 审批系统增强功能
- [审批系统实现](docs/审批系统实现.md) - 审批系统技术实现
- [审批系统设置](docs/审批系统设置.md) - 审批系统配置

### 🔧 技术文档
- [Supabase设置指南](docs/Supabase设置指南.md) - 数据库配置
- [SecondMe API测试](docs/SecondMe_API测试.md) - API 测试方法
- [项目结构说明](docs/项目结构说明.md) - 代码结构详解
- [项目总结](docs/项目总结.md) - 项目开发总结

### 📋 运维文档
- [Vercel部署指南](docs/Vercel部署指南.md) - 完整的部署流程和配置
- [部署步骤清单](docs/部署步骤清单.md) - 逐步检查清单
- [部署检查清单](docs/部署检查清单.md) - 部署前检查事项
- [当前状态](docs/当前状态.md) - 项目当前状态
- [成功部署](docs/成功部署.md) - 部署成功标志

## API 文档

### 认证相关

```
GET  /api/auth/secondme/login    # 发起 SecondMe OAuth2 授权
GET  /api/auth/callback          # OAuth2 回调处理
POST /api/auth/refresh           # 刷新 Access Token
GET  /api/auth/me                # 获取当前用户信息
```

### 朝堂管理

```
POST   /api/courts               # 创建朝堂
GET    /api/courts               # 获取朝堂列表
GET    /api/courts/:id           # 获取朝堂详情
GET    /api/courts/:id/members   # 获取成员列表
GET    /api/courts/:id/ranking   # 获取怨气排行榜
```

### 任务管理

```
POST   /api/tasks                # 发布任务
GET    /api/tasks                # 获取任务列表
GET    /api/tasks/:id            # 获取任务详情
POST   /api/tasks/:id/execute    # 执行任务（SSE 流式）
POST   /api/tasks/:id/approve    # 批准任务
POST   /api/tasks/:id/reject     # 打回任务
```

## 部署

详细部署指南请查看：
- [Vercel 部署指南](docs/Vercel部署指南.md) - 完整的部署流程和配置说明
- [部署步骤清单](docs/部署步骤清单.md) - 逐步检查清单

### 快速部署

推荐方案：Railway（后端）+ Vercel（前端）

#### 方法一：使用部署脚本（推荐）

```bash
# 1. 检查部署前准备
./check-deploy.sh

# 2. 一键部署
./deploy.sh

# 3. 部署后健康检查
./health-check.sh
```

#### 方法二：手动部署

#### 1. 部署后端到 Railway

Railway 支持 WebSocket，非常适合我们的实时通信需求。

```bash
# 使用 Railway CLI
cd backend
railway login
railway init
railway up
```

或通过网页部署：
1. 访问 https://railway.app
2. 选择 "Deploy from GitHub repo"
3. 选择 `backend` 目录
4. 配置环境变量
5. 部署

#### 2. 部署前端到 Vercel

```bash
# 使用 Vercel CLI
cd frontend
vercel login
vercel --prod
```

或通过网页部署：
1. 访问 https://vercel.com/new
2. 选择你的仓库
3. Root Directory: `frontend`
4. Framework: `Vite`
5. 添加环境变量 `VITE_API_URL`
6. 部署

#### 3. 一键部署脚本

```bash
# 使用提供的部署脚本
./deploy.sh
```

### 环境变量配置

#### 后端环境变量（Railway）

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务密钥
SECONDME_CLIENT_ID=你的SecondMe客户端ID
SECONDME_CLIENT_SECRET=你的SecondMe客户端密钥
SECONDME_API_KEY=你的SecondMe API密钥
BASE_URL=https://你的项目名.up.railway.app
FRONTEND_URL=https://你的前端域名.vercel.app
```

#### 前端环境变量（Vercel）

```env
VITE_API_URL=https://你的Railway后端域名.up.railway.app
```

### 部署后配置

1. 更新 SecondMe 回调 URL：`https://你的Railway域名.up.railway.app/api/auth/callback`
2. 在 Supabase 添加允许的域名
3. 测试所有功能是否正常

## 开发计划

- [x] 基础架构搭建
- [x] SecondMe OAuth2 集成
- [x] 朝堂管理功能
- [x] 任务发布与执行
- [x] 怨气值系统
- [x] 每日结算定时任务
- [ ] 虚拟惩罚生成（GPT-4 + DALL-E）
- [ ] 复仇系统完善
- [ ] 实时通知推送
- [ ] 移动端适配

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。

---

*朝堂 · 一日帝王 - 让虚拟分身替你打工！*
