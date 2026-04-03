import { Router } from 'express';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const router = Router();

// TTS 生成语音
router.post('/generate', async (req, res) => {
  try {
    const { text, emotion = 'fluent', userId } = req.body;

    if (!text) {
      return res.status(400).json({ error: '缺少文本参数' });
    }

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 从数据库获取用户的 access_token
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('secondme_access_token')
      .eq('id', userId)
      .single();

    if (userError || !userData?.secondme_access_token) {
      return res.status(401).json({ error: '用户未授权或未设置语音' });
    }

    // 调用 SecondMe TTS API
    const response = await axios.post(
      'https://api.mindverse.com/gate/lab/api/secondme/tts/generate',
      {
        text: text.substring(0, 10000), // 限制最大长度
        emotion,
      },
      {
        headers: {
          'Authorization': `Bearer ${userData.secondme_access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('TTS 生成失败:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'TTS 生成失败', 
      details: error.response?.data || error.message 
    });
  }
});

export default router;
