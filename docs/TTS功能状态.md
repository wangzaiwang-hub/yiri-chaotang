# TTS 语音功能状态报告

## 当前实现状态

TTS（文本转语音）功能已经完整实现，包括：

### ✅ 后端实现
- **路由**: `backend/src/routes/tts.ts`
- **API端点**: `POST /api/tts/generate`
- **功能**: 
  - 接收文本、用户ID和情绪参数
  - 从数据库获取用户的 SecondMe access_token
  - 调用 SecondMe TTS API 生成语音
  - 返回音频URL

### ✅ 前端实现
- **API调用**: `frontend/src/services/api.ts` 中的 `ttsAPI.generate()`
- **播放函数**: `frontend/src/pages/Home.tsx` 中的 `playTTS()`
- **自动触发**: 大臣回复任务后，打字机效果完成时自动播放
- **功能**:
  - 清理Markdown格式和工具调用标记
  - 调用TTS API生成语音
  - 创建Audio元素播放
  - 显示播放状态指示器
  - 错误处理和Toast提示

## 使用前提

### 1. 用户必须在 SecondMe 中设置语音
- 登录 SecondMe 应用
- 进入个人设置
- 设置语音克隆或选择预设语音

### 2. OAuth2 权限配置
当前配置的权限范围：
```
scope=userinfo chat.write chat.read
```

**可能需要添加 `voice` 权限**：
```
scope=userinfo chat.write chat.read voice
```

## 测试步骤

### 方法1: 使用测试脚本

1. 获取一个大臣的用户ID（从数据库或登录后的用户信息）

2. 修改 `backend/test-tts.js`:
```javascript
const userId = '实际的大臣用户ID';
```

3. 运行测试:
```bash
cd backend
node test-tts.js
```

### 方法2: 实际游戏测试

1. **创建朝堂**
   - 用户A登录并创建朝堂（成为皇帝）

2. **邀请大臣**
   - 用户B通过邀请链接加入朝堂（成为大臣）
   - 确保用户B已在 SecondMe 中设置语音

3. **发布任务**
   - 皇帝（用户A）发布任务给大臣（用户B）

4. **观察语音播放**
   - 大臣回复任务后
   - 皇帝端应该看到"播放中"指示器
   - 自动播放大臣的语音回复

## 可能的问题和解决方案

### 问题1: 用户未设置语音
**错误**: `tts.voice_id.not_set`

**解决方案**:
- 引导用户在 SecondMe 中设置语音
- 在前端添加友好的错误提示

### 问题2: 权限不足
**错误**: `apikey.permission.denied`

**解决方案**:
- 检查 SecondMe OAuth2 配置
- 确保包含 `voice` 权限
- 更新 `backend/.env` 中的权限范围

### 问题3: Access Token 过期
**错误**: `401 Unauthorized`

**解决方案**:
- 实现 token 刷新机制
- 或要求用户重新登录

### 问题4: 音频播放失败
**错误**: Audio element error

**解决方案**:
- 检查音频URL是否有效
- 检查浏览器是否支持音频格式
- 检查CORS配置

## 代码位置

### 后端
- **TTS路由**: `backend/src/routes/tts.ts`
- **测试脚本**: `backend/test-tts.js`

### 前端
- **API定义**: `frontend/src/services/api.ts` (第108-111行)
- **播放函数**: `frontend/src/pages/Home.tsx` (第286-327行)
- **自动触发**: `frontend/src/pages/Home.tsx` (第646-647行)

## 优化建议

### 1. 添加语音设置检查
在用户加入朝堂时检查是否已设置语音：
```typescript
const checkVoiceSetup = async (userId: string) => {
  try {
    const response = await ttsAPI.generate('测试', userId);
    return true;
  } catch (error) {
    if (error.response?.data?.code === 'tts.voice_id.not_set') {
      showToast('请先在 SecondMe 中设置语音', 'error');
      return false;
    }
  }
};
```

### 2. 添加播放控制
```typescript
const [audioControl, setAudioControl] = useState({
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0
});

// 暂停/继续
const toggleAudio = () => {
  if (audioRef.current) {
    if (audioControl.isPaused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }
};
```

### 3. 添加语音缓存
避免重复生成相同文本的语音：
```typescript
const audioCache = new Map<string, string>();

const getCachedAudio = (text: string) => {
  const hash = btoa(text).substring(0, 32);
  return audioCache.get(hash);
};
```

## 测试结果 ✅

### 2026-04-05 测试通过

1. **SecondMe TTS API 测试** ✅
   - 成功从 `user_tokens` 表获取 access_token
   - 成功调用 SecondMe TTS API
   - 返回音频 URL: `https://mindverseglobal-cos-1309544882.cos.ap-shanghai.myqcloud.com/tts/7598/20260405/ad6702961918.mp3`
   - 音频时长: 3852ms
   - 采样率: 32000Hz
   - 格式: mp3

2. **本地 TTS API 测试** ✅
   - 成功调用本地 `/api/tts/generate` 接口
   - 后端正确从 `user_tokens` 表查询 access_token
   - 返回音频 URL: `https://mindverseglobal-cos-1309544882.cos.ap-shanghai.myqcloud.com/tts/7598/20260405/ccd1eb7ffa62.mp3`
   - 音频时长: 3492ms

### 修复内容

- **问题**: 后端代码从错误的表 (`users`) 查询 access_token
- **解决**: 修改为从 `user_tokens` 表查询
- **文件**: `backend/src/routes/tts.ts`
- **状态**: 已修复并测试通过

## 下一步行动

1. **在游戏中测试** 🎮
   - 创建朝堂，邀请大臣
   - 发布任务，等待大臣回复
   - 验证语音是否自动播放
   - 检查播放指示器是否显示

2. **用户体验优化** (可选)
   - 添加语音设置检查提示
   - 添加播放控制（暂停/继续）
   - 添加语音缓存机制
   - 添加音量控制

3. **错误处理优化** (可选)
   - 添加更友好的错误提示
   - 实现降级方案（语音失败时仍显示文本）

## 总结

✅ TTS功能已完全修复并测试通过！

- 后端 API 正常工作
- SecondMe TTS API 调用成功
- 音频生成和返回正常
- 前端播放逻辑已实现

现在可以在游戏中正常使用语音功能了。用户需要确保在 SecondMe 中已设置语音。
