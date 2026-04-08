# TTS 配置引导优化

## 问题
用户未配置 TTS 时，直接报错会让用户误以为是服务问题。

## 解决方案
优化错误处理，显示友好的配置引导弹窗。

## 修改内容

### 1. 后端优化 (`backend/src/routes/tts.ts`)

#### 改进错误响应
```typescript
// 用户未授权时
{
  error: 'TTS_NOT_CONFIGURED',
  message: '该用户尚未配置语音功能',
  needsConfiguration: true
}

// SecondMe API 返回语音未配置错误时
{
  error: 'TTS_NOT_CONFIGURED',
  message: '该用户尚未在 SecondMe 配置语音功能',
  needsConfiguration: true,
  configUrl: 'https://second-me.cn/settings/voice'
}
```

### 2. 前端优化 (`frontend/src/pages/Home.tsx`)

#### 新增状态
```typescript
const [showTTSConfigModal, setShowTTSConfigModal] = useState(false);
const [ttsConfigUser, setTtsConfigUser] = useState<any>(null);
```

#### 错误处理逻辑
```typescript
// 检查是否是语音未配置错误
const errorData = error.response?.data;
if (errorData?.error === 'TTS_NOT_CONFIGURED' || errorData?.needsConfiguration) {
  // 显示配置引导弹窗
  const targetUser = ranking.find((m: any) => m.user_id === userId);
  setTtsConfigUser(targetUser);
  setShowTTSConfigModal(true);
} else {
  showToast('语音生成失败', 'error');
}
```

#### 配置引导弹窗
- 🎤 友好的图标和标题
- 📝 清晰的配置步骤说明
- 🔗 "前往配置"按钮（打开 SecondMe 设置页）
- ⏭️ "稍后再说"按钮

## 用户体验改进

### 修改前
```
❌ 语音生成失败
❌ TTS 生成失败
❌ 用户未授权或未设置语音
```
用户会认为是服务出错。

### 修改后
```
🎤 语音功能未配置

[用户名] 尚未在 SecondMe 配置语音功能

📝 配置步骤：
1. 前往 SecondMe 官网
2. 进入 个人设置
3. 找到 语音配置 选项
4. 选择并保存你的专属语音

[前往配置] [稍后再说]

💡 配置后即可使用语音播报功能
```

## 效果

1. ✅ 用户清楚知道是配置问题，不是服务问题
2. ✅ 提供明确的解决步骤
3. ✅ 一键跳转到配置页面
4. ✅ 不强制配置，可以稍后再说
5. ✅ 界面美观，符合朝堂风格

## 测试场景

1. 用户未登录 SecondMe → 显示配置引导
2. 用户已登录但未配置语音 → 显示配置引导
3. 用户已配置语音但 API 失败 → 显示"语音生成失败"
4. 用户已配置语音且成功 → 正常播放

## 部署

修改已完成，重启前端即可生效：
```bash
# 前端会自动热更新
# 如需手动重启：
cd frontend
npm run dev
```

后端也需要重启以应用新的错误处理逻辑。
