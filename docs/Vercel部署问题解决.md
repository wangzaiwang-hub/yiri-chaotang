# Vercel 部署 404 问题解决

## 问题描述
访问 Vercel 部署的前端时出现 404 错误。

## 已修复
✅ 更新了 `frontend/vercel.json` 配置文件
✅ 代码已推送到 GitHub

## 解决步骤

### 方案一：在 Vercel 重新部署（推荐）

1. **访问 Vercel 项目**
   - 打开 https://vercel.com/dashboard
   - 找到你的 `yiri-chaotang` 项目

2. **触发重新部署**
   - 点击项目进入详情页
   - 点击 "Deployments" 标签
   - 点击最新的部署
   - 点击右上角的 "Redeploy" 按钮
   - 选择 "Redeploy"（不要选择 "Redeploy with existing Build Cache"）

3. **等待部署完成**
   - 等待几分钟
   - 部署成功后访问你的域名

### 方案二：检查 Vercel 配置

如果重新部署还是 404，检查以下配置：

1. **检查 Root Directory**
   - 进入项目 Settings
   - 确认 "Root Directory" 设置为 `frontend`
   - 如果不是，修改后保存

2. **检查 Framework Preset**
   - 在 Settings → General 中
   - Framework Preset 应该是 `Vite` 或 `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **检查环境变量**
   - 进入 Settings → Environment Variables
   - 确认有 `VITE_API_URL` 变量
   - 值应该是你的 Railway 后端地址
   - 例如：`https://yiri-chaotang-production.up.railway.app`

### 方案三：从头重新部署

如果以上方法都不行，删除项目重新部署：

1. **删除现有项目**
   - 在 Vercel 项目设置中
   - 滚动到底部
   - 点击 "Delete Project"

2. **重新导入**
   - 访问 https://vercel.com/new
   - 选择 `wangzaiwang-hub/yiri-chaotang`
   - 配置：
     ```
     Root Directory: frontend
     Framework Preset: Vite
     Build Command: npm run build
     Output Directory: dist
     ```
   - 添加环境变量：
     ```
     VITE_API_URL=https://你的Railway域名.up.railway.app
     ```
   - 点击 Deploy

## 验证部署成功

部署成功后，你应该能看到：

1. **访问首页**
   - 打开 `https://你的域名.vercel.app`
   - 应该看到登录页面（不是 404）

2. **检查控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签
   - 不应该有 404 错误

3. **测试 API 连接**
   - 在 Console 中输入：
     ```javascript
     console.log(import.meta.env.VITE_API_URL)
     ```
   - 应该显示你的 Railway 后端地址

## 常见问题

### Q: 部署成功但页面空白
A: 检查浏览器控制台是否有 JavaScript 错误

### Q: 登录按钮点击没反应
A: 检查 `VITE_API_URL` 环境变量是否正确配置

### Q: 显示 "Failed to fetch"
A: 检查后端是否正常运行，访问 `https://你的Railway域名.up.railway.app/health`

### Q: 路由跳转后刷新页面 404
A: 这是正常的，`vercel.json` 已经配置了 SPA 路由重定向

## 检查后端是否正常

在修复前端之前，先确认后端是否正常：

```bash
# 检查后端健康状态
curl https://你的Railway域名.up.railway.app/health

# 应该返回：
# {"status":"ok","timestamp":"2024-..."}
```

如果后端也有问题，先修复后端。

## 需要帮助？

如果还是无法解决，请提供：
1. Vercel 部署日志（Deployments → 点击部署 → 查看 Build Logs）
2. 浏览器控制台的错误信息
3. 访问的 URL

我会帮你进一步排查！
