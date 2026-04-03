# Supabase 配置指南

## 🚀 快速配置 Supabase（5分钟）

### 步骤 1：创建 Supabase 项目

1. 访问：https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（推荐）或邮箱注册
4. 点击 "New Project"
5. 填写项目信息：
   ```
   Name: chaotang（或任意名称）
   Database Password: 设置一个强密码（记住它）
   Region: Northeast Asia (Seoul) - 选择离你最近的
   Pricing Plan: Free（免费版足够）
   ```
6. 点击 "Create new project"
7. 等待 1-2 分钟，项目创建完成

### 步骤 2：初始化数据库

1. 在 Supabase 项目页面，点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 打开项目中的 `database/init.sql` 文件
4. 复制全部内容（约 200 行）
5. 粘贴到 Supabase SQL Editor
6. 点击右下角 "Run" 按钮
7. 看到 "Success. No rows returned" 表示成功

### 步骤 3：获取 API 密钥

1. 点击左侧 "Settings" (齿轮图标)
2. 点击 "API"
3. 在 "Project API keys" 部分，你会看到：

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon public (公开密钥):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```
   
   **service_role (服务密钥，保密):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

4. 复制这三个值

### 步骤 4：配置环境变量

编辑 `backend/.env` 文件，替换以下内容：

```env
# 替换这三行
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 anon key）
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 service_role key）
```

### 步骤 5：重启后端服务

```bash
# 停止当前运行的后端（如果有）
# 按 Ctrl+C

# 重新启动
cd backend
npm run dev
```

### 步骤 6：验证配置

1. 后端应该成功启动，看到：
   ```
   Server running on port 3001
   Environment: development
   Daily settlement job started
   ```

2. 访问：http://localhost:3001/health
   应该看到：`{"status":"ok","timestamp":"..."}`

3. 刷新前端页面：http://localhost:3000
4. 点击"使用 SecondMe 登录"
5. 应该会跳转到 SecondMe 授权页面

---

## ✅ 配置完成检查清单

- [ ] Supabase 项目已创建
- [ ] 数据库表已初始化（执行了 init.sql）
- [ ] 获取了 Project URL
- [ ] 获取了 anon public key
- [ ] 获取了 service_role key
- [ ] 更新了 backend/.env 文件
- [ ] 后端服务成功启动
- [ ] 访问 /health 返回正常
- [ ] 前端可以跳转到 SecondMe 登录

---

## 🆘 常见问题

### Q: Supabase 注册需要信用卡吗？
A: 不需要，免费版不需要信用卡

### Q: 数据库初始化失败？
A: 确保复制了完整的 SQL 内容，包括最后一行

### Q: 后端还是启动失败？
A: 检查 .env 文件中的密钥是否完整复制，不要有换行

### Q: 密钥太长了，怎么复制？
A: 在 Supabase 页面，点击密钥右侧的复制图标

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. backend/.env 文件内容（隐藏密钥）
3. 后端启动日志
