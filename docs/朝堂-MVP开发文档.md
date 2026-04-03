# 朝堂 · 一日帝王 - MVP 开发文档

> 基于 SecondMe API 的虚拟分身权力游戏
> 
> 版本：v1.0.0 | 日期：2026-04-01

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [SecondMe API 集成方案](#3-secondme-api-集成方案)
4. [数据库设计](#4-数据库设计)
5. [核心功能实现](#5-核心功能实现)
6. [API 接口设计](#6-api-接口设计)
7. [前端页面实现](#7-前端页面实现)
8. [部署方案](#8-部署方案)
9. [开发计划](#9-开发计划)

---

## 1. 项目概述

### 1.1 产品定位

朝堂是一款基于 SecondMe 虚拟分身的 AI 权力游戏。真人用户通过虚拟分身进行互动，每日轮换皇帝角色，实现"今日你压榨我的分身，明日我的分身当皇帝"的游戏机制。

### 1.2 核心价值

- 真人不动手，虚拟分身执行所有任务
- 基于 SecondMe API 的真实 AI 分身能力
- 每日自动结算，怨气最高者登基
- 虚拟朋友圈惩罚，不影响现实社交

### 1.3 MVP 范围

本 MVP 版本聚焦核心游戏循环：


- ✅ 用户通过 SecondMe OAuth2 授权登录
- ✅ 创建朝堂（4-10人小组）
- ✅ 皇帝发布任务（圣旨）
- ✅ 虚拟分身执行任务（调用 SecondMe Chat API）
- ✅ 皇帝审批成果（通过/打回）
- ✅ 怨气值累计与每日结算
- ✅ 虚拟朋友圈惩罚系统
- ✅ 复仇清单与报复机制

---

## 2. 技术架构

### 2.1 技术栈选型

```
前端：
  - React 18 + TypeScript
  - Vite (构建工具)
  - TailwindCSS (样式)
  - Zustand (状态管理)
  - React Query (数据请求)
  - EventSource (SSE 流式响应)

后端：
  - Node.js 20+
  - Express.js (Web 框架)
  - TypeScript
  - Supabase (数据库 + 认证)
  - Supabase Realtime (实时通知)

外部服务：
  - SecondMe API (虚拟分身)
  - OpenAI GPT-4 (生成虚拟内容)
  - DALL-E 3 (生成虚拟配图)
```

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │朝堂首页  │  │帝王宝座  │  │虚拟朋友圈│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   后端 API (Express)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │OAuth路由 │  │任务路由  │  │分身路由  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
         ↓                ↓                    ↓
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐
│  Supabase   │  │ SecondMe    │  │  OpenAI API      │
│  PostgreSQL │  │  Chat API   │  │  (GPT-4/DALL-E)  │
└─────────────┘  └─────────────┘  └──────────────────┘
```

### 2.3 核心流程


```
1. 用户授权流程
   用户点击登录 → SecondMe OAuth2 授权 → 获取 Access Token → 存储到 Supabase

2. 任务执行流程
   皇帝发布任务 → 系统调用臣子的 SecondMe Chat API → 
   虚拟分身生成回复 → 皇帝审批 → 更新怨气值

3. 每日结算流程
   凌晨 00:00 → 计算怨气排行 → 怨气最高者登基 → 
   推送通知 → 重置怨气值

4. 虚拟惩罚流程
   皇帝发起惩罚 → GPT-4 生成文案 → DALL-E 生成配图 → 
   发布到虚拟朋友圈 → 24小时后自动删除
```

---

## 3. SecondMe API 集成方案

### 3.1 OAuth2 认证流程

#### 3.1.1 注册应用

访问 [SecondMe Developer Console](https://develop.second-me.cn/integrations/list)：

1. 创建 OAuth2 应用
2. 获取 `client_id` 和 `client_secret`
3. 配置回调 URL：
   - 开发环境：`http://localhost:3000/api/auth/callback`
   - 生产环境：`https://your-domain.com/api/auth/callback`

#### 3.1.2 授权流程实现

**前端发起授权**

```typescript
// src/utils/secondme-auth.ts
export function initiateSecondMeAuth() {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_SECONDME_CLIENT_ID,
    redirect_uri: `${window.location.origin}/api/auth/callback`,
    response_type: 'code',
    state: generateRandomState(), // 生成并存储 state
    scope: 'userinfo chat.write chat.read'
  });
  
  window.location.href = `https://go.second-me.cn/oauth/?${params.toString()}`;
}
```

**后端处理回调**

```typescript
// backend/src/routes/auth.ts
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // 验证 state 防止 CSRF
  if (!verifyState(state as string)) {
    return res.status(400).json({ error: 'Invalid state' });
  }
  
  try {
    // 用授权码换取 Access Token
    const response = await axios.post(
      'https://api.mindverse.com/gate/lab/api/oauth/token/code',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
        client_id: process.env.SECONDME_CLIENT_ID!,
        client_secret: process.env.SECONDME_CLIENT_SECRET!
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { accessToken, refreshToken, expiresIn } = response.data.data;
    
    // 获取用户信息
    const userInfo = await getSecondMeUserInfo(accessToken);
    
    // 存储到 Supabase
    await saveUserTokens(userInfo.id, {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000
    });
    
    // 重定向到前端
    res.redirect(`${process.env.FRONTEND_URL}?token=${accessToken}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
```

### 3.2 调用虚拟分身 Chat API


#### 3.2.1 流式对话实现

```typescript
// backend/src/services/secondme.service.ts
import axios from 'axios';

export class SecondMeService {
  private baseURL = 'https://api.mindverse.com/gate/lab';
  
  /**
   * 调用虚拟分身执行任务
   * @param accessToken 臣子的 SecondMe Access Token
   * @param taskDescription 任务描述
   * @param sessionId 会话 ID（可选）
   */
  async executeTask(
    accessToken: string,
    taskDescription: string,
    sessionId?: string
  ): Promise<AsyncIterable<string>> {
    const response = await axios.post(
      `${this.baseURL}/api/secondme/chat/stream`,
      {
        message: taskDescription,
        sessionId,
        systemPrompt: '你是一位朝堂臣子，需要完成皇帝交代的任务。请以恭敬但略带憋屈的语气回复。'
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
  
  /**
   * 解析 SSE 流
   */
  private async *parseSSEStream(stream: any): AsyncIterable<string> {
    let buffer = '';
    
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        } else if (line.startsWith('event: session')) {
          // 处理 session 事件
          const nextLine = lines[lines.indexOf(line) + 1];
          if (nextLine?.startsWith('data: ')) {
            const sessionData = JSON.parse(nextLine.slice(6));
            console.log('Session ID:', sessionData.sessionId);
          }
        }
      }
    }
  }
  
  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string) {
    const response = await axios.get(
      `${this.baseURL}/api/secondme/user/info`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data.data;
  }
  
  /**
   * 刷新 Access Token
   */
  async refreshToken(refreshToken: string, clientId: string, clientSecret: string) {
    const response = await axios.post(
      `${this.baseURL}/api/oauth/token/refresh`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.data;
  }
}
```

#### 3.2.2 任务执行 API

```typescript
// backend/src/routes/tasks.ts
import express from 'express';
import { SecondMeService } from '../services/secondme.service';
import { supabase } from '../lib/supabase';

const router = express.Router();
const secondMeService = new SecondMeService();

/**
 * 虚拟分身执行任务（流式响应）
 */
router.post('/tasks/:taskId/execute', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*, assignee:users!assignee_id(*)')
      .eq('id', taskId)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 获取臣子的 SecondMe Token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', task.assignee_id)
      .single();
    
    if (!tokenData) {
      return res.status(400).json({ error: 'User not authorized with SecondMe' });
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 调用虚拟分身执行任务
    const stream = await secondMeService.executeTask(
      tokenData.access_token,
      task.description,
      task.session_id
    );
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    // 保存完整回复
    await supabase
      .from('virtual_tasks')
      .update({
        result: fullResponse,
        status: 'done',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
  } catch (error) {
    console.error('Task execution error:', error);
    res.status(500).json({ error: 'Task execution failed' });
  }
});

export default router;
```

---

## 4. 数据库设计

### 4.1 Supabase 表结构


#### 4.1.1 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secondme_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_secondme_id ON users(secondme_id);
```

#### 4.1.2 用户 Token 表 (user_tokens)

```sql
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 索引
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);
```

#### 4.1.3 朝堂表 (courts)

```sql
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_emperor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_courts_creator_id ON courts(creator_id);
CREATE INDEX idx_courts_current_emperor_id ON courts(current_emperor_id);
```

#### 4.1.4 朝堂成员表 (court_members)

```sql
CREATE TABLE court_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('emperor', 'minister')),
  grudge_value INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, user_id)
);

-- 索引
CREATE INDEX idx_court_members_court_id ON court_members(court_id);
CREATE INDEX idx_court_members_user_id ON court_members(user_id);
CREATE INDEX idx_court_members_grudge_value ON court_members(grudge_value DESC);
```

#### 4.1.5 虚拟任务表 (virtual_tasks)

```sql
CREATE TABLE virtual_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  emperor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('brain', 'creative', 'social', 'talent', 'entertainment')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'rejected')),
  result TEXT,
  feedback TEXT,
  session_id TEXT,
  grudge_reward INTEGER DEFAULT 10,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_virtual_tasks_court_id ON virtual_tasks(court_id);
CREATE INDEX idx_virtual_tasks_emperor_id ON virtual_tasks(emperor_id);
CREATE INDEX idx_virtual_tasks_assignee_id ON virtual_tasks(assignee_id);
CREATE INDEX idx_virtual_tasks_status ON virtual_tasks(status);
CREATE INDEX idx_virtual_tasks_deadline ON virtual_tasks(deadline);
```

#### 4.1.6 登基记录表 (throne_records)

```sql
CREATE TABLE throne_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_quality DECIMAL(3, 2) DEFAULT 0,
  final_grudge_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, date)
);

-- 索引
CREATE INDEX idx_throne_records_court_id ON throne_records(court_id);
CREATE INDEX idx_throne_records_user_id ON throne_records(user_id);
CREATE INDEX idx_throne_records_date ON throne_records(date DESC);
```

#### 4.1.7 虚拟朋友圈表 (virtual_moments)

```sql
CREATE TABLE virtual_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  moment_type TEXT NOT NULL CHECK (moment_type IN ('recognize_father', 'talent', 'confession', 'social_death', 'cosplay')),
  likes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_virtual_moments_court_id ON virtual_moments(court_id);
CREATE INDEX idx_virtual_moments_user_id ON virtual_moments(user_id);
CREATE INDEX idx_virtual_moments_expires_at ON virtual_moments(expires_at);
```

#### 4.1.8 复仇记录表 (grudge_records)

```sql
CREATE TABLE grudge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caused_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  grudge_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_grudge_records_court_id ON grudge_records(court_id);
CREATE INDEX idx_grudge_records_user_id ON grudge_records(user_id);
CREATE INDEX idx_grudge_records_caused_by_id ON grudge_records(caused_by_id);
```

### 4.2 Supabase 初始化脚本


```sql
-- 创建所有表
-- (将上面的 CREATE TABLE 语句依次执行)

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE throne_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grudge_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己所在朝堂的数据
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Court members can view court data"
  ON courts FOR SELECT
  USING (
    id IN (
      SELECT court_id FROM court_members 
      WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Court members can view tasks"
  ON virtual_tasks FOR SELECT
  USING (
    court_id IN (
      SELECT court_id FROM court_members 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_tasks_updated_at BEFORE UPDATE ON virtual_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. 核心功能实现

### 5.1 每日结算系统

#### 5.1.1 定时任务实现

```typescript
// backend/src/jobs/daily-settlement.ts
import { CronJob } from 'cron';
import { supabase } from '../lib/supabase';

/**
 * 每日凌晨 00:00 执行结算
 */
export const dailySettlementJob = new CronJob(
  '0 0 * * *', // 每天 00:00
  async () => {
    console.log('Starting daily settlement...');
    
    try {
      // 获取所有朝堂
      const { data: courts } = await supabase
        .from('courts')
        .select('*');
      
      if (!courts) return;
      
      for (const court of courts) {
        await settleCourt(court.id);
      }
      
      console.log('Daily settlement completed');
    } catch (error) {
      console.error('Daily settlement error:', error);
    }
  },
  null,
  true,
  'Asia/Shanghai'
);

/**
 * 结算单个朝堂
 */
async function settleCourt(courtId: string) {
  // 1. 获取所有成员的怨气值
  const { data: members } = await supabase
    .from('court_members')
    .select('*')
    .eq('court_id', courtId)
    .order('grudge_value', { ascending: false });
  
  if (!members || members.length === 0) return;
  
  // 2. 怨气最高者登基
  const newEmperor = members[0];
  
  // 3. 更新朝堂皇帝
  await supabase
    .from('courts')
    .update({ current_emperor_id: newEmperor.user_id })
    .eq('id', courtId);
  
  // 4. 更新所有成员角色
  for (const member of members) {
    await supabase
      .from('court_members')
      .update({
        role: member.user_id === newEmperor.user_id ? 'emperor' : 'minister',
        grudge_value: 0 // 重置怨气值
      })
      .eq('id', member.id);
  }
  
  // 5. 记录登基记录
  await supabase
    .from('throne_records')
    .insert({
      court_id: courtId,
      user_id: newEmperor.user_id,
      date: new Date().toISOString().split('T')[0],
      final_grudge_value: newEmperor.grudge_value
    });
  
  // 6. 发送推送通知
  await sendThroneNotification(courtId, newEmperor.user_id);
}

/**
 * 发送登基通知
 */
async function sendThroneNotification(courtId: string, newEmperorId: string) {
  // 使用 Supabase Realtime 发送实时通知
  await supabase
    .from('notifications')
    .insert({
      court_id: courtId,
      type: 'new_emperor',
      data: { emperor_id: newEmperorId },
      created_at: new Date().toISOString()
    });
}
```

### 5.2 虚拟惩罚生成系统


#### 5.2.1 AI 生成惩罚内容

```typescript
// backend/src/services/punishment.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class PunishmentService {
  /**
   * 生成虚拟认爹文案
   */
  async generateRecognizeFatherContent(
    victimName: string,
    fatherName: string
  ) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个擅长生成搞笑虚拟朋友圈内容的助手。请生成一段虚拟认爹的朋友圈文案，要求：1) 语气恭敬但略显尴尬 2) 不超过100字 3) 带有适当的emoji'
        },
        {
          role: 'user',
          content: `生成一段${victimName}认${fatherName}为义父的朋友圈文案`
        }
      ],
      temperature: 0.8
    });
    
    return completion.choices[0].message.content;
  }
  
  /**
   * 生成虚拟配图
   */
  async generatePunishmentImage(prompt: string) {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `生成一张搞笑的虚拟朋友圈配图：${prompt}。风格：卡通、幽默、不涉及真人照片`,
      size: '1024x1024',
      quality: 'standard',
      n: 1
    });
    
    return response.data[0].url;
  }
  
  /**
   * 创建虚拟朋友圈惩罚
   */
  async createVirtualMoment(
    courtId: string,
    userId: string,
    punishmentType: string,
    victimName: string,
    targetName?: string
  ) {
    let content = '';
    let imagePrompt = '';
    
    switch (punishmentType) {
      case 'recognize_father':
        content = await this.generateRecognizeFatherContent(victimName, targetName!);
        imagePrompt = `${victimName}和${targetName}的父子情深场景`;
        break;
      
      case 'talent':
        content = `今日才艺表演：${victimName}为大家献上一曲《好日子》🎤`;
        imagePrompt = `${victimName}在舞台上唱歌的搞笑场景`;
        break;
      
      case 'social_death':
        content = `${victimName}郑重声明：本人是朝堂第一大冤种，此生无悔入朝堂 😭`;
        imagePrompt = `${victimName}社死现场`;
        break;
      
      default:
        content = `${victimName}接受虚拟惩罚中...`;
        imagePrompt = `搞笑的惩罚场景`;
    }
    
    // 生成配图
    const imageUrl = await this.generatePunishmentImage(imagePrompt);
    
    // 保存到数据库
    const { data, error } = await supabase
      .from('virtual_moments')
      .insert({
        court_id: courtId,
        user_id: userId,
        content,
        image_url: imageUrl,
        moment_type: punishmentType,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  }
}
```

### 5.3 怨气值计算系统

```typescript
// backend/src/services/grudge.service.ts
import { supabase } from '../lib/supabase';

export class GrudgeService {
  /**
   * 任务完成增加怨气值
   */
  async addGrudgeForTask(
    courtId: string,
    userId: string,
    taskId: string,
    amount: number
  ) {
    // 1. 增加成员怨气值
    const { data: member } = await supabase
      .from('court_members')
      .select('grudge_value')
      .eq('court_id', courtId)
      .eq('user_id', userId)
      .single();
    
    if (!member) throw new Error('Member not found');
    
    await supabase
      .from('court_members')
      .update({
        grudge_value: member.grudge_value + amount
      })
      .eq('court_id', courtId)
      .eq('user_id', userId);
    
    // 2. 记录怨气来源
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('emperor_id, title')
      .eq('id', taskId)
      .single();
    
    await supabase
      .from('grudge_records')
      .insert({
        court_id: courtId,
        user_id: userId,
        caused_by_id: task?.emperor_id,
        event_type: 'task_completed',
        event_description: `完成任务：${task?.title}`,
        grudge_amount: amount
      });
  }
  
  /**
   * 任务被打回增加额外怨气值
   */
  async addGrudgeForRejection(
    courtId: string,
    userId: string,
    taskId: string
  ) {
    await this.addGrudgeForTask(courtId, userId, taskId, 20);
    
    // 额外记录打回事件
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('emperor_id, title')
      .eq('id', taskId)
      .single();
    
    await supabase
      .from('grudge_records')
      .insert({
        court_id: courtId,
        user_id: userId,
        caused_by_id: task?.emperor_id,
        event_type: 'task_rejected',
        event_description: `任务被打回：${task?.title}`,
        grudge_amount: 20
      });
  }
  
  /**
   * 虚拟惩罚增加怨气值
   */
  async addGrudgeForPunishment(
    courtId: string,
    userId: string,
    emperorId: string,
    punishmentType: string
  ) {
    const grudgeMap: Record<string, number> = {
      recognize_father: 50,
      talent: 40,
      social_death: 30,
      confession: 20,
      cosplay: 40
    };
    
    const amount = grudgeMap[punishmentType] || 30;
    
    const { data: member } = await supabase
      .from('court_members')
      .select('grudge_value')
      .eq('court_id', courtId)
      .eq('user_id', userId)
      .single();
    
    if (!member) throw new Error('Member not found');
    
    await supabase
      .from('court_members')
      .update({
        grudge_value: member.grudge_value + amount
      })
      .eq('court_id', courtId)
      .eq('user_id', userId);
    
    await supabase
      .from('grudge_records')
      .insert({
        court_id: courtId,
        user_id: userId,
        caused_by_id: emperorId,
        event_type: 'punishment',
        event_description: `遭受虚拟惩罚：${punishmentType}`,
        grudge_amount: amount
      });
  }
  
  /**
   * 获取怨气排行榜
   */
  async getGrudgeRanking(courtId: string) {
    const { data: members } = await supabase
      .from('court_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('court_id', courtId)
      .order('grudge_value', { ascending: false });
    
    return members;
  }
}
```

---

## 6. API 接口设计

### 6.1 认证相关


```
GET  /api/auth/secondme/login       # 发起 SecondMe OAuth2 授权
GET  /api/auth/callback              # OAuth2 回调处理
POST /api/auth/refresh               # 刷新 Access Token
GET  /api/auth/me                    # 获取当前用户信息
```

### 6.2 朝堂管理

```
POST   /api/courts                   # 创建朝堂
GET    /api/courts                   # 获取用户所在的朝堂列表
GET    /api/courts/:id               # 获取朝堂详情
POST   /api/courts/:id/invite        # 邀请成员加入
POST   /api/courts/:id/join          # 加入朝堂
DELETE /api/courts/:id/leave         # 退出朝堂
GET    /api/courts/:id/members       # 获取朝堂成员列表
GET    /api/courts/:id/ranking       # 获取怨气排行榜
```

### 6.3 任务管理

```
POST   /api/tasks                    # 皇帝发布任务
GET    /api/tasks                    # 获取任务列表
GET    /api/tasks/:id                # 获取任务详情
POST   /api/tasks/:id/execute        # 虚拟分身执行任务（SSE流式）
POST   /api/tasks/:id/approve        # 皇帝批准任务
POST   /api/tasks/:id/reject         # 皇帝打回任务
```

### 6.4 虚拟朋友圈

```
GET    /api/moments                  # 获取虚拟朋友圈列表
POST   /api/moments                  # 创建虚拟朋友圈（惩罚）
POST   /api/moments/:id/like         # 点赞
POST   /api/moments/:id/comment      # 评论
```

### 6.5 复仇系统

```
GET    /api/grudge/records           # 获取复仇清单
GET    /api/grudge/ranking/:courtId  # 获取怨气排行
```

### 6.6 API 请求示例

#### 6.6.1 创建朝堂

```bash
POST /api/courts
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "死党朝堂",
  "description": "兄弟，好友，闺蜜，死党之间一起玩的模拟朝堂游戏"
}
```

响应：
```json
{
  "code": 0,
  "data": {
    "id": "court_123",
    "name": "死党朝堂",
    "creator_id": "user_456",
    "current_emperor_id": "user_456",
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

#### 6.6.2 发布任务

```bash
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "court_id": "court_123",
  "assignee_id": "user_789",
  "title": "帮朕写周报",
  "description": "命虚拟分身帮朕写本周工作周报，要求：不说人话，全是官话",
  "task_type": "brain",
  "deadline": "2026-04-01T18:00:00Z",
  "grudge_reward": 15
}
```

响应：
```json
{
  "code": 0,
  "data": {
    "id": "task_001",
    "title": "帮朕写周报",
    "status": "pending",
    "created_at": "2026-04-01T10:30:00Z"
  }
}
```

#### 6.6.3 执行任务（SSE 流式）

```bash
POST /api/tasks/task_001/execute
Authorization: Bearer <token>
```

响应（SSE 流）：
```
event: session
data: {"sessionId": "labs_sess_abc123"}

data: {"content": "臣"}
data: {"content": "遵"}
data: {"content": "旨"}
data: {"content": "。"}
data: {"content": "臣"}
data: {"content": "这"}
data: {"content": "就"}
data: {"content": "为"}
data: {"content": "陛"}
data: {"content": "下"}
data: {"content": "撰"}
data: {"content": "写"}
data: {"content": "周"}
data: {"content": "报"}
data: {"content": "..."}

data: [DONE]
```

---

## 7. 前端页面实现

### 7.1 技术栈

```
- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS (样式)
- Zustand (状态管理)
- React Query (数据请求)
- React Router (路由)
```

### 7.2 项目结构

```
frontend/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Layout.tsx
│   │   ├── TaskCard.tsx
│   │   ├── MemberCard.tsx
│   │   └── MomentCard.tsx
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 朝堂首页
│   │   ├── Throne.tsx       # 帝王宝座
│   │   ├── Tasks.tsx        # 任务列表
│   │   ├── Moments.tsx      # 虚拟朋友圈
│   │   ├── Grudge.tsx       # 怨气面板
│   │   └── Revenge.tsx      # 复仇清单
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useCourt.ts
│   │   └── useTasks.ts
│   ├── services/            # API 服务
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── task.service.ts
│   ├── stores/              # Zustand 状态管理
│   │   ├── authStore.ts
│   │   └── courtStore.ts
│   ├── utils/               # 工具函数
│   │   ├── secondme.ts
│   │   └── sse.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

### 7.3 核心页面实现

#### 7.3.1 朝堂首页


```tsx
// src/pages/Home.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourt } from '../hooks/useCourt';
import { TaskCard } from '../components/TaskCard';
import { GrudgeRanking } from '../components/GrudgeRanking';

export const Home: React.FC = () => {
  const { currentCourt } = useCourt();
  
  const { data: emperor } = useQuery({
    queryKey: ['emperor', currentCourt?.id],
    queryFn: () => fetchEmperor(currentCourt?.id),
    enabled: !!currentCourt
  });
  
  const { data: tasks } = useQuery({
    queryKey: ['tasks', currentCourt?.id],
    queryFn: () => fetchTasks(currentCourt?.id),
    enabled: !!currentCourt
  });
  
  const { data: ranking } = useQuery({
    queryKey: ['ranking', currentCourt?.id],
    queryFn: () => fetchGrudgeRanking(currentCourt?.id),
    enabled: !!currentCourt
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* 今日帝王 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            👑 今日帝王
          </h2>
          <div className="flex items-center gap-4">
            <img 
              src={emperor?.avatar} 
              alt={emperor?.nickname}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h3 className="text-xl font-bold">{emperor?.nickname}</h3>
              <p className="text-gray-600">
                "昨日干活最多，今日朕临天下"
              </p>
              <p className="text-sm text-gray-500">
                登基第 {emperor?.days} 天 | 臣民 {currentCourt?.memberCount} 人
              </p>
            </div>
          </div>
        </div>
        
        {/* 今日圣旨 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">
            📜 今日圣旨（{tasks?.filter(t => t.status === 'pending').length}条待完成）
          </h2>
          <div className="space-y-4">
            {tasks?.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
        
        {/* 怨气榜 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">
            😤 怨气榜
          </h2>
          <GrudgeRanking ranking={ranking} />
        </div>
        
        {/* 复仇时钟 */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">⚔️ 复仇时钟</h2>
          <p className="text-3xl font-mono">
            距离新皇登基还有：<CountdownTimer />
          </p>
          <p className="text-sm mt-2">届时将开始清算旧账</p>
        </div>
      </div>
    </div>
  );
};
```

#### 7.3.2 帝王宝座（发布任务）

```tsx
// src/pages/Throne.tsx
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTask } from '../services/task.service';

export const Throne: React.FC = () => {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'brain',
    assignee_id: '',
    deadline: '',
    grudge_reward: 10
  });
  
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: fetchCourtMembers
  });
  
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      alert('圣旨已颁布！');
      setTaskForm({
        title: '',
        description: '',
        task_type: 'brain',
        assignee_id: '',
        deadline: '',
        grudge_reward: 10
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(taskForm);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-900 mb-6">
          👑 帝王宝座
        </h1>
        
        {/* 朝堂数据 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 今日朝堂数据</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">3</div>
              <div className="text-sm text-gray-600">📋 任务</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">2</div>
              <div className="text-sm text-gray-600">⏳ 进行中</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-600">✅ 已完成</div>
            </div>
          </div>
        </div>
        
        {/* 发布任务表单 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">👑 朕有旨（新任务）</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                任务类型
              </label>
              <select
                value={taskForm.task_type}
                onChange={(e) => setTaskForm({...taskForm, task_type: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="brain">脑力任务</option>
                <option value="creative">创作任务</option>
                <option value="social">社交任务</option>
                <option value="talent">才艺任务</option>
                <option value="entertainment">娱乐任务</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                任务标题
              </label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                placeholder="例如：帮朕写周报"
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                任务描述
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="命虚拟分身写一份述职报告..."
                className="w-full border rounded-lg px-4 py-2 h-32"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                指定分身
              </label>
              <select
                value={taskForm.assignee_id}
                onChange={(e) => setTaskForm({...taskForm, assignee_id: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">选择臣子</option>
                {members?.map(member => (
                  <option key={member.id} value={member.user_id}>
                    {member.user.nickname}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                截止时间
              </label>
              <input
                type="datetime-local"
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? '颁布中...' : '📢 颁布圣旨'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
```

#### 7.3.3 任务执行（SSE 流式显示）


```tsx
// src/components/TaskExecutor.tsx
import React, { useState } from 'react';
import { useSSE } from '../hooks/useSSE';

interface TaskExecutorProps {
  taskId: string;
  onComplete: () => void;
}

export const TaskExecutor: React.FC<TaskExecutorProps> = ({ taskId, onComplete }) => {
  const [response, setResponse] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const executeTask = async () => {
    setIsExecuting(true);
    setResponse('');
    
    const eventSource = new EventSource(
      `/api/tasks/${taskId}/execute`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setIsExecuting(false);
        onComplete();
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        if (data.content) {
          setResponse(prev => prev + data.content);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setIsExecuting(false);
    };
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">虚拟分身执行中...</h3>
        <button
          onClick={executeTask}
          disabled={isExecuting}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isExecuting ? '执行中...' : '开始执行'}
        </button>
      </div>
      
      {response && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">臣子回复：</p>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
};
```

#### 7.3.4 虚拟朋友圈

```tsx
// src/pages/Moments.tsx
import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMoments, likeMoment } from '../services/moment.service';

export const Moments: React.FC = () => {
  const { data: moments, refetch } = useQuery({
    queryKey: ['moments'],
    queryFn: fetchMoments
  });
  
  const likeMutation = useMutation({
    mutationFn: likeMoment,
    onSuccess: () => refetch()
  });
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📱 虚拟朋友圈</h1>
        
        <div className="space-y-4">
          {moments?.map(moment => (
            <div key={moment.id} className="bg-white rounded-lg shadow p-6">
              {/* 用户信息 */}
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={moment.user.avatar} 
                  alt={moment.user.nickname}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-bold">{moment.user.nickname}</h3>
                  <p className="text-xs text-gray-500">
                    {formatTime(moment.created_at)}
                  </p>
                </div>
              </div>
              
              {/* 内容 */}
              <p className="mb-4">{moment.content}</p>
              
              {/* 配图 */}
              {moment.image_url && (
                <img 
                  src={moment.image_url} 
                  alt="虚拟配图"
                  className="w-full rounded-lg mb-4"
                />
              )}
              
              {/* 标签 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                  {getMomentTypeLabel(moment.moment_type)}
                </span>
                <span className="text-xs text-gray-500">
                  ⏰ {formatExpireTime(moment.expires_at)} 后消失
                </span>
              </div>
              
              {/* 点赞 */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  onClick={() => likeMutation.mutate(moment.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-500"
                >
                  <span>👍</span>
                  <span>{moment.likes?.length || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                  <span>💬</span>
                  <span>评论</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getMomentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    recognize_father: '虚拟认爹',
    talent: '才艺表演',
    social_death: '社死现场',
    confession: '土味情话',
    cosplay: '虚拟Cosplay'
  };
  return labels[type] || '虚拟惩罚';
}
```

---

## 8. 部署方案

### 8.1 环境变量配置

#### 8.1.1 后端环境变量

```bash
# .env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# SecondMe OAuth2
SECONDME_CLIENT_ID=your-client-id
SECONDME_CLIENT_SECRET=your-client-secret
BASE_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# JWT
JWT_SECRET=your-jwt-secret
```

#### 8.1.2 前端环境变量

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_SECONDME_CLIENT_ID=your-client-id
```

### 8.2 部署步骤

#### 8.2.1 Supabase 设置

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 执行数据库初始化脚本（见 4.2 节）
3. 配置 RLS 策略
4. 获取 API Keys

#### 8.2.2 后端部署（推荐 Railway / Render）


**使用 Railway 部署**

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 添加环境变量
railway variables set SUPABASE_URL=...
railway variables set SECONDME_CLIENT_ID=...
# ... 添加所有环境变量

# 5. 部署
railway up
```

**使用 Render 部署**

1. 连接 GitHub 仓库
2. 选择 Web Service
3. 配置构建命令：`npm install && npm run build`
4. 配置启动命令：`npm start`
5. 添加环境变量
6. 部署

#### 8.2.3 前端部署（推荐 Vercel / Netlify）

**使用 Vercel 部署**

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod

# 4. 配置环境变量
vercel env add VITE_API_BASE_URL
vercel env add VITE_SECONDME_CLIENT_ID
```

**使用 Netlify 部署**

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 初始化
netlify init

# 4. 部署
netlify deploy --prod

# 5. 配置环境变量
netlify env:set VITE_API_BASE_URL https://your-backend.com
```

### 8.3 定时任务配置

使用 Supabase Edge Functions 或 Cron Job 服务配置每日结算任务：

**方案 1：使用 Supabase Edge Functions + Cron**

```typescript
// supabase/functions/daily-settlement/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 执行每日结算逻辑
  const { data: courts } = await supabase.from('courts').select('*');
  
  for (const court of courts || []) {
    await settleCourt(court.id, supabase);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

配置 Cron：
```bash
# 在 Supabase Dashboard 中配置 Cron Job
# 或使用 GitHub Actions
```

**方案 2：使用 EasyCron / Cron-job.org**

1. 注册 [EasyCron](https://www.easycron.com) 或 [Cron-job.org](https://cron-job.org)
2. 创建定时任务，每天 00:00 调用：
   ```
   POST https://your-backend.com/api/cron/daily-settlement
   Header: X-Cron-Secret: your-secret-key
   ```

---

## 9. 开发计划

### 9.1 第一阶段：核心功能（2周）

#### Week 1: 基础架构 + 认证

**Day 1-2: 项目初始化**
- [ ] 创建前后端项目结构
- [ ] 配置 TypeScript + ESLint + Prettier
- [ ] 配置 Supabase 项目
- [ ] 创建数据库表结构

**Day 3-4: SecondMe OAuth2 集成**
- [ ] 实现 OAuth2 授权流程
- [ ] 实现 Token 刷新机制
- [ ] 实现用户信息获取
- [ ] 测试授权流程

**Day 5-7: 朝堂管理**
- [ ] 实现创建朝堂功能
- [ ] 实现邀请成员功能
- [ ] 实现朝堂列表页面
- [ ] 实现朝堂详情页面

#### Week 2: 任务系统 + 虚拟分身

**Day 8-10: 任务发布与执行**
- [ ] 实现任务发布 API
- [ ] 实现任务列表 API
- [ ] 集成 SecondMe Chat API
- [ ] 实现 SSE 流式响应
- [ ] 实现任务执行前端页面

**Day 11-12: 审批与怨气系统**
- [ ] 实现任务审批功能
- [ ] 实现怨气值计算逻辑
- [ ] 实现怨气排行榜
- [ ] 实现复仇记录

**Day 13-14: 测试与优化**
- [ ] 端到端测试
- [ ] 性能优化
- [ ] Bug 修复
- [ ] 文档完善

### 9.2 第二阶段：游戏化功能（1周）

**Day 15-16: 每日结算**
- [ ] 实现每日结算定时任务
- [ ] 实现皇帝轮换逻辑
- [ ] 实现登基通知推送
- [ ] 测试结算流程

**Day 17-18: 虚拟朋友圈**
- [ ] 集成 OpenAI GPT-4
- [ ] 集成 DALL-E 3
- [ ] 实现虚拟惩罚生成
- [ ] 实现虚拟朋友圈页面
- [ ] 实现点赞评论功能

**Day 19-21: 复仇系统**
- [ ] 实现复仇清单页面
- [ ] 实现报复机制
- [ ] 完善游戏循环
- [ ] 全面测试

### 9.3 第三阶段：部署与上线（3天）

**Day 22: 部署准备**
- [ ] 配置生产环境变量
- [ ] 配置域名和 SSL
- [ ] 配置 CDN（可选）

**Day 23: 部署**
- [ ] 部署后端到 Railway/Render
- [ ] 部署前端到 Vercel/Netlify
- [ ] 配置 Supabase 生产环境
- [ ] 配置定时任务

**Day 24: 测试与上线**
- [ ] 生产环境测试
- [ ] 性能监控配置
- [ ] 错误追踪配置（Sentry）
- [ ] 正式上线

### 9.4 开发优先级

**P0 - 必须完成（MVP 核心）**
- SecondMe OAuth2 认证
- 创建朝堂
- 发布任务
- 虚拟分身执行任务
- 任务审批
- 怨气值累计
- 每日结算

**P1 - 重要功能**
- 虚拟朋友圈
- 虚拟惩罚生成
- 复仇清单
- 实时通知

**P2 - 优化功能**
- 任务模板
- 历史记录
- 数据统计
- 成就系统

---

## 10. 技术难点与解决方案

### 10.1 SSE 流式响应处理

**问题**：SecondMe Chat API 返回 SSE 流，需要正确解析和展示

**解决方案**：
```typescript
// 使用 EventSource API
const eventSource = new EventSource(url);

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  
  const data = JSON.parse(event.data);
  // 处理数据
};
```

### 10.2 Token 过期处理

**问题**：SecondMe Access Token 7天过期，需要自动刷新

**解决方案**：
```typescript
// 使用 Axios 拦截器
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token 过期，尝试刷新
      const newToken = await refreshToken();
      // 重试原请求
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 10.3 每日结算时区问题

**问题**：需要确保在中国时区凌晨 00:00 执行

**解决方案**：
```typescript
// 使用 node-cron 指定时区
import cron from 'node-cron';

cron.schedule('0 0 * * *', async () => {
  await dailySettlement();
}, {
  timezone: 'Asia/Shanghai'
});
```

### 10.4 AI 生成内容成本控制

**问题**：频繁调用 GPT-4 和 DALL-E 成本较高

**解决方案**：
1. 使用 GPT-4-mini 替代 GPT-4
2. 缓存常见惩罚文案模板
3. 限制每日惩罚次数
4. 使用更便宜的图片生成服务（Stable Diffusion）

---

## 11. 安全考虑

### 11.1 OAuth2 安全

- 使用 HTTPS
- 验证 state 参数防止 CSRF
- 安全存储 Client Secret（仅服务端）
- 定期轮换 Refresh Token

### 11.2 API 安全

- 所有 API 需要认证
- 使用 Rate Limiting 防止滥用
- 验证用户权限（只能操作自己所在朝堂）
- 输入验证和 SQL 注入防护

### 11.3 数据安全

- 启用 Supabase RLS
- 敏感数据加密存储
- 定期备份数据库
- 虚拟朋友圈内容 24 小时自动删除

---

## 12. 监控与日志

### 12.1 错误追踪

使用 Sentry 追踪错误：

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### 12.2 性能监控

使用 Supabase Dashboard 监控：
- API 响应时间
- 数据库查询性能
- 错误率

### 12.3 日志记录

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 13. 总结

本文档提供了朝堂 MVP 的完整开发方案，包括：

1. 基于 SecondMe API 的虚拟分身集成
2. 使用 Supabase 的数据库设计
3. React + Express 的全栈实现
4. 完整的部署方案

预计开发周期：3-4 周

核心技术栈：
- 前端：React + TypeScript + TailwindCSS
- 后端：Node.js + Express + TypeScript
- 数据库：Supabase (PostgreSQL)
- AI：SecondMe API + OpenAI GPT-4 + DALL-E 3

---

*文档版本：v1.0.0 | 更新日期：2026-04-01*
