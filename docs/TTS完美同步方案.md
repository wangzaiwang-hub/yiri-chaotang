# TTS 完美同步方案 - 语音和文字一起显示

## 核心思路
先生成语音，等语音开始播放时再开始打字机效果，这样音频和文字完美同步。

## 新的流程

### 之前的问题
```
1. 打字机显示文字 (2秒)
2. 打字完成 → 生成语音 (1-2秒)
3. 播放语音 (3-4秒)

问题：文字先出现，语音后来，不同步
```

### 现在的方案 ✅
```
1. 检测到 AI 回复
2. 显示 thinking → idea 动画
3. 生成语音 (1-2秒) ← 显示"生成中"
4. 语音开始播放 ← 显示"播放中"
5. 同时开始打字机效果 ← 文字和语音同步！
6. 打字完成，等待语音播放完
7. 语音播放完成
8. 气泡淡出
9. 显示审批按钮
```

## 技术实现

### 1. 拆分播放函数

#### startPlayTTS() - 开始播放
```typescript
const startPlayTTS = async (text: string, userId: string): Promise<boolean> => {
  // 1. 生成语音
  const response = await ttsAPI.generate(cleanText, userId);
  
  // 2. 创建 Audio 元素
  const audio = new Audio(audioUrl);
  
  // 3. 开始播放
  await audio.play();
  
  // 4. 返回是否成功
  return true; // 或 false
};
```

#### waitForAudioEnd() - 等待播放完成
```typescript
const waitForAudioEnd = (): Promise<void> => {
  return new Promise((resolve) => {
    // 保存 resolve 函数
    audioEndPromiseRef.current = resolve;
    
    // 在 audio.onended 中调用 resolve
  });
};
```

### 2. 修改显示逻辑

```typescript
async function showBubbleWithTyping(task: any) {
  // 1. 如果是皇帝视角，先生成并开始播放语音
  if (isEmperor && task.assignee_id) {
    const audioStarted = await startPlayTTS(task.result, task.assignee_id);
    // 语音开始播放了！
  }
  
  // 2. 显示气泡并开始打字（此时语音正在播放）
  setBubbleVisible(true);
  setIsTyping(true);
  
  // 3. 打字机效果
  const resultInterval = setInterval(() => {
    // ... 逐字显示
  }, 50);
  
  // 4. 打字完成后，等待语音播放完
  await waitForAudioEnd();
  
  // 5. 淡出气泡
  setBubbleVisible(false);
}
```

## 时间线对比

### 旧方案（不同步）
```
0s      - AI 回复到达
0-2s    - 打字机效果 ← 只有文字
2s      - 打字完成
2-3s    - 生成语音 ← 文字已经显示完了
3-7s    - 播放语音 ← 只有声音，没有文字动画
7s      - 完成
```

### 新方案（完美同步）✅
```
0s      - AI 回复到达
0-1s    - thinking → idea 动画
1-2s    - 生成语音 (显示"生成中")
2s      - 语音开始播放 (显示"播放中")
2-4s    - 打字机效果 ← 文字和语音同步！
4-6s    - 语音继续播放，文字已显示完
6s      - 语音播放完成
6-7s    - 气泡淡出
7s      - 显示审批按钮
```

## 状态指示器

### 1. 生成中 (黄色)
```
┌─────────────────────────┐
│  [⟳ 生成中]            │  ← 黄色，旋转图标
│                         │
│  (气泡还未显示)         │
└─────────────────────────┘
```

### 2. 播放中 (绿色)
```
┌─────────────────────────┐
│  [🔊 播放中]           │  ← 绿色，音量图标
│                         │
│  【大臣回复】           │
│  陛下，臣已...         │  ← 打字机效果进行中
└─────────────────────────┘
```

### 3. 点击播放 (蓝色)
```
┌─────────────────────────┐
│  [▶ 点击播放]          │  ← 蓝色，播放图标
│                         │
│  【大臣回复】           │
│  陛下，臣已完成...      │  ← 文字已显示完
└─────────────────────────┘
```

## 用户体验

### 优点
1. ✅ 文字和语音完美同步
2. ✅ 就像真人说话一样自然
3. ✅ 视觉和听觉同时接收信息
4. ✅ 沉浸感更强

### 对比
| 方案 | 文字出现 | 语音播放 | 同步性 |
|------|---------|---------|--------|
| 旧方案 | 0-2秒 | 2-7秒 | ❌ 不同步 |
| 新方案 | 2-4秒 | 2-6秒 | ✅ 完美同步 |

## Console 日志示例

### 成功流程
```
🔍 isResultUpdated 检测
✅ AI 回复到达：继续动画流程
🤔 从头开始：显示 thinking
💡 切换到 idea 动画
💬 准备显示气泡和播放语音
🎵 先生成语音（预加载）
🔊 开始生成 TTS 语音...
🔊 清理后的文本: 陛下，臣已完成...
🔊 TTS API 响应: { code: 0, data: { url: "..." } }
🔊 音频 URL: https://...
🔊 开始加载音频...
🔊 播放命令已发送
🔊 播放成功启动
✅ 语音开始播放，同步显示文字
🔊 音频开始播放
💬 开始打字机效果 ← 此时语音正在播放
✅ 气泡打字完成
🎵 等待语音播放完成
🔊 音频播放完成
🎵 语音播放完成
✅ 动画流程完成
```

### 自动播放被阻止
```
🔊 播放被阻止: NotAllowedError
🔊 浏览器阻止了自动播放，显示手动播放按钮
⚠️ 语音生成失败或被阻止，直接显示文字
💬 开始打字机效果 ← 没有语音，直接显示文字
✅ 气泡打字完成
✅ 动画流程完成
```

## 关键代码

### 音频结束 Promise
```typescript
const audioEndPromiseRef = useRef<((value: void) => void) | null>(null);

// 在 audio.onended 中调用
audio.onended = () => {
  setIsPlayingAudio(false);
  
  // 通知等待者
  if (audioEndPromiseRef.current) {
    audioEndPromiseRef.current();
    audioEndPromiseRef.current = null;
  }
};

// 等待函数
const waitForAudioEnd = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isPlayingAudio) {
      resolve(); // 已经结束了
      return;
    }
    
    audioEndPromiseRef.current = resolve;
    
    // 超时保护
    setTimeout(() => {
      if (audioEndPromiseRef.current) {
        audioEndPromiseRef.current();
        audioEndPromiseRef.current = null;
      }
    }, 10000);
  });
};
```

## 容错处理

### 1. 语音生成失败
- 直接显示文字
- 不阻塞流程
- 用户仍能看到回复

### 2. 自动播放被阻止
- 显示"点击播放"按钮
- 文字正常显示
- 用户可以手动播放

### 3. 播放失败
- 立即结束等待
- 继续后续流程
- 不影响用户体验

### 4. 超时保护
- 10 秒后自动继续
- 避免卡住
- 保证流程完整

## 测试建议

### 1. 正常播放
- 观察"生成中" → "播放中"的切换
- 确认文字和语音同时出现
- 检查打字速度是否合适

### 2. 网络慢
- 语音生成时间较长
- 应该看到"生成中"指示器
- 生成完成后才开始打字

### 3. 自动播放被阻止
- 应该看到"点击播放"按钮
- 文字正常显示
- 点击按钮能播放

### 4. 多次测试
- 连续发布多个任务
- 确认每次都同步
- 检查是否有内存泄漏

## 优化空间（未来）

### 1. 调整打字速度
根据语音长度动态调整打字速度，确保打字完成时语音也刚好结束：
```typescript
const textLength = task.result.length;
const audioDuration = response.data.data.durationMs;
const typingSpeed = audioDuration / textLength;
```

### 2. 语音缓存
缓存已生成的语音，避免重复生成：
```typescript
const audioCache = new Map<string, string>();
const cacheKey = btoa(cleanText).substring(0, 32);
```

### 3. 预加载下一条
在当前语音播放时，预加载下一条语音：
```typescript
if (nextTask) {
  preloadTTS(nextTask.result, nextTask.assignee_id);
}
```

---

实现时间: 2026-04-05
状态: 已实现 ✅
版本: v4.0 (完美同步)
体验: ⭐⭐⭐⭐⭐
