# Vercel 部署指南

## ⚠️ 重要提示

Vercel 的 Serverless Functions 不支持 WebSocket 长连接。本项目使用 WebSocket 进行实时通信，因此需要：

1. **推荐方案**：将后端部署到支持 WebSocket 的平台（Railway、Render、Fly.io），前端部署到 Vercel
2. **备选方案**：修改代码使用轮询代替 WebSocket（需要改动较大）

本指南提供两种部署方案。

## 前置准备

1. 注册 Vercel 账号：https://vercel.com
2. 注册 Railway 账号（用于后端）：https://railway.app
3. 安装 Vercel CLI（可选）：`npm i -g vercel`
4. 准备好 Supabase 数据库（已有）
5. 准备好 SecondMe API 密钥（已有）

## 部署步骤

### 方案一：Railway（后端）+ Vercel（前端）【推荐】

#### 1. 部署后端到 Railway

**Railway 支持 WebSocket，非常适合我们的后端。**

1. 访问 https://railway.app
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. 配置：
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. 添加环境变量（见下方）
6. 点击 Deploy

**后端环境变量配置：**

在 Railway 项目设置中添加以下环境变量：

```
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务密钥

# SecondMe
SECONDME_CLIENT_ID=你的SecondMe客户端ID
SECONDME_CLIENT_SECRET=你的SecondMe客户端密钥
SECONDME_API_KEY=你的SecondMe API密钥

# 应用URL（部署后更新）
BASE_URL=https://你的项目名.up.railway.app
FRONTEND_URL=https://你的前端域名.vercel.app
```

**获取后端 URL：**
- 部署完成后，Railway 会提供一个域名，类似：`https://your-project.up.railway.app`
- 记下这个 URL，后面配置前端时需要用到

#### 2. 部署前端到 Vercel

**通过 Vercel 网站部署：**

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. 配置：
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 添加环境变量：
   ```
   VITE_API_URL=https://你的Railway后端域名.up.railway.app
   ```
5. 点击 Deploy

**通过 CLI 部署：**

```bash
cd frontend
vercel --prod
```

#### 3. 更新配置

部署完成后，需要更新以下配置：

1. **更新 Railway 后端的 FRONTEND_URL**：
   - 在 Railway 项目设置中，将 `FRONTEND_URL` 更新为 Vercel 提供的前端域名
   - 重新部署后端

2. **更新 SecondMe 回调 URL**：
   - 在 SecondMe 开发者平台更新回调 URL 为：`https://你的Railway域名.up.railway.app/api/auth/callback`

3. **更新 Supabase 允许的域名**：
   - 在 Supabase 项目设置 → Authentication → URL Configuration
   - 添加前端域名到 Site URL 和 Redirect URLs

### 方案二：纯 Vercel 部署（需要修改代码）

如果坚持使用 Vercel，需要移除 WebSocket 功能：

1. 修改 `backend/src/index.ts`，注释掉 WebSocket 相关代码
2. 修改前端，移除 WebSocket 连接逻辑
3. 使用轮询或 Server-Sent Events (SSE) 代替实时通信

**不推荐此方案**，因为需要大量代码修改。

## 快速部署命令

### 使用 Railway CLI 部署后端

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 进入后端目录
cd backend

# 初始化项目
railway init

# 添加环境变量（或在网页端添加）
railway variables set NODE_ENV=production
railway variables set PORT=3001
# ... 添加其他环境变量

# 部署
railway up
```

### 使用 Vercel CLI 部署前端

```bash
# 进入前端目录
cd frontend

# 登录 Vercel
vercel login

# 部署
vercel --prod

# 添加环境变量
vercel env add VITE_API_URL production
```

## 常见问题

### 1. WebSocket 连接失败

Vercel 的 Serverless Functions 不支持长连接 WebSocket。解决方案：

- 使用 Vercel 的 Edge Functions（实验性）
- 或者将 WebSocket 服务部署到其他平台（如 Railway、Render）
- 或者使用轮询代替 WebSocket

### 2. 文件上传/下载问题

Vercel Serverless Functions 有以下限制：

- 请求体大小限制：4.5MB
- 响应大小限制：4.5MB
- 执行时间限制：10秒（Hobby）/ 60秒（Pro）

解决方案：

- 使用 Supabase Storage 存储文件
- 或使用 Cloudinary、AWS S3 等第三方存储

### 3. 环境变量不生效

- 确保在 Vercel 项目设置中正确配置了所有环境变量
- 重新部署项目使环境变量生效
- 检查变量名是否正确（前端变量必须以 `VITE_` 开头）

### 4. 构建失败

检查：

- `package.json` 中的依赖是否完整
- TypeScript 编译是否通过：`npm run build`
- Node.js 版本是否兼容（Vercel 默认使用 Node 18）

### 5. CORS 错误

在后端 `src/index.ts` 中确保 CORS 配置正确：

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## 部署后检查清单

- [ ] 后端 API 可以访问：`https://你的后端域名.vercel.app/api/health`
- [ ] 前端页面可以打开：`https://你的前端域名.vercel.app`
- [ ] SecondMe OAuth 登录正常
- [ ] 数据库连接正常
- [ ] 创建朝堂功能正常
- [ ] 发布任务功能正常
- [ ] 文件上传/下载正常（如果使用）

## 性能优化建议

1. **启用 Vercel Analytics**：监控性能和用户行为
2. **配置 CDN 缓存**：为静态资源配置合适的缓存策略
3. **使用 Edge Functions**：将部分 API 部署到边缘节点
4. **优化图片**：使用 Vercel Image Optimization
5. **代码分割**：确保前端使用了代码分割和懒加载

## 自定义域名

1. 在 Vercel 项目设置中添加自定义域名
2. 在域名提供商处添加 DNS 记录：
   - 类型：CNAME
   - 名称：@ 或 www
   - 值：cname.vercel-dns.com
3. 等待 DNS 生效（通常几分钟到几小时）
4. Vercel 会自动配置 SSL 证书

## 监控和日志

- 在 Vercel 项目页面查看部署日志
- 使用 Vercel Analytics 查看性能数据
- 使用 Vercel Logs 查看运行时日志
- 配置 Sentry 或其他错误追踪服务

## 成本估算

**Vercel Hobby Plan（免费）：**
- 100GB 带宽/月
- 100 次构建/天
- 无限项目
- 适合个人项目和小型应用

**Vercel Pro Plan（$20/月）：**
- 1TB 带宽/月
- 6000 次构建/月
- 更长的执行时间
- 适合生产环境

## 备选方案

如果 Vercel 不满足需求，可以考虑：

1. **Railway**：支持 WebSocket，更适合全栈应用
2. **Render**：免费套餐支持 WebSocket
3. **Fly.io**：支持 WebSocket，全球部署
4. **Netlify**：类似 Vercel，但有不同的限制
5. **AWS Amplify**：AWS 的全栈部署方案

## 参考资源

- Vercel 文档：https://vercel.com/docs
- Vite 部署指南：https://vitejs.dev/guide/static-deploy.html
- Node.js on Vercel：https://vercel.com/docs/runtimes#official-runtimes/node-js
