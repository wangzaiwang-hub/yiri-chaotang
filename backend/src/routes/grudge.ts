import express from 'express';
import { supabase } from '../lib/supabase';
import { grudgeService } from '../services/grudge.service';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * 获取复仇清单
 */
router.get('/records', async (req, res) => {
  const { user_id, court_id } = req.query;
  
  try {
    const { data: records } = await supabase
      .from('grudge_records')
      .select(`
        *,
        caused_by:users!caused_by_id(*)
      `)
      .eq('user_id', user_id)
      .eq('court_id', court_id)
      .order('created_at', { ascending: false });
    
    res.json({
      code: 0,
      data: records
    });
  } catch (error) {
    logger.error('Get grudge records error:', error);
    res.status(500).json({ error: 'Failed to get grudge records' });
  }
});

/**
 * 获取怨气排行
 */
router.get('/ranking/:courtId', async (req, res) => {
  const { courtId } = req.params;
  
  try {
    const ranking = await grudgeService.getGrudgeRanking(courtId);
    
    res.json({
      code: 0,
      data: ranking
    });
  } catch (error) {
    logger.error('Get grudge ranking error:', error);
    res.status(500).json({ error: 'Failed to get grudge ranking' });
  }
});

export default router;
