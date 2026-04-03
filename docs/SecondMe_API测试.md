# 测试 SecondMe API

## 概述

我们使用 SecondMe 的聊天 API 来实现大臣虚拟人回复皇帝任务的功能。

## API 说明

### 使用的 API

我们使用 **SecondMe 聊天 API**（`/api/secondme/chat/stream`），而不是访客聊天 API。

**原因**：
- 聊天 API 允许用户与自己的虚拟人对话
- 只需要用户的 OAuth2 access token，不需要虚拟人 API Key
- 更简单、更直接

### API 流程

1. 皇帝下达任务给大臣
2. 后端使用**大臣的 access token** 调用 SecondMe 聊天 API
3. 大臣的虚拟人收到任务并回复
4. 回复保存到数据库，通过 WebSocket 推送给前端
5. 前端显示虚拟人的回复

## 测试步骤

### 1. 获取 Access Token

有三种方式获取 access token：

#### 方式 A：使用界面按钮（最简单）

1. 登录朝堂系统
2. 点击左上角的 **🔑 复制 Token** 按钮
3. Token 会自动复制到剪贴板，同时在浏览器 Console 中显示

#### 方式 B：从浏览器 Console 获取

1. 登录朝堂系统
2. 打开浏览器开发者工具（F12）
3. 切换到 Console 标签
4. 输入并执行：
   ```javascript
   JSON.parse(localStorage.getItem('auth-storage')).state.token
   ```
5. 复制输出的 token（以 `lba_at_` 开头）

#### 方式 C：从数据库获取

1. 登录 Supabase Dashboard
2. 打开 SQL Editor
3. 执行查询：
   ```sql
   SELECT user_id, access_token FROM user_tokens LIMIT 1;
   ```
4. 复制 access_token

### 2. 运行测试脚本

```bash
cd backend
node test-chat-api.js "YOUR_ACCESS_TOKEN" "请帮我写一份项目总结报告"
```

**参数说明**：
- 第一个参数：大臣的 access token（必需）
- 第二个参数：要发送的消息（可选，默认为测试消息）

### 3. 查看测试结果

成功的输出示例：

```
=== 测试 SecondMe 聊天 API ===

📤 发送消息: "请帮我写一份项目总结报告"
🎭 系统提示: "你是一位朝堂大臣，负责完成皇帝交代的任务。请以恭敬但略带憋屈的语气回复。"

✅ 连接成功，接收 AI 回复...

--- AI 回复 ---
📝 Session ID: labs_sess_xxx...

遵旨！臣这就为陛下撰写项目总结报告...（此处省略具体回复内容）

--- 回复结束 ---

✅ 测试成功！

=== 完整回复 ===
遵旨！臣这就为陛下撰写项目总结报告...
```

## 常见问题

### Q: 提示 "401 Unauthorized"

**原因**：Access token 已过期

**解决方案**：
1. 重新登录朝堂系统
2. 获取新的 access token
3. 重新运行测试

### Q: 提示 "apikey.permission.denied"

**原因**：Token 缺少 `chat.write` 权限

**解决方案**：
1. 检查 OAuth2 配置中的 scope
2. 确保包含 `chat.write` 权限
3. 重新授权

### Q: 没有收到任何回复

**可能原因**：
1. 用户还没有创建虚拟人
2. 网络连接问题
3. API 服务异常

**解决方案**：
1. 登录 SecondMe 官网，确认虚拟人已创建
2. 检查网络连接
3. 查看详细错误信息

## 代码实现

### 后端实现

在 `backend/src/routes/tasks.ts` 中，创建任务时会调用 SecondMe API：

```typescript
// 获取大臣的 token
const { data: assigneeToken } = await supabase
  .from('user_tokens')
  .select('*')
  .eq('user_id', assignee_id)
  .single();

if (assigneeToken) {
  // 调用大臣的虚拟人
  const stream = await secondMeService.executeTask(
    assigneeToken.access_token,
    taskMessage,
    task.session_id,
    'minister'
  );
  
  // 收集回复
  let fullResponse = '';
  for await (const chunk of stream) {
    fullResponse += chunk;
  }
  
  // 保存到数据库
  await supabase
    .from('virtual_tasks')
    .update({
      result: fullResponse,
      status: 'in_progress'
    })
    .eq('id', task.id);
}
```

### SecondMe Service

在 `backend/src/services/secondme.service.ts` 中：

```typescript
async executeTask(
  accessToken: string,
  taskDescription: string,
  sessionId?: string,
  department?: string
): Promise<AsyncIterable<string>> {
  const systemPrompt = department ? this.getDepartmentPrompt(department) : undefined;
  
  const response = await axios.post(
    `${this.baseURL}/api/secondme/chat/stream`,
    {
      message: taskDescription,
      sessionId,
      systemPrompt
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  );
  
  return this.parseSSEStream(response.data);
}
```

## 下一步

测试成功后，你可以：

1. 在朝堂系统中创建任务
2. 观察大臣虚拟人的回复
3. 查看 WebSocket 实时推送
4. 体验完整的任务流程

## 参考文档

- [SecondMe 聊天 API](https://develop-docs.second.me/zh/docs/secondme/chat)
- [SecondMe OAuth2](https://develop-docs.second.me/zh/docs/oauth2/authorization-code)
