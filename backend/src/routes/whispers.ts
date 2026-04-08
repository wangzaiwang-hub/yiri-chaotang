import express from 'express';
import { supabase } from '../lib/supabase';
import { secondMeService } from '../services/secondme.service';
import { logger } from '../utils/logger';
import { wsService } from '../lib/websocket';

const router = express.Router();

/**
 * 大臣发送悄悄话给另一个大臣
 * AI 会根据话题生成对方的回复
 */
router.post('/send', async (req, res) => {
  const { court_id, from_user_id, to_user_id, message } = req.body;
  
  logger.info('Send whisper request:', { court_id, from_user_id, to_user_id, message });
  
  // 验证参数
  if (!court_id || !from_user_id || !to_user_id || !message) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      details: { court_id: !!court_id, from_user_id: !!from_user_id, to_user_id: !!to_user_id, message: !!message }
    });
  }
  
  try {
    // 获取接收者的 token（用于生成回复）
    const { data: toTokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', to_user_id)
      .single();
    
    if (!toTokenData?.access_token) {
      return res.status(400).json({ error: 'Recipient token not found' });
    }
    
    // 获取发送者和接收者的信息
    const { data: fromUser } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', from_user_id)
      .single();
    
    const { data: toUser } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', to_user_id)
      .single();
    
    // 获取皇帝信息
    const { data: emperorMember } = await supabase
      .from('court_members')
      .select('user:users(nickname)')
      .eq('court_id', court_id)
      .eq('role', 'emperor')
      .single();
    
    const emperorName = (emperorMember?.user as any)?.nickname || '皇上';
    
    // 使用 AI 生成接收者的回复
    logger.info('Generating whisper reply with AI...');
    const systemPrompt = `【游戏角色扮演 - 大臣悄悄话回复】

这是一个古风朝堂主题的轻松游戏。你正在扮演大臣"${toUser?.nickname}"，同僚"${fromUser?.nickname}"刚刚悄悄对你说了句话。

游戏设定：
- 这是大臣之间的私密对话，但皇帝"${emperorName}"也能偷听到
- 语气要轻松幽默，像朋友聊天一样
- 可以适当吐槽皇上，但不要太过分（毕竟皇上能看到）
- 使用古风口语化风格，不要太文言文
- 字数控制在 30-80 字
- 不要使用 Markdown 格式

${fromUser?.nickname}对你说：${message}

请以"${toUser?.nickname}"的身份，回复这句悄悄话。可以调侃、吐槽、或者闲聊。直接输出回复内容即可。

示例风格：
"哈哈，你说得对！咱们皇上有时候确实挺有意思的。不过小声点，别让他听到了！"`;

    const aiResponse = await secondMeService.executeTask(
      toTokenData.access_token,
      systemPrompt,
      undefined,
      undefined,
      false
    );
    
    // 收集 AI 生成的回复
    let replyContent = '';
    for await (const chunk of aiResponse) {
      replyContent += chunk;
    }
    
    replyContent = replyContent.trim();
    logger.info('AI generated reply:', replyContent);
    
    // 保存悄悄话到数据库（包含原始消息和回复）
    const { data: whisper, error } = await supabase
      .from('whispers')
      .insert({
        court_id,
        from_user_id,
        to_user_id,
        content: JSON.stringify({
          message: message,
          reply: replyContent
        }),
        read_by_emperor: false,
        read_by_recipient: false
      })
      .select(`
        *,
        from_user:users!from_user_id(*),
        to_user:users!to_user_id(*)
      `)
      .single();
    
    if (error) throw error;
    
    // 通过 WebSocket 广播新悄悄话
    wsService.broadcastToCourt(court_id, {
      type: 'new_whisper',
      whisper
    });
    
    res.json({
      code: 0,
      data: {
        ...whisper,
        parsed_content: {
          message: message,
          reply: replyContent
        }
      }
    });
  } catch (error: any) {
    logger.error('Send whisper error:', error);
    res.status(500).json({ error: 'Failed to send whisper' });
  }
});

/**
 * 获取朝堂的悄悄话列表
 * 皇帝可以看到所有悄悄话，大臣只能看到与自己相关的
 */
router.get('/', async (req, res) => {
  const { court_id, user_id } = req.query;
  
  if (!court_id || !user_id) {
    return res.status(400).json({ error: 'Missing court_id or user_id' });
  }
  
  try {
    // 检查用户角色
    const { data: member } = await supabase
      .from('court_members')
      .select('role')
      .eq('court_id', court_id as string)
      .eq('user_id', user_id as string)
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this court' });
    }
    
    let query = supabase
      .from('whispers')
      .select(`
        *,
        from_user:users!from_user_id(*),
        to_user:users!to_user_id(*)
      `)
      .eq('court_id', court_id as string)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // 如果是大臣，只能看到与自己相关的悄悄话
    if (member.role === 'minister') {
      query = query.or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`);
    }
    // 皇帝可以看到所有悄悄话
    
    const { data: whispers, error } = await query;
    
    if (error) throw error;
    
    res.json({
      code: 0,
      data: whispers
    });
  } catch (error) {
    logger.error('Get whispers error:', error);
    res.status(500).json({ error: 'Failed to get whispers' });
  }
});

/**
 * 标记悄悄话为已读
 */
router.post('/:id/read', async (req, res) => {
  const { id } = req.params;
  const { user_id, is_emperor } = req.body;
  
  try {
    const updateData: any = {};
    
    if (is_emperor) {
      updateData.read_by_emperor = true;
    } else {
      updateData.read_by_recipient = true;
    }
    
    const { error } = await supabase
      .from('whispers')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      code: 0,
      message: 'Marked as read'
    });
  } catch (error) {
    logger.error('Mark whisper as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;
