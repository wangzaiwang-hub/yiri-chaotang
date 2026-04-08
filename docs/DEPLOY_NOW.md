# 立即部署指南

## 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`yiri-chaotang` 或 `一日朝堂`
3. 选择 Public 或 Private
4. 不要勾选任何初始化选项（README、.gitignore、license）
5. 点击 "Create repository"

## 第二步：推送代码到 GitHub

创建仓库后，GitHub 会显示推送命令，类似：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

或者使用 SSH（如果已配置）：

```bash
git remote add origin git@github.com:你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 第三步：部署后端到 Railway

1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择刚才创建的仓库
5. 点击 "Add variables" 添加环境变量：

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务密钥
SECONDME_CLIENT_ID=你的SecondMe客户端ID
SECONDME_CLIENT_SECRET=你的SecondMe客户端密钥
SECONDME_API_KEY=你的SecondMe API密钥
BASE_URL=https://xxx.up.railway.app
FRONTEND_URL=https://xxx.vercel.app
```

6. 在 Settings 中设置：
   - Root Directory: `backend`
7. 点击 "Deploy"
8. 部署完成后，记录 Railway 提供的域名

## 第四步：部署前端到 Vercel

1. 访问 https://vercel.com/new
2. 导入刚才的 GitHub 仓库
3. 配置：
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 添加环境变量：
   ```
   VITE_API_URL=https://你的Railway域名.up.railway.app
   ```
5. 点击 "Deploy"
6. 部署完成后，记录 Vercel 提供的域名

## 第五步：更新配置

### 5.1 更新 Railway 环境变量

回到 Railway 项目，更新：
- `BASE_URL`: 改为实际的 Railway 域名
- `FRONTEND_URL`: 改为实际的 Vercel 域名

### 5.2 更新 SecondMe 回调 URL

访问 SecondMe 开发者平台，更新回调 URL：
```
https://你的Railway域名.up.railway.app/api/auth/callback
```

### 5.3 更新 Supabase 配置

在 Supabase 项目设置 → Authentication → URL Configuration：
- Site URL: `https://你的Vercel域名.vercel.app`
- Redirect URLs: 添加 `https://你的Vercel域名.vercel.app/**`

## 第六步：测试

1. 访问前端 URL
2. 点击登录
3. 完成 SecondMe 授权
4. 创建朝堂
5. 测试功能

## 完成！

你的"一日朝堂"已经部署成功！

## 需要的信息

请准备好以下信息：

- [ ] GitHub 用户名
- [ ] 新仓库的名称
- [ ] Supabase URL 和密钥
- [ ] SecondMe Client ID、Secret 和 API Key

## 遇到问题？

查看详细文档：
- `docs/快速部署.md`
- `docs/Vercel部署指南.md`
- `docs/部署步骤清单.md`
