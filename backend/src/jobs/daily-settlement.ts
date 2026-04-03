import cron from 'node-cron';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * 每日凌晨 00:00 执行结算
 */
export const dailySettlementJob = cron.schedule(
  '0 0 * * *',
  async () => {
    logger.info('Starting daily settlement...');
    
    try {
      // 获取所有朝堂
      const { data: courts } = await supabase
        .from('courts')
        .select('*');
      
      if (!courts) return;
      
      for (const court of courts) {
        await settleCourt(court.id);
      }
      
      logger.info('Daily settlement completed');
    } catch (error) {
      logger.error('Daily settlement error:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Asia/Shanghai'
  }
);

/**
 * 结算单个朝堂
 */
async function settleCourt(courtId: string) {
  try {
    // 1. 获取所有成员的怨气值
    const { data: members } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', courtId)
      .order('grudge_value', { ascending: false });
    
    if (!members || members.length === 0) return;
    
    // 2. 怨气最高者登基
    const newEmperor = members[0];
    
    logger.info(`Court ${courtId}: New emperor is ${newEmperor.user_id} with ${newEmperor.grudge_value} grudge`);
    
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
    
    logger.info(`Court ${courtId} settlement completed`);
  } catch (error) {
    logger.error(`Settlement error for court ${courtId}:`, error);
  }
}
