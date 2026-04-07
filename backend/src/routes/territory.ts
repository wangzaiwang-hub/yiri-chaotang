import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// 获取用户的疆土拓展数据
router.get('/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(401).json({ error: 'user_id is required' });
    }

    // 查询用户在该朝堂的疆土拓展数据
    const { data, error } = await supabase
      .from('court_members')
      .select('happiness, unlocked_scenes, current_scene')
      .eq('court_id', courtId)
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('获取疆土拓展数据失败:', error);
      return res.status(500).json({ error: '获取疆土拓展数据失败' });
    }

    res.json({
      happiness: data?.happiness || 0,
      unlockedScenes: data?.unlocked_scenes || ['default'],
      currentScene: data?.current_scene || 'default'
    });
  } catch (error) {
    console.error('获取疆土拓展数据错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新幸福值
router.post('/:courtId/happiness', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { amount, eventType, eventDescription, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'user_id is required' });
    }

    // 获取当前幸福值
    const { data: memberData, error: fetchError } = await supabase
      .from('court_members')
      .select('happiness')
      .eq('court_id', courtId)
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      console.error('获取当前幸福值失败:', fetchError);
      return res.status(500).json({ error: '获取当前幸福值失败' });
    }

    const currentHappiness = memberData?.happiness || 0;
    const newHappiness = Math.max(0, currentHappiness + amount);

    // 更新幸福值
    const { error: updateError } = await supabase
      .from('court_members')
      .update({ happiness: newHappiness })
      .eq('court_id', courtId)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('更新幸福值失败:', updateError);
      return res.status(500).json({ error: '更新幸福值失败' });
    }

    // 记录幸福值变更
    await supabase
      .from('happiness_records')
      .insert({
        court_id: courtId,
        user_id: user_id,
        event_type: eventType || 'manual',
        event_description: eventDescription || '幸福值变更',
        happiness_amount: amount
      });

    res.json({
      happiness: newHappiness,
      change: amount
    });
  } catch (error) {
    console.error('更新幸福值错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 解锁新场景
router.post('/:courtId/unlock-scene', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { sceneId, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'user_id is required' });
    }

    // 获取当前已解锁场景
    const { data: memberData, error: fetchError } = await supabase
      .from('court_members')
      .select('unlocked_scenes')
      .eq('court_id', courtId)
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      console.error('获取已解锁场景失败:', fetchError);
      return res.status(500).json({ error: '获取已解锁场景失败' });
    }

    const unlockedScenes = memberData?.unlocked_scenes || ['default'];
    
    // 如果场景已解锁，直接返回
    if (unlockedScenes.includes(sceneId)) {
      return res.json({
        unlockedScenes,
        message: '场景已解锁'
      });
    }

    // 添加新场景到已解锁列表
    const newUnlockedScenes = [...unlockedScenes, sceneId];

    // 更新已解锁场景
    const { error: updateError } = await supabase
      .from('court_members')
      .update({ unlocked_scenes: newUnlockedScenes })
      .eq('court_id', courtId)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('解锁场景失败:', updateError);
      return res.status(500).json({ error: '解锁场景失败' });
    }

    res.json({
      unlockedScenes: newUnlockedScenes,
      message: '场景解锁成功'
    });
  } catch (error) {
    console.error('解锁场景错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 切换当前场景
router.post('/:courtId/switch-scene', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { sceneId, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'user_id is required' });
    }

    // 验证场景是否已解锁
    const { data: memberData, error: fetchError } = await supabase
      .from('court_members')
      .select('unlocked_scenes')
      .eq('court_id', courtId)
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      console.error('获取已解锁场景失败:', fetchError);
      return res.status(500).json({ error: '获取已解锁场景失败' });
    }

    const unlockedScenes = memberData?.unlocked_scenes || ['default'];
    
    if (!unlockedScenes.includes(sceneId)) {
      return res.status(403).json({ error: '场景未解锁' });
    }

    // 更新当前场景
    const { error: updateError } = await supabase
      .from('court_members')
      .update({ current_scene: sceneId })
      .eq('court_id', courtId)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('切换场景失败:', updateError);
      return res.status(500).json({ error: '切换场景失败' });
    }

    res.json({
      currentScene: sceneId,
      message: '场景切换成功'
    });
  } catch (error) {
    console.error('切换场景错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有场景配置
router.get('/scenes/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('获取场景配置失败:', error);
      return res.status(500).json({ error: '获取场景配置失败' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('获取场景配置错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
