# TTS 语音功能

## 功能概述

朝堂系统集成了 SecondMe TTS（文本转语音）功能，当大臣回复任务时，系统会自动将回复内容转换为语音并播放。

## 功能特点

- **自动播放**: 大臣回复完成后，自动调用 TTS API 生成语音并播放
- **个性化语音**: 使用大臣在 SecondMe 中设置的个人语音
- **只针对大臣**: 只有大臣（太监）的回复才会播放语音，皇帝的不需要
- **Markdown 清理**: 自动清理回复中的 Markdown 格式，确保语音自然流畅

## 技术实现

### 后端 API

**路由**: `POST /api/tts/generate`

**请求参数**:
```json
{
  "text": "要转换的文本",
  "userId": "用户ID（大臣的ID）",
  "emotion": "fluent" // 可选：happy/sad/angry/fearful/disgusted/surprised/calm/fluent
}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "url": "https://cdn.example.com/tts/audio_12345.mp3",
    "durationMs": 2500,
    "sampleRate": 24000,
    "format": "mp3"
  }
}
```

### 前端实现

1. **TTS API 调用** (`frontend/src/services/api.ts`):
```typescript
export const ttsAPI = {
  generate: (text: string, userId: string, emotion: string = 'fluent') =>
    api.post('/tts/generate', { text, userId, emotion }),
};
```

2. **音频播放** (`frontend/src/pages/Home.tsx`):
```typescript
const playTTS = async (text: string, userId: string) => {
  // 清理 Markdown 格式
  const cleanText = cleanMarkdown(text);
  
  // 调用 TTS API
  const response = await ttsAPI.generate(cleanText, userId);
  
  // 播放音频
  const audio = new Audio(response.data.data.url);
  await audio.play();
};
```

3. **自动触发**: 在打字机效果完成后自动调用
```typescript
if (newTask.result && newTask.assignee_id) {
  playTTS(newTask.result, newTask.assignee_id);
}
```

## 使用前提

### 用户设置语音

大臣需要在 SecondMe 中设置个人语音：

1. 登录 SecondMe 应用
2. 进入个人设置
3. 设置语音克隆或选择预设语音
4. 完成设置后，朝堂系统会自动使用该语音

### 权限要求

- SecondMe OAuth2 需要包含 `voice` 权限
- 用户的 `secondme_access_token` 需要有效

## 错误处理

### 常见错误

1. **用户未设置语音**
   - 错误码: `tts.voice_id.not_set`
   - 解决方案: 引导用户在 SecondMe 中设置语音

2. **权限不足**
   - 错误码: `apikey.permission.denied`
   - 解决方案: 检查 OAuth2 权限配置

3. **文本过长**
   - 错误码: `tts.text.too_long`
   - 解决方案: 文本自动截断到 10000 字符

### 降级处理

如果 TTS 生成失败，系统会：
- 在控制台输出错误日志
- 继续正常显示文本内容
- 不影响其他功能的使用

## 测试

### 测试脚本

使用 `backend/test-tts.js` 测试 TTS 功能：

```bash
# 修改脚本中的 userId 为实际的大臣 ID
node backend/test-tts.js
```

### 手动测试

1. 创建朝堂并邀请好友加入（作为大臣）
2. 确保大臣已在 SecondMe 中设置语音
3. 皇帝发布任务给大臣
4. 大臣回复任务
5. 观察是否自动播放语音

## 未来优化

- [ ] 添加语音播放控制（暂停、继续、停止）
- [ ] 支持语音播放进度显示
- [ ] 支持多种情绪选择
- [ ] 添加语音缓存机制
- [ ] 支持语音播放速度调节

## 相关文档

- [SecondMe TTS API 文档](https://develop-docs.second.me/zh/docs/secondme/tts)
- [SecondMe OAuth2 文档](https://develop-docs.second.me/zh/docs/secondme/oauth2)
