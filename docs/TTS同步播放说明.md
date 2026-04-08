# TTS 语音同步播放 - 修复说明

## 问题
语音和文字渲染不同步，音频在文字显示完很久才响。

## 原因分析

### 之前的流程（有问题）
```
1. 打字机效果显示文字 (2秒)
2. 打字完成 → 调用 playTTS() (异步)
3. 同时开始 3 秒倒计时
4. 3 秒后气泡淡出
5. playTTS() 可能还在生成/播放中
   ├─ 生成语音需要 1-2 秒
   └─ 播放语音需要 3-4 秒
6. 结果：气泡消失了，语音才开始播放
```

### 现在的流程（已修复）
```
1. 打字机效果显示文字 (2秒)
2. 打字完成 → 调用 playTTS() 并等待
3. 显示"生成中"指示器 (黄色)
4. 语音生成完成 → 开始播放
5. 显示"播放中"指示器 (绿色)
6. 语音播放完成 → 气泡淡出
7. 显示审批按钮
```

## 修复内容

### 1. playTTS 返回 Promise
```typescript
const playTTS = async (text: string, userId: string): Promise<void> => {
  return new Promise(async (resolve) => {
    // ... 生成和播放逻辑
    
    audio.onended = () => {
      resolve(); // 播放完成时 resolve
    };
    
    audio.onerror = () => {
      resolve(); // 失败也 resolve，不阻塞流程
    };
  });
};
```

### 2. 等待语音播放完成
```typescript
const handleAfterTyping = async () => {
  if (isEmperor && task.assignee_id) {
    // 等待语音生成并播放完成
    await playTTS(task.result, task.assignee_id);
  } else {
    // 大臣视角：等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 然后才淡出气泡
  setBubbleVisible(false);
  // ...
};
```

### 3. 添加状态指示器
- **生成中** (黄色，旋转图标) - 正在调用 TTS API
- **播放中** (绿色，音量图标) - 正在播放语音
- **点击播放** (蓝色，播放图标) - 自动播放被阻止

## 新的时间线

### 皇帝视角（有语音）
```
0s      - 大臣回复到达
0-2s    - 打字机效果
2s      - 打字完成
2-3s    - 生成语音 (显示"生成中")
3-7s    - 播放语音 (显示"播放中")
7s      - 语音完成
7-8s    - 气泡淡出
8s      - 显示审批按钮
```

### 大臣视角（无语音）
```
0s      - 看到自己的回复
0-2s    - 打字机效果
2-5s    - 气泡停留
5-6s    - 气泡淡出
6s      - 完成
```

## 用户体验改进

### 1. 视觉反馈
- 用户能看到"生成中"，知道系统在工作
- 用户能看到"播放中"，知道语音正在播放
- 气泡保持显示，直到语音播放完成

### 2. 同步性
- 文字和语音完全同步
- 不会出现"文字消失了，语音才来"的情况
- 流程更自然，体验更好

### 3. 容错处理
- 如果语音生成失败 → 3 秒后继续流程
- 如果自动播放被阻止 → 显示"点击播放"按钮，3 秒后继续流程
- 如果播放失败 → 立即继续流程
- 不会因为语音问题卡住整个流程

## 测试步骤

### 1. 正常播放测试
1. 发布任务给大臣
2. 等待大臣回复
3. 观察指示器变化：
   - 打字中 → 生成中(黄色) → 播放中(绿色) → 气泡淡出 → 审批按钮

### 2. 自动播放被阻止测试
1. 在浏览器中禁用自动播放
2. 发布任务给大臣
3. 观察指示器变化：
   - 打字中 → 生成中(黄色) → 点击播放(蓝色) → 3秒后气泡淡出
4. 点击"点击播放"按钮
5. 应该能听到语音

### 3. 语音生成失败测试
1. 停止后端服务
2. 发布任务给大臣
3. 观察：
   - 打字中 → 生成中(黄色) → 错误提示 → 气泡淡出
   - 不会卡住，流程继续

## Console 日志示例

### 成功播放
```
✅ 气泡打字完成
🎵 开始生成并播放语音
🔊 开始生成 TTS 语音...
🔊 清理后的文本: 陛下，臣已完成...
🔊 TTS API 响应: { code: 0, data: { url: "..." } }
🔊 音频 URL: https://...
🔊 开始加载音频...
🔊 音频可以播放了
🔊 播放命令已发送
🔊 播放成功启动
🔊 音频开始播放
🔊 音频播放完成
🎵 语音播放完成或失败
✅ 动画流程完成
```

### 自动播放被阻止
```
✅ 气泡打字完成
🎵 开始生成并播放语音
🔊 开始生成 TTS 语音...
🔊 播放被阻止: NotAllowedError
🔊 浏览器阻止了自动播放，显示手动播放按钮
🎵 语音播放完成或失败 (3秒后)
✅ 动画流程完成
```

## 技术细节

### Promise 链
```typescript
打字完成
  ↓
await playTTS()
  ↓ (等待)
生成语音 (1-2秒)
  ↓
播放语音 (3-4秒)
  ↓
Promise resolve
  ↓
淡出气泡
  ↓
显示按钮
```

### 状态管理
- `isGeneratingAudio` - 正在生成语音
- `isPlayingAudio` - 正在播放语音
- `audioReady` - 音频已准备好但未播放（自动播放被阻止）

### 超时保护
- 自动播放被阻止时，3 秒后自动 resolve
- 避免因为用户不点击播放按钮而卡住流程

## 优化建议（未来）

### 1. 预加载语音
在打字机效果进行时就开始生成语音，打字完成时立即播放：
```typescript
// 打字开始时
const audioPromise = playTTS(task.result, task.assignee_id);

// 打字完成时
await audioPromise; // 可能已经生成好了
```

### 2. 语音缓存
缓存已生成的语音，避免重复生成：
```typescript
const audioCache = new Map<string, string>();
const cacheKey = btoa(cleanText).substring(0, 32);
```

### 3. 播放控制
添加暂停/继续/停止按钮：
```typescript
const pauseAudio = () => audioRef.current?.pause();
const resumeAudio = () => audioRef.current?.play();
const stopAudio = () => {
  audioRef.current?.pause();
  audioRef.current.currentTime = 0;
};
```

---

修复时间: 2026-04-05
状态: 已修复并测试 ✅
版本: v3.0 (同步播放)
