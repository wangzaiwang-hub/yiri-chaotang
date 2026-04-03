import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
    try {
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
      
      logger.info(`Added ${amount} grudge for user ${userId} in court ${courtId}`);
    } catch (error) {
      logger.error('addGrudgeForTask error:', error);
      throw error;
    }
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

export const grudgeService = new GrudgeService();
