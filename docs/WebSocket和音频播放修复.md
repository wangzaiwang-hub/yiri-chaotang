# WebSocket 和音频播放修复

## 问题

1. **WebSocket 连接失败**
   - 前端硬编码连接到 Railway 生产环境
   - 本地开发时无法连接
   - 错误：`WebSocket connection to 'wss://backend-production-a216.up.railway.app/ws' failed`

2. **音频自动播放被阻止**
   - 浏览器安全策略阻止自动播放
   - 错误：`NotAllowedError: The request is not allowed by the user agent`
   - 显示错误提示而不是友好提示

## 解决方案

### 1. WebSocket 连接修复

**修改前：**
```typescript
const wsUrl = 'wss://backend-production-a216.up.railway.app/ws';
```

**修改后：**
```typescript
// 使用环境变量中的 API URL，转换为 WebSocket URL
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';

console.log('🔌 WebSocket 连接地址:', wsUrl);
```

**效果：**
- ✅ 本地开发：连接到 `ws://192.168.110.169:3001/ws`
- ✅ 生产环境：连接到 `wss://your-domain.com/ws`
- ✅ 自动适配不同环境

### 2. 音频播放修复

**修改前：**
```typescript
console.error('🔊 播放被阻止:', playError);
showToast('点击播放按钮收听语音', 'error');
```

**修改后：**
```typescript
console.log('🔊 自动播放被浏览器阻止，显示手动播放按钮');
showToast('点击播放按钮收听语音', 'success');
```

**效果：**
- ✅ 不显示错误提示（这不是错误）
- ✅ 显示成功提示（正常流程）
- ✅ 用户知道需要手动点击播放

## 工作流程

### WebSocket 连接流程
```
1. 前端启动
   ↓
2. 读取 VITE_API_URL 环境变量
   ↓
3. 转换为 WebSocket URL
   - http://192.168.110.169:3001 → ws://192.168.110.169:3001/ws
   - https://domain.com → wss://domain.com/ws
   ↓
4. 连接到本地/远程后端
   ↓
5. 发送 join 消息加入朝堂
```

### 音频播放流程
```
1. 生成 TTS 语音
   ↓
2. 尝试自动播放
   ↓
3a. 成功 → 播放音频
   ↓
3b. 被阻止 → 显示播放按钮
    - 提示：点击播放按钮收听语音
    - 用户点击后手动播放
```

## 测试

### 本地测试
```bash
# 确保后端运行在 3001 端口
npm run dev  # 后端

# 前端会自动连接到本地 WebSocket
npm run dev  # 前端
```

### 检查 WebSocket 连接
打开浏览器控制台，应该看到：
```
🔌 WebSocket 连接地址: ws://192.168.110.169:3001/ws
🔌 WebSocket 已连接
```

### 检查音频播放
1. 点击任务执行
2. 生成语音后，应该看到：
   - 提示：点击播放按钮收听语音
   - 播放按钮可用
3. 点击播放按钮手动播放

## 环境变量

确保 `frontend/.env` 配置正确：
```
VITE_API_URL=http://192.168.110.169:3001
```

## 部署

### 本地开发
- 自动使用 `VITE_API_URL` 环境变量
- WebSocket 连接到本地后端

### 生产环境
- 更新 `frontend/.env.production`
- 设置正确的域名和 HTTPS
- WebSocket 自动转换为 WSS

## 相关文件

- `frontend/src/pages/Home.tsx` - WebSocket 连接和音频播放
- `frontend/.env` - 环境变量配置
- `backend/src/lib/websocket.ts` - WebSocket 服务器实现
