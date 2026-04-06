import express from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * 创建朝堂
 */
router.post('/', async (req, res) => {
  const { name, description, user_id } = req.body;
  
  try {
    // 创建朝堂
    const { data: court, error } = await supabase
      .from('courts')
      .insert({
        name,
        description,
        creator_id: user_id,
        current_emperor_id: user_id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 添加创建者为成员（皇帝）
    await supabase
      .from('court_members')
      .insert({
        court_id: court.id,
        user_id: user_id,
        role: 'emperor',
        department: 'emperor',
        grudge_value: 0
      });
    
    res.json({
      code: 0,
      data: court
    });
  } catch (error) {
    logger.error('Create court error:', error);
    res.status(500).json({ error: 'Failed to create court' });
  }
});

/**
 * 获取用户所在的朝堂列表
 */
router.get('/', async (req, res) => {
  const userId = req.query.user_id as string;
  
  try {
    const { data: members } = await supabase
      .from('court_members')
      .select('court_id, courts(*), joined_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }); // 按加入时间倒序，最新的在前
    
    const courts = members?.map(m => m.courts) || [];
    
    res.json({
      code: 0,
      data: courts
    });
  } catch (error) {
    logger.error('Get courts error:', error);
    res.status(500).json({ error: 'Failed to get courts' });
  }
});

/**
 * 获取朝堂详情
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: court, error } = await supabase
      .from('courts')
      .select(`
        *,
        creator:users!creator_id(*),
        emperor:users!current_emperor_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !court) {
      logger.error('Court not found:', id);
      return res.status(404).json({ 
        code: 404,
        error: 'Court not found' 
      });
    }
    
    res.json({
      code: 0,
      data: court
    });
  } catch (error) {
    logger.error('Get court error:', error);
    res.status(500).json({ error: 'Failed to get court' });
  }
});

/**
 * 获取朝堂成员列表
 */
router.get('/:id/members', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: members } = await supabase
      .from('court_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('court_id', id)
      .order('grudge_value', { ascending: false });
    
    res.json({
      code: 0,
      data: members
    });
  } catch (error) {
    logger.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

/**
 * 邀请成员加入（需要选择部门）
 */
router.post('/:id/invite', async (req, res) => {
  const { id } = req.params;
  const { user_id, department } = req.body;
  
  try {
    // 验证部门是否有效
    const validDepartments = ['zhongshu', 'menxia', 'shangshu', 'hubu', 'libu', 'bingbu', 'xingbu', 'gongbu', 'libu_hr'];
    if (!department || !validDepartments.includes(department)) {
      return res.status(400).json({ error: 'Invalid department' });
    }
    
    const { data: member, error } = await supabase
      .from('court_members')
      .insert({
        court_id: id,
        user_id: user_id,
        role: 'minister',
        department: department,
        grudge_value: 0,
        gender: 'male' // 大臣默认为男性，不需要选择
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      code: 0,
      data: member
    });
  } catch (error) {
    logger.error('Invite member error:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

/**
 * 获取怨气排行榜
 */
router.get('/:id/ranking', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: members } = await supabase
      .from('court_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('court_id', id)
      .order('grudge_value', { ascending: false });
    
    res.json({
      code: 0,
      data: members
    });
  } catch (error) {
    logger.error('Get ranking error:', error);
    res.status(500).json({ error: 'Failed to get ranking' });
  }
});

/**
 * 王朝覆灭 - 皇帝删除整个朝堂
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  try {
    // 验证是否是皇帝
    const { data: court } = await supabase
      .from('courts')
      .select('current_emperor_id')
      .eq('id', id)
      .single();
    
    if (!court || court.current_emperor_id !== user_id) {
      return res.status(403).json({ error: 'Only emperor can destroy the court' });
    }
    
    // 删除所有成员
    await supabase
      .from('court_members')
      .delete()
      .eq('court_id', id);
    
    // 删除所有任务
    await supabase
      .from('tasks')
      .delete()
      .eq('court_id', id);
    
    // 删除朝堂
    await supabase
      .from('courts')
      .delete()
      .eq('id', id);
    
    res.json({
      code: 0,
      message: 'Court destroyed successfully'
    });
  } catch (error) {
    logger.error('Destroy court error:', error);
    res.status(500).json({ error: 'Failed to destroy court' });
  }
});

/**
 * 告老还乡 - 大臣退出朝堂
 */
router.post('/:id/leave', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  try {
    // 验证不是皇帝
    const { data: court } = await supabase
      .from('courts')
      .select('current_emperor_id')
      .eq('id', id)
      .single();
    
    if (court && court.current_emperor_id === user_id) {
      return res.status(403).json({ error: 'Emperor cannot leave, use destroy instead' });
    }
    
    // 删除成员记录
    await supabase
      .from('court_members')
      .delete()
      .eq('court_id', id)
      .eq('user_id', user_id);
    
    res.json({
      code: 0,
      message: 'Left court successfully'
    });
  } catch (error) {
    logger.error('Leave court error:', error);
    res.status(500).json({ error: 'Failed to leave court' });
  }
});

/**
 * 获取可用的人机列表（其他用户的虚拟分身）
 */
router.get('/:id/available-bots', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 获取当前朝堂的所有成员
    const { data: currentMembers } = await supabase
      .from('court_members')
      .select('user_id')
      .eq('court_id', id);
    
    const memberIds = currentMembers?.map(m => m.user_id) || [];
    
    // 获取所有用户，排除当前朝堂的成员
    const { data: availableUsers } = await supabase
      .from('users')
      .select('id, nickname, avatar_url')
      .not('id', 'in', `(${memberIds.join(',')})`)
      .limit(20); // 最多显示 20 个
    
    res.json({
      code: 0,
      data: availableUsers || []
    });
  } catch (error) {
    logger.error('Get available bots error:', error);
    res.status(500).json({ error: 'Failed to get available bots' });
  }
});

/**
 * 召唤分身（邀请人机加入，随机分配部门）
 */
router.post('/:id/summon-bot', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // 要召唤的用户ID
  
  try {
    // 随机选择一个部门
    const departments = ['zhongshu', 'menxia', 'shangshu', 'hubu', 'libu', 'bingbu', 'xingbu', 'gongbu', 'libu_hr'];
    const randomDepartment = departments[Math.floor(Math.random() * departments.length)];
    
    // 添加为朝堂成员
    const { data: member, error } = await supabase
      .from('court_members')
      .insert({
        court_id: id,
        user_id: user_id,
        role: 'minister',
        department: randomDepartment,
        grudge_value: 0,
        gender: 'male' // 默认男性
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();
    
    if (error) throw error;
    
    res.json({
      code: 0,
      data: member
    });
  } catch (error) {
    logger.error('Summon bot error:', error);
    res.status(500).json({ error: 'Failed to summon bot' });
  }
});

export default router;
