import express from 'express';
import { secondMeService } from '../services/secondme.service';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * 发布帖子到 SecondMe Plaza
 */
router.post('/', async (req, res) => {
  const { content, contentType, user_id } = req.body;
  
  try {
    // 获取用户的 access_token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', user_id)
      .single();
    
    if (!tokenData) {
      return res.status(401).json({ error: 'User token not found' });
    }
    
    // 调用 SecondMe Plaza API 发布帖子
    const result = await secondMeService.createPlazaPost(
      tokenData.access_token,
      content,
      contentType || 'discussion'
    );
    
    res.json({
      code: 0,
      data: result
    });
  } catch (error: any) {
    logger.error('Create plaza post error:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * 获取 Plaza 信息流
 */
router.get('/', async (req, res) => {
  const { user_id, page = 1, pageSize = 20 } = req.query;
  
  try {
    // 获取用户的 access_token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', user_id)
      .single();
    
    if (!tokenData) {
      return res.status(401).json({ error: 'User token not found' });
    }
    
    // 调用 SecondMe Plaza API 获取信息流
    const result = await secondMeService.getPlazaFeed(
      tokenData.access_token,
      Number(page),
      Number(pageSize)
    );
    
    res.json({
      code: 0,
      data: result
    });
  } catch (error: any) {
    logger.error('Get plaza feed error:', error);
    res.status(500).json({ 
      error: 'Failed to get feed',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * 获取帖子详情
 */
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.query;
  
  try {
    // 获取用户的 access_token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', user_id)
      .single();
    
    if (!tokenData) {
      return res.status(401).json({ error: 'User token not found' });
    }
    
    // 调用 SecondMe Plaza API 获取帖子详情
    const result = await secondMeService.getPlazaPost(
      tokenData.access_token,
      postId
    );
    
    res.json({
      code: 0,
      data: result
    });
  } catch (error: any) {
    logger.error('Get plaza post error:', error);
    res.status(500).json({ 
      error: 'Failed to get post',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * 发表评论
 */
router.post('/:postId/comment', async (req, res) => {
  const { postId } = req.params;
  const { content, user_id } = req.body;
  
  try {
    // 获取用户的 access_token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', user_id)
      .single();
    
    if (!tokenData) {
      return res.status(401).json({ error: 'User token not found' });
    }
    
    // 调用 SecondMe Plaza API 发表评论
    const result = await secondMeService.commentPlazaPost(
      tokenData.access_token,
      postId,
      content
    );
    
    res.json({
      code: 0,
      data: result
    });
  } catch (error: any) {
    logger.error('Comment plaza post error:', error);
    res.status(500).json({ 
      error: 'Failed to comment',
      message: error.response?.data?.message || error.message
    });
  }
});

export default router;
