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
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData?.access_token) {
      return res.status(401).json({ 
        error: 'TTS_NOT_CONFIGURED',
        message: '该用户尚未配置语音功能',
        needsConfiguration: true
      });
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
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '';
    const isVoiceNotConfigured = 
      errorMessage.includes('voice') || 
      errorMessage.includes('语音') ||
      errorMessage.includes('TTS') ||
      error.response?.status === 403;
    
    if (isVoiceNotConfigured) {
      console.log('TTS 未配置: 用户尚未在 SecondMe 配置语音功能');
      return res.status(403).json({ 
        error: 'TTS_NOT_CONFIGURED',
        message: '该用户尚未在 SecondMe 配置语音功能',
        needsConfiguration: true,
        configUrl: 'https://second-me.cn/settings/voice'
      });
    }
    
    console.error('TTS 生成失败:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'TTS_GENERATION_FAILED',
      message: 'TTS 生成失败', 
      details: error.response?.data || error.message 
    });
  }
});

export default router;
