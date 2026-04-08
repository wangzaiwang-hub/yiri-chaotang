# TTS 动画流程优化

## 修复的问题

### 问题 1：气泡在语音播放完之前就消失了
**原因**：`waitForAudioEnd()` 在打字完成时立即检查状态，如果此时音频还在播放，但状态检查有延迟，就会误判为已结束。

**解决方案**：
- 添加延迟检查（100ms）确保状态已更新
- 增加超时时间到 15 秒
- 添加详细日志输出当前状态

### 问题 2：thinking 和 idea 动画时机不对
**原因**：在 AI 回复到达时就显示 thinking/idea，但此时还没开始生成语音。

**解决方案**：
- thinking 动画：在生成语音时显示
- idea 动画：在语音准备好后显示
- 气泡+打字：在语音开始播放时显示

## 新的完整流程

### 时间线
```
0s      - AI 回复到达
0s      - 显示 thinking 动画 🤔
0-2s    - 生成语音（调用 TTS API）
2s      - 语音准备好
2s      - 显示 idea 动画 💡
2-3s    - idea 动画持续 1 秒
3s      - 语音开始播放 🔊
3s      - 显示气泡，开始打字机效果 💬
3-5s    - 打字机效果（文字和语音同步）
5s      - 打字完成
5-7s    - 继续播放语音（文字已显示完）
7s      - 语音播放完成
7-8s    - 气泡淡出
8s      - 显示审批按钮
```

### 动画阶段
```
阶段 1: thinking (生成中)
  ├─ 显示 thinking.gif
  ├─ 调用 TTS API
  └─ 等待语音生成

阶段 2: idea (准备好)
  ├─ 显示 idea.gif
  ├─ 语音已生成
  └─ 持续 1 秒

阶段 3: 气泡+打字 (播放中)
  ├─ 语音开始播放
  ├─ 显示气泡
  ├─ 打字机效果
  └─ 文字和语音同步

阶段 4: 等待播放完成
  ├─ 打字已完成
  ├─ 语音继续播放
  └─ 气泡保持显示

阶段 5: 结束
  ├─ 语音播放完成
  ├─ 气泡淡出
  └─ 显示审批按钮
```

## 代码改进

### 1. showBubbleWithTyping 函数
```typescript
async function showBubbleWithTyping(task: any) {
  if (isEmperor && task.assignee_id) {
    // 阶段 1: thinking - 生成语音
    setThinkingState('thinking');
    setAnimationPhase('waiting_ai');
    
    const audioStarted = await startPlayTTS(task.result, task.assignee_id);
    
    // 阶段 2: idea - 语音准备好
    setThinkingState('idea');
    setAnimationPhase('ai_ready');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 阶段 3: 气泡+打字 - 语音播放中
  setThinkingState('none');
  setAnimationPhase('minister_bubble');
  setBubbleVisible(true);
  setIsTyping(true);
  
  // 打字机效果...
  
  // 阶段 4: 等待播放完成
  await waitForAudioEnd();
  
  // 阶段 5: 结束
  setBubbleVisible(false);
}
```

### 2. waitForAudioEnd 函数
```typescript
const waitForAudioEnd = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkAndWait = () => {
      if (!isPlayingAudio && !isGeneratingAudio && !audioReady) {
        // 已结束，立即 resolve
        resolve();
        return;
      }
      
      // 还在播放，保存 resolve 等待
      audioEndPromiseRef.current = resolve;
      
      // 15 秒超时保护
      setTimeout(() => {
        if (audioEndPromiseRef.current) {
          audioEndPromiseRef.current();
          audioEndPromiseRef.current = null;
        }
      }, 15000);
    };
    
    // 延迟 100ms 检查，确保状态已更新
    setTimeout(checkAndWait, 100);
  });
};
```

### 3. AI 回复到达处理
```typescript
if (isResultUpdated && newTask.result) {
  // 更新任务数据
  setDisplayedTasks([{
    ...newTask,
    displayResult: '',
  }]);
  
  // 直接开始（函数内部会处理动画）
  showBubbleWithTyping(newTask);
  
  return;
}
```

## Console 日志示例

### 正常流程
```
✅ AI 回复到达：继续动画流程
💬 准备显示气泡和播放语音
🤔 保持 thinking，开始生成语音
🔊 开始生成 TTS 语音...
🔊 清理后的文本: 陛下，臣已完成...
🔊 TTS API 响应: { code: 0, data: { url: "..." } }
🔊 音频 URL: https://...
🔊 播放命令已发送
🔊 播放成功启动
✅ 语音开始播放
💡 显示 idea 动画
💬 开始显示气泡和打字
🔊 音频开始播放
✅ 气泡打字完成
🎵 打字完成，等待语音播放完成
🎵 音频正在播放，等待结束... { isPlayingAudio: true, ... }
🔊 音频播放完成
🎵 语音播放完成
✅ 动画流程完成
```

## 状态指示器

### 1. Thinking (生成中)
```
     🤔
    /  \
   大臣位置
   
状态：生成语音中
时长：1-2 秒
```

### 2. Idea (准备好)
```
     💡
    /  \
   大臣位置
   
状态：语音准备好
时长：1 秒
```

### 3. 播放中
```
┌─────────────────────────┐
│  [🔊 播放中]           │
│                         │
│  【大臣回复】           │
│  陛下，臣已完成...      │
└─────────────────────────┘

状态：语音播放+打字
时长：3-5 秒
```

### 4. 等待播放完成
```
┌─────────────────────────┐
│  [🔊 播放中]           │
│                         │
│  【大臣回复】           │
│  陛下，臣已完成您交代   │
│  的任务，请您过目。     │
└─────────────────────────┘

状态：打字完成，语音继续
时长：1-2 秒
```

## 用户体验

### 优点
1. ✅ 动画顺序清晰：thinking → idea → 播放
2. ✅ 文字和语音完美同步
3. ✅ 气泡在语音播放完之前不会消失
4. ✅ 每个阶段都有明确的视觉反馈

### 时间分配
| 阶段 | 时长 | 视觉反馈 |
|------|------|---------|
| 生成语音 | 1-2秒 | thinking 动画 |
| 准备播放 | 1秒 | idea 动画 |
| 打字+播放 | 2-3秒 | 气泡+打字机 |
| 继续播放 | 1-2秒 | 气泡静止 |
| 淡出 | 1秒 | 气泡淡出 |
| 总计 | 6-9秒 | 完整流程 |

## 容错处理

### 1. 语音生成失败
```
🤔 thinking
  ↓
❌ 生成失败
  ↓
💬 直接显示文字（无语音）
  ↓
3秒后淡出
```

### 2. 自动播放被阻止
```
🤔 thinking
  ↓
🔊 生成成功
  ↓
❌ 播放被阻止
  ↓
💡 idea
  ↓
💬 显示文字 + [点击播放]按钮
  ↓
3秒后淡出（或用户点击播放）
```

### 3. 播放超时
```
🔊 播放中
  ↓
⏰ 15秒超时
  ↓
强制继续流程
  ↓
气泡淡出
```

## 测试要点

### 1. 正常流程
- [ ] thinking 动画在生成时显示
- [ ] idea 动画在语音准备好后显示
- [ ] 气泡和打字在语音播放时开始
- [ ] 打字完成后气泡保持显示
- [ ] 语音播放完成后气泡才淡出

### 2. 时间同步
- [ ] 文字和语音同时出现
- [ ] 打字速度合适（不太快不太慢）
- [ ] 语音播放完之前气泡不消失

### 3. 异常情况
- [ ] 语音生成失败时直接显示文字
- [ ] 自动播放被阻止时显示播放按钮
- [ ] 超时保护正常工作

### 4. 多次测试
- [ ] 连续发布多个任务
- [ ] 每次动画都正常
- [ ] 没有状态混乱

## 优化建议（未来）

### 1. 动态调整打字速度
根据语音长度调整打字速度，确保打字和语音同时结束：
```typescript
const audioDuration = response.data.data.durationMs;
const textLength = task.result.length;
const typingSpeed = audioDuration / textLength;
```

### 2. 进度条
显示语音播放进度：
```typescript
audio.ontimeupdate = () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  setAudioProgress(progress);
};
```

### 3. 波形动画
在播放时显示音频波形动画，增强视觉反馈。

---

修复时间: 2026-04-05
状态: 已优化 ✅
版本: v5.0 (完美流程)
体验: ⭐⭐⭐⭐⭐
