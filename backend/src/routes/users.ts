import express from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * 更新朝堂成员的性别
 */
router.patch('/court-member/:courtId/:userId/gender', async (req, res) => {
  const { courtId, userId } = req.params;
  const { gender } = req.body;
  
  if (!['male', 'female', 'unknown'].includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value' });
  }
  
  try {
    const { data, error } = await supabase
      .from('court_members')
      .update({ gender })
      .eq('court_id', courtId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Update court member gender error:', error);
    res.status(500).json({ error: 'Failed to update gender' });
  }
});

/**
 * 更新用户性别（已废弃，保留用于兼容）
 */
router.patch('/:id/gender', async (req, res) => {
  const { id } = req.params;
  const { gender } = req.body;
  
  if (!['male', 'female', 'unknown'].includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender value' });
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ gender })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Update gender error:', error);
    res.status(500).json({ error: 'Failed to update gender' });
  }
});

/**
 * 获取用户信息
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * 更新用户信息
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { secondme_api_key } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ secondme_api_key })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
