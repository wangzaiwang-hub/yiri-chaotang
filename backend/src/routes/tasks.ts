import express from 'express';
import { supabase } from '../lib/supabase';
import { secondMeService } from '../services/secondme.service';
import { grudgeService } from '../services/grudge.service';
import { logger } from '../utils/logger';
import { wsService } from '../lib/websocket';
import * as sarcasmLogsService from '../services/sarcasm-logs.service';

const router = express.Router();

/**
 * 判断任务是否匹配大臣的部门专长
 * 返回怨气值调整：匹配则减少，不匹配则增加
 */
function getTaskDepartmentMatch(taskDescription: string, department: string): { 
  isMatch: boolean; 
  grudgeAdjustment: number;
  reason: string;
} {
  const desc = taskDescription.toLowerCase();
  
  // 定义每个部门的关键词和擅长领域
  const departmentKeywords: Record<string, { keywords: string[]; description: string }> = {
    'hubu': {
      keywords: ['数据', '报表', '统计', '分析', '财务', '预算', '成本', '收入', '支出', '账目', '计算', '表格'],
      description: '户部擅长数据处理和财务分析'
    },
    'libu': {
      keywords: ['文档', '报告', '规范', '制度', '文案', '撰写', '编写', '说明书', '手册', '文章', '礼仪', '规则'],
      description: '礼部擅长文档撰写和规范制定'
    },
    'bingbu': {
      keywords: ['代码', '开发', '编程', '算法', 'bug', '修复', '功能', '实现', '技术', '程序', '系统', '接口'],
      description: '兵部擅长代码开发和技术实现'
    },
    'xingbu': {
      keywords: ['审计', '检查', '审核', '合规', '安全', '风险', '漏洞', '测试', '验证', '监督', '评估'],
      description: '刑部擅长安全审计和合规检查'
    },
    'gongbu': {
      keywords: ['部署', '发布', '上线', '运维', '服务器', '环境', '配置', 'ci/cd', '构建', '基础设施'],
      description: '工部擅长部署和基础设施'
    },
    'libu_hr': {
      keywords: ['人事', '招聘', '培训', '团队', '协调', '沟通', '管理', '组织', '安排', '调度'],
      description: '吏部擅长人事管理和团队协调'
    },
    'zhongshu': {
      keywords: ['规划', '方案', '设计', '策划', '需求', '分析', '拆解', '计划', '架构'],
      description: '中书省擅长规划和方案设计'
    },
    'menxia': {
      keywords: ['审核', '审查', '评审', '检查', '封驳', '审批', '把关'],
      description: '门下省擅长审核和把关'
    },
    'shangshu': {
      keywords: ['协调', '执行', '跟踪', '汇总', '管理', '推进', '落实'],
      description: '尚书省擅长协调和执行管理'
    }
  };
  
  const deptInfo = departmentKeywords[department];
  if (!deptInfo) {
    return { isMatch: false, grudgeAdjustment: 5, reason: '未知部门' };
  }
  
  // 检查任务描述是否包含部门的关键词
  const matchedKeywords = deptInfo.keywords.filter(keyword => desc.includes(keyword));
  
  if (matchedKeywords.length > 0) {
    // 匹配：减少怨气值
    return {
      isMatch: true,
      grudgeAdjustment: -3, // 做擅长的事，怨气减少
      reason: `这正是${deptInfo.description.split('擅长')[0]}的专长！`
    };
  } else {
    // 不匹配：增加怨气值
    return {
      isMatch: false,
      grudgeAdjustment: 8, // 做不擅长的事，怨气增加更多
      reason: `这不是${deptInfo.description.split('擅长')[0]}擅长的领域...`
    };
  }
}

/**
 * 皇帝下旨（创建任务）
 */
router.post('/', async (req, res) => {
  const {
    court_id,
    emperor_id,
    assignee_id,
    title,
    description,
    task_type,
    deadline,
    grudge_reward
  } = req.body;
  
  try {
    const { data: task, error } = await supabase
      .from('virtual_tasks')
      .insert({
        court_id,
        emperor_id,
        assignee_id,
        title,
        description,
        task_type,
        deadline,
        grudge_reward: grudge_reward || 10,
        status: 'pending',  // 待中书省规划
        approval_status: 'pending',
        conversation_history: [{
          role: 'emperor',
          content: description,
          timestamp: new Date().toISOString()
        }],
        rejection_count: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 尝试创建任务分配日志（失败不影响任务创建）
    try {
      // 获取大臣的用户名（用于日志）
      const { data: assigneeUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', assignee_id)
        .single();
      
      const ministerName = assigneeUser?.nickname || '大臣';
      
      // 创建任务分配日志
      await sarcasmLogsService.logTaskAssignment(
        court_id,
        assignee_id,
        ministerName,
        title,
        task.id
      );
      
      logger.info(`📝 创建任务分配日志: ${ministerName} - ${title}`);
    } catch (logError) {
      logger.error('创建任务分配日志失败:', logError);
    }
    
    // 获取大臣的 token（用于调用大臣的虚拟人）
    const { data: assigneeToken } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', assignee_id)
      .single();
    
    if (assigneeToken) {
      // 异步发送任务给大臣的虚拟人
      (async () => {
        try {
          // 获取大臣的怨气值和部门
          const { data: memberData } = await supabase
            .from('court_members')
            .select('grudge_value, department')
            .eq('court_id', court_id)
            .eq('user_id', assignee_id)
            .single();
          
          const grudgeValue = memberData?.grudge_value || 0;
          const department = memberData?.department || '';
          
          // 判断任务是否匹配大臣的部门专长
          const matchResult = getTaskDepartmentMatch(description, department);
          
          // 根据匹配度调整怨气值
          const newGrudgeValue = Math.max(0, Math.min(100, grudgeValue + matchResult.grudgeAdjustment));
          
          // 更新怨气值
          await supabase
            .from('court_members')
            .update({ grudge_value: newGrudgeValue })
            .eq('court_id', court_id)
            .eq('user_id', assignee_id);
          
          logger.info(`任务匹配度: ${matchResult.isMatch ? '匹配' : '不匹配'}, 怨气调整: ${matchResult.grudgeAdjustment}, 原因: ${matchResult.reason}`);
          
          // 构造任务消息，包含怨气值和匹配度信息
          const taskMessage = `【皇帝圣旨】

任务：${title}

详情：${description}

【你的当前状态】
怨气值：${newGrudgeValue}/100
任务匹配度：${matchResult.isMatch ? '✓ 擅长领域' : '✗ 非擅长领域'}
${matchResult.reason}

${newGrudgeValue < 30 ? '（你心情还不错，愿意好好干活）' : newGrudgeValue < 60 ? '（你开始有点不爽了，但还能忍）' : newGrudgeValue < 80 ? '（你已经很不爽了，语气会带着怨气）' : '（你快要爆发了，非常憋屈和不满）'}

${matchResult.isMatch ? '这正是你擅长的工作，你会更有动力和信心完成。' : '这不是你擅长的领域，你会感到更加烦躁和不满。'}

请你作为大臣，接受这个任务并给出你的想法和计划。根据你的怨气值和任务匹配度，适当表达你的情绪。如果任务需要实际操作（如创建文档、制作演示文稿、分析数据等），你可以使用工具来完成。`;
          
          // 调用大臣的虚拟人聊天 API（带工具调用）
          // executeTaskWithTools 会自动处理工具调用并返回清理后的最终回复
          const fullResponse = await secondMeService.executeTaskWithTools(
            assigneeToken.access_token,
            taskMessage,
            task.session_id,
            'minister'
          );
          
          logger.info('SecondMe avatar response received (cleaned)');
          
          // 更新对话历史
          const conversationHistory = task.conversation_history || [];
          conversationHistory.push({
            role: 'minister',
            content: fullResponse,
            timestamp: new Date().toISOString()
          });
          
          // 获取最新的任务数据
          const { data: latestTask } = await supabase
            .from('virtual_tasks')
            .select('*')
            .eq('id', task.id)
            .single();
          
          // 保存虚拟人的回复到任务（确保是清理后的内容）
          const { data: updatedTask } = await supabase
            .from('virtual_tasks')
            .update({
              result: fullResponse,
              status: 'in_progress',
              conversation_history: conversationHistory
            })
            .eq('id', task.id)
            .select()
            .single();
          
          // 广播任务更新（确保广播的是清理后的内容）
          wsService.broadcastToCourt(court_id, {
            type: 'task_updated',
            task: updatedTask
          });
          
          logger.info('Task sent to SecondMe avatar successfully');
        } catch (err) {
          logger.error('Failed to send task to SecondMe:', err);
        }
      })();
    } else {
      logger.warn('Cannot send to SecondMe: assignee token not found');
    }
    
    // 通过 WebSocket 广播新任务
    wsService.broadcastToCourt(court_id, {
      type: 'new_task',
      task
    });
    
    res.json({
      code: 0,
      data: task
    });
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * 中书省规划任务
 */
router.post('/:id/plan', async (req, res) => {
  const { id } = req.params;
  const { planner_id } = req.body;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 验证规划者是中书省成员
    const { data: member } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', task.court_id)
      .eq('user_id', planner_id)
      .eq('department', 'zhongshu')
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Only Zhongshu Province can plan tasks' });
    }
    
    // 获取规划者的 Token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', planner_id)
      .single();
    
    if (!tokenData) {
      return res.status(400).json({ error: 'User not authorized with SecondMe' });
    }
    
    // 更新任务状态
    await supabase
      .from('virtual_tasks')
      .update({ 
        status: 'planning',
        assignee_id: planner_id
      })
      .eq('id', id);
    
    // 调用 SecondMe AI 规划任务
    const planPrompt = `请为以下任务制定详细的执行方案，并拆解为子任务分配给各部门：

任务标题：${task.title}
任务描述：${task.description}

请按以下格式输出：
1. 整体方案概述
2. 子任务列表（每个子任务包含：部门、标题、描述）

可分配的部门：
- hubu（户部）：数据处理、报表生成
- libu（礼部）：文档撰写、规范制定
- bingbu（兵部）：代码开发、算法实现
- xingbu（刑部）：安全审计、合规检查
- gongbu（工部）：部署运维、基础设施
- libu_hr（吏部）：人事管理、成员协调`;
    
    const stream = await secondMeService.executeTask(
      tokenData.access_token,
      planPrompt,
      task.session_id,
      'zhongshu'
    );
    
    // 设置 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullPlan = '';
    
    for await (const chunk of stream) {
      fullPlan += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    // 保存规划方案
    await supabase
      .from('virtual_tasks')
      .update({
        plan: fullPlan,
        status: 'reviewing'  // 提交门下省审核
      })
      .eq('id', id);
    
  } catch (error) {
    logger.error('Plan task error:', error);
    res.status(500).json({ error: 'Failed to plan task' });
  }
});

/**
 * 门下省审核任务
 */
router.post('/:id/review', async (req, res) => {
  const { id } = req.params;
  const { reviewer_id, approved, comment } = req.body;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 验证审核者是门下省成员
    const { data: member } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', task.court_id)
      .eq('user_id', reviewer_id)
      .eq('department', 'menxia')
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Only Menxia Province can review tasks' });
    }
    
    // 获取审核者的 Token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', reviewer_id)
      .single();
    
    if (!tokenData) {
      return res.status(400).json({ error: 'User not authorized with SecondMe' });
    }
    
    // 调用 SecondMe AI 审核方案
    const reviewPrompt = `请审核以下任务规划方案，判断是否合理、完整、可行：

任务标题：${task.title}
任务描述：${task.description}
中书省规划方案：
${task.plan}

请给出审核意见：
1. 方案是否合理？
2. 是否有遗漏或不足？
3. 建议准奏还是封驳？`;
    
    const stream = await secondMeService.executeTask(
      tokenData.access_token,
      reviewPrompt,
      task.session_id,
      'menxia'
    );
    
    // 设置 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullReview = '';
    
    for await (const chunk of stream) {
      fullReview += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    // 保存审核意见
    const newStatus = approved ? 'approved' : 'rejected';
    await supabase
      .from('virtual_tasks')
      .update({
        review_comment: comment || fullReview,
        status: newStatus
      })
      .eq('id', id);
    
  } catch (error) {
    logger.error('Review task error:', error);
    res.status(500).json({ error: 'Failed to review task' });
  }
});

/**
 * 尚书省派发任务
 */
router.post('/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const { dispatcher_id } = req.body;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.status !== 'approved') {
      return res.status(400).json({ error: 'Task must be approved before dispatch' });
    }
    
    // 验证派发者是尚书省成员
    const { data: member } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', task.court_id)
      .eq('user_id', dispatcher_id)
      .eq('department', 'shangshu')
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Only Shangshu Province can dispatch tasks' });
    }
    
    // 更新任务状态
    await supabase
      .from('virtual_tasks')
      .update({ 
        status: 'dispatching',
        assignee_id: dispatcher_id
      })
      .eq('id', id);
    
    // TODO: 解析 plan 中的子任务，创建子任务记录
    // 这里简化处理，直接标记为 executing
    await supabase
      .from('virtual_tasks')
      .update({ status: 'executing' })
      .eq('id', id);
    
    res.json({
      code: 0,
      data: { message: 'Task dispatched successfully' }
    });
    
  } catch (error) {
    logger.error('Dispatch task error:', error);
    res.status(500).json({ error: 'Failed to dispatch task' });
  }
});

/**
 * 获取任务列表
 */
router.get('/', async (req, res) => {
  const { court_id, status } = req.query;
  
  try {
    let query = supabase
      .from('virtual_tasks')
      .select(`
        *,
        emperor:users!emperor_id(*),
        assignee:users!assignee_id(*)
      `)
      .order('created_at', { ascending: false });
    
    if (court_id) {
      query = query.eq('court_id', court_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: tasks } = await query;
    
    res.json({
      code: 0,
      data: tasks
    });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

/**
 * 获取任务详情
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select(`
        *,
        emperor:users!emperor_id(*),
        assignee:users!assignee_id(*)
      `)
      .eq('id', id)
      .single();
    
    res.json({
      code: 0,
      data: task
    });
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

/**
 * 六部执行任务（SSE 流式响应）
 */
router.post('/:id/execute', async (req, res) => {
  const { id } = req.params;
  const { executor_id } = req.body;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 获取执行者信息
    const { data: member } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', task.court_id)
      .eq('user_id', executor_id)
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this court' });
    }
    
    // 验证执行者是六部成员
    const sixDepartments = ['hubu', 'libu', 'bingbu', 'xingbu', 'gongbu', 'libu_hr'];
    if (!sixDepartments.includes(member.department)) {
      return res.status(403).json({ error: 'Only Six Ministries can execute tasks' });
    }
    
    // 获取执行者的 SecondMe Token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', executor_id)
      .single();
    
    if (!tokenData) {
      return res.status(400).json({ error: 'User not authorized with SecondMe' });
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 更新任务状态
    await supabase
      .from('virtual_tasks')
      .update({ 
        status: 'executing',
        assignee_id: executor_id,
        department: member.department
      })
      .eq('id', id);
    
    // 调用虚拟分身执行任务
    const stream = await secondMeService.executeTask(
      tokenData.access_token,
      task.description,
      task.session_id,
      member.department
    );
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    // 保存完整回复
    await supabase
      .from('virtual_tasks')
      .update({
        result: fullResponse,
        status: 'reporting',  // 等待尚书省汇总
        completed_at: new Date().toISOString()
      })
      .eq('id', id);
    
    // 增加怨气值
    await grudgeService.addGrudgeForTask(
      task.court_id,
      executor_id,
      id,
      task.grudge_reward
    );
    
  } catch (error) {
    logger.error('Task execution error:', error);
    res.status(500).json({ error: 'Task execution failed' });
  }
});

/**
 * 尚书省汇总任务结果
 */
router.post('/:id/report', async (req, res) => {
  const { id } = req.params;
  const { reporter_id } = req.body;
  
  try {
    // 获取任务信息
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 验证汇总者是尚书省成员
    const { data: member } = await supabase
      .from('court_members')
      .select('*')
      .eq('court_id', task.court_id)
      .eq('user_id', reporter_id)
      .eq('department', 'shangshu')
      .single();
    
    if (!member) {
      return res.status(403).json({ error: 'Only Shangshu Province can report tasks' });
    }
    
    // 获取汇总者的 Token
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', reporter_id)
      .single();
    
    if (!tokenData) {
      return res.status(400).json({ error: 'User not authorized with SecondMe' });
    }
    
    // 调用 SecondMe AI 汇总结果
    const reportPrompt = `请汇总以下任务的执行结果，形成奏折回报皇帝：

任务标题：${task.title}
任务描述：${task.description}
执行结果：
${task.result}

请按以下格式输出奏折：
1. 任务完成情况概述
2. 主要成果
3. 存在的问题（如有）
4. 建议`;
    
    const stream = await secondMeService.executeTask(
      tokenData.access_token,
      reportPrompt,
      task.session_id,
      'shangshu'
    );
    
    // 设置 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullReport = '';
    
    for await (const chunk of stream) {
      fullReport += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
    // 保存奏折并标记任务完成
    await supabase
      .from('virtual_tasks')
      .update({
        result: fullReport,
        status: 'completed'
      })
      .eq('id', id);
    
  } catch (error) {
    logger.error('Report task error:', error);
    res.status(500).json({ error: 'Failed to report task' });
  }
});

/**
 * 皇帝批准任务（准奏）
 */
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  
  try {
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 尝试创建任务成功日志（失败不影响批准流程）
    try {
      // 获取大臣的用户名（用于日志）
      const { data: assigneeUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', task.assignee_id)
        .single();
      
      const ministerName = assigneeUser?.nickname || '大臣';
      
      // 创建任务成功日志（准奏）
      await sarcasmLogsService.logTaskSuccess(
        task.court_id,
        task.assignee_id,
        ministerName,
        task.title,
        task.id,
        85 // 准奏默认给 85 分
      );
      
      logger.info(`📝 创建任务成功日志: ${ministerName} - ${task.title}`);
    } catch (logError) {
      logger.error('创建任务成功日志失败:', logError);
    }
    
    // 获取大臣的 token
    const { data: assigneeToken } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', task.assignee_id)
      .single();
    
    if (!assigneeToken) {
      return res.status(400).json({ error: 'Assignee token not found' });
    }
    
    // 获取大臣的怨气值
    const { data: memberData } = await supabase
      .from('court_members')
      .select('grudge_value')
      .eq('court_id', task.court_id)
      .eq('user_id', task.assignee_id)
      .single();
    
    const grudgeValue = memberData?.grudge_value || 0;
    
    // 更新对话历史
    const conversationHistory = task.conversation_history || [];
    
    // 构造皇帝的准奏消息
    let emperorMessage = '【准奏】朕已批准你的方案';
    if (feedback && feedback !== '准奏') {
      emperorMessage += `，${feedback}`;
    } else {
      emperorMessage += '，按你的方案继续下一步吧。';
    }
    
    conversationHistory.push({
      role: 'emperor',
      content: emperorMessage,
      timestamp: new Date().toISOString()
    });
    
    // 先更新任务状态为 in_progress，保持 approval_status 为 pending
    const { data: updatedTask } = await supabase
      .from('virtual_tasks')
      .update({
        status: 'in_progress',
        approval_status: 'pending',  // 保持 pending，以便继续准驳
        feedback,
        conversation_history: conversationHistory
      })
      .eq('id', id)
      .select()
      .single();
    
    // 异步通知大臣开始执行
    (async () => {
      try {
        // 构造执行通知消息，包含怨气值和皇帝的补充说明
        let executeMessage = `【皇帝准奏】

皇帝已批准你的方案！

原任务：${task.description}

你的方案：
${task.result}

皇帝指示：${feedback && feedback !== '准奏' ? feedback : '按你的方案，继续下一步。'}

【你的当前状态】
怨气值：${grudgeValue}/100
${grudgeValue < 30 ? '（你心情还不错，愿意好好干活）' : grudgeValue < 60 ? '（你开始有点不爽了，但还能忍）' : grudgeValue < 80 ? '（你已经很不爽了，语气会带着怨气）' : '（你快要爆发了，非常憋屈和不满）'}

请开始执行并汇报进展。根据你的怨气值，适当表达你的情绪。如果任务需要实际操作（如创建文档、制作演示文稿、分析数据等），你可以使用工具来完成。`;
        
        // 调用大臣的虚拟人（executeTaskWithTools 会自动清理工具调用标记）
        const fullResponse = await secondMeService.executeTaskWithTools(
          assigneeToken.access_token,
          executeMessage,
          task.session_id,
          'minister'
        );
        
        logger.info('SecondMe avatar execution response received (cleaned)');
        
        // 更新对话历史
        conversationHistory.push({
          role: 'minister',
          content: fullResponse,
          timestamp: new Date().toISOString()
        });
        
        // 后台悄悄评估任务难度，计算怨气值增量
        let grudgeIncrease = 5; // 默认增加 5 点
        try {
          logger.info('📊 开始评估任务难度...');
          const evaluationPrompt = `请评估以下任务的麻烦程度，给出 1-10 分的怨气值（1=很简单，10=非常麻烦）。只需要回复一个数字，不要其他内容。

任务：${task.description}`;
          
          const evaluationStream = await secondMeService.executeTask(
            assigneeToken.access_token,
            evaluationPrompt,
            undefined,
            'minister',
            false
          );
          
          let evaluationResult = '';
          for await (const chunk of evaluationStream) {
            evaluationResult += chunk;
          }
          
          logger.info('📊 SecondMe 评估结果:', evaluationResult);
          
          // 提取数字
          const match = evaluationResult.match(/\d+/);
          if (match) {
            grudgeIncrease = parseInt(match[0]);
            logger.info(`📊 任务难度评估: ${grudgeIncrease}/10`);
          } else {
            logger.warn('⚠️ 无法从评估结果中提取数字，使用默认值 5');
          }
        } catch (err) {
          logger.error('❌ 评估任务难度失败:', err);
        }
        
        // 更新怨气值
        const newGrudgeValue = Math.min(100, grudgeValue + grudgeIncrease);
        await supabase
          .from('court_members')
          .update({ grudge_value: newGrudgeValue })
          .eq('court_id', task.court_id)
          .eq('user_id', task.assignee_id);
        
        logger.info(`😤 怨气值更新: ${grudgeValue} -> ${newGrudgeValue} (+${grudgeIncrease})`);
        
        // 保存虚拟人的执行回复（确保是清理后的内容）
        const { data: finalTask } = await supabase
          .from('virtual_tasks')
          .update({
            result: fullResponse,
            conversation_history: conversationHistory
          })
          .eq('id', task.id)
          .select()
          .single();
        
        // 广播任务更新（确保广播的是清理后的内容）
        wsService.broadcastToCourt(task.court_id, {
          type: 'task_updated',
          task: finalTask
        });
        
        // 广播动画结束事件（气泡显示完成后会由前端触发）
        // 这里只是通知有新的 result 到达
        
        logger.info('Task execution started');
      } catch (err) {
        logger.error('Failed to notify minister:', err);
      }
    })();
    
    res.json({
      code: 0,
      data: { message: 'Task approved' }
    });
  } catch (error) {
    logger.error('Approve task error:', error);
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

/**
 * 皇帝驳回任务（驳回，需要重新设计）
 */
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  
  try {
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 尝试创建任务失败日志（失败不影响驳回流程）
    try {
      // 获取大臣的用户名（用于日志）
      const { data: assigneeUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', task.assignee_id)
        .single();
      
      const ministerName = assigneeUser?.nickname || '大臣';
      
      // 创建任务失败日志（驳回）
      await sarcasmLogsService.logTaskFailure(
        task.court_id,
        task.assignee_id,
        ministerName,
        task.title,
        task.id,
        40 // 驳回默认给 40 分
      );
      
      logger.info(`📝 创建任务失败日志: ${ministerName} - ${task.title}`);
    } catch (logError) {
      logger.error('创建任务失败日志失败:', logError);
    }
    
    // 获取大臣的 token
    const { data: assigneeToken } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', task.assignee_id)
      .single();
    
    if (!assigneeToken) {
      return res.status(400).json({ error: 'Assignee token not found' });
    }
    
    // 获取大臣的怨气值
    const { data: memberData } = await supabase
      .from('court_members')
      .select('grudge_value')
      .eq('court_id', task.court_id)
      .eq('user_id', task.assignee_id)
      .single();
    
    const grudgeValue = memberData?.grudge_value || 0;
    
    // 更新对话历史
    const conversationHistory = task.conversation_history || [];
    conversationHistory.push({
      role: 'emperor',
      content: `【驳回理由】${feedback}`,
      timestamp: new Date().toISOString()
    });
    
    // 更新任务状态，保持 approval_status 为 pending
    const { data: updatedTask } = await supabase
      .from('virtual_tasks')
      .update({
        status: 'in_progress',
        approval_status: 'pending',  // 保持 pending，以便继续准驳
        feedback,
        conversation_history: conversationHistory,
        rejection_count: (task.rejection_count || 0) + 1
      })
      .eq('id', id)
      .select()
      .single();
    
    // 异步调用大臣的虚拟人重新设计
    (async () => {
      try {
        // 构造包含上下文和怨气值的消息
        const contextMessage = `【皇帝驳回了你的方案】

原任务：${task.description}

你之前的回复：
${task.result}

皇帝的驳回理由：
${feedback}

【你的当前状态】
怨气值：${grudgeValue}/100
${grudgeValue < 30 ? '（你心情还不错，愿意好好干活）' : grudgeValue < 60 ? '（你开始有点不爽了，但还能忍）' : grudgeValue < 80 ? '（你已经很不爽了，语气会带着怨气）' : '（你快要爆发了，非常憋屈和不满）'}

请根据皇帝的意见重新设计方案。根据你的怨气值，适当表达你的情绪。如果任务需要实际操作（如创建文档、制作演示文稿、分析数据等），你可以使用工具来完成。`;
        
        // executeTaskWithTools 会自动处理工具调用并返回清理后的最终回复
        const fullResponse = await secondMeService.executeTaskWithTools(
          assigneeToken.access_token,
          contextMessage,
          task.session_id,
          'minister'
        );
        
        logger.info('SecondMe avatar re-design response received (cleaned)');
        
        // 更新对话历史
        conversationHistory.push({
          role: 'minister',
          content: fullResponse,
          timestamp: new Date().toISOString()
        });
        
        // 后台悄悄评估驳回带来的额外怨气
        let grudgeIncrease = 10; // 驳回默认增加 10 点
        try {
          logger.info('📊 开始评估驳回怨气...');
          const evaluationPrompt = `请评估被驳回重做这个任务会增加多少怨气值（1-10分，1=不太烦，10=非常烦）。只需要回复一个数字，不要其他内容。

任务：${task.description}
驳回理由：${feedback}`;
          
          const evaluationStream = await secondMeService.executeTask(
            assigneeToken.access_token,
            evaluationPrompt,
            undefined,
            'minister',
            false
          );
          
          let evaluationResult = '';
          for await (const chunk of evaluationStream) {
            evaluationResult += chunk;
          }
          
          logger.info('📊 SecondMe 驳回评估结果:', evaluationResult);
          
          // 提取数字
          const match = evaluationResult.match(/\d+/);
          if (match) {
            grudgeIncrease = parseInt(match[0]);
            logger.info(`📊 驳回怨气评估: ${grudgeIncrease}/10`);
          } else {
            logger.warn('⚠️ 无法从评估结果中提取数字，使用默认值 10');
          }
        } catch (err) {
          logger.error('❌ 评估驳回怨气失败:', err);
        }
        
        // 更新怨气值
        const newGrudgeValue = Math.min(100, grudgeValue + grudgeIncrease);
        await supabase
          .from('court_members')
          .update({ grudge_value: newGrudgeValue })
          .eq('court_id', task.court_id)
          .eq('user_id', task.assignee_id);
        
        logger.info(`😤 怨气值更新（驳回）: ${grudgeValue} -> ${newGrudgeValue} (+${grudgeIncrease})`);
        
        // 保存虚拟人的新回复（确保是清理后的内容）
        const { data: updatedTask } = await supabase
          .from('virtual_tasks')
          .update({
            result: fullResponse,
            conversation_history: conversationHistory
          })
          .eq('id', task.id)
          .select()
          .single();
        
        // 广播任务更新（确保广播的是清理后的内容）
        wsService.broadcastToCourt(task.court_id, {
          type: 'task_updated',
          task: updatedTask
        });
        
        logger.info('Task re-design completed');
      } catch (err) {
        logger.error('Failed to re-design task:', err);
      }
    })();
    
    res.json({
      code: 0,
      data: { message: 'Task rejected, minister will re-design' }
    });
  } catch (error) {
    logger.error('Reject task error:', error);
    res.status(500).json({ error: 'Failed to reject task' });
  }
});

/**
 * 皇帝结束对话（结）
 */
router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 更新任务状态为已关闭
    const { data: updatedTask } = await supabase
      .from('virtual_tasks')
      .update({
        status: 'closed',
        approval_status: 'closed'
      })
      .eq('id', id)
      .select()
      .single();
    
    // 广播任务更新
    wsService.broadcastToCourt(task.court_id, {
      type: 'task_updated',
      task: updatedTask
    });
    
    res.json({
      code: 0,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Close task error:', error);
    res.status(500).json({ error: 'Failed to close task' });
  }
});

/**
 * 生成无聊提示语（当没有大臣时）
 */
router.post('/bored-message', async (req, res) => {
  const { emperor_id } = req.body;
  
  try {
    logger.info('🤴 收到无聊提示语请求, emperor_id:', emperor_id);
    
    // 获取皇帝的 token
    const { data: emperorToken } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', emperor_id)
      .single();
    
    if (!emperorToken) {
      logger.error('❌ 皇帝 token 未找到');
      return res.status(400).json({ error: 'Emperor token not found' });
    }
    
    logger.info('✅ 找到皇帝 token，准备调用 SecondMe');
    
    // 调用 SecondMe 生成无聊提示语
    const prompt = '你是一位皇帝，现在朝堂里一个大臣都没有，你感到很无聊和孤独。请用一句话（15字以内）表达你的无聊和想要招贤纳士的心情。要有皇帝的威严但又略带无奈。不要使用 Markdown 格式。';
    
    const stream = await secondMeService.executeTask(
      emperorToken.access_token,
      prompt,
      undefined,
      'emperor',
      false
    );
    
    let message = '';
    for await (const chunk of stream) {
      message += chunk;
    }
    
    // 清理可能的 Markdown 格式
    message = message.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    
    logger.info('💬 SecondMe 生成的消息:', message);
    
    res.json({
      code: 0,
      data: { message }
    });
  } catch (error) {
    logger.error('Generate bored message error:', error);
    res.status(500).json({ error: 'Failed to generate bored message' });
  }
});

/**
 * 皇帝评价大臣（夸奖/怒骂/惩罚）
 * 根据评价类型动态调整怨气值
 */
router.post('/:id/evaluate', async (req, res) => {
  const { id } = req.params;
  const { evaluation_type, message } = req.body;
  // evaluation_type: 'praise' (夸奖), 'scold' (怒骂), 'punish' (惩罚)
  
  try {
    logger.info(`👑 皇帝评价大臣: ${evaluation_type}, 任务ID: ${id}`);
    
    const { data: task } = await supabase
      .from('virtual_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 获取大臣的 token
    const { data: assigneeToken } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', task.assignee_id)
      .single();
    
    if (!assigneeToken) {
      return res.status(400).json({ error: 'Assignee token not found' });
    }
    
    // 获取大臣当前的怨气值
    const { data: memberData } = await supabase
      .from('court_members')
      .select('grudge_value')
      .eq('court_id', task.court_id)
      .eq('user_id', task.assignee_id)
      .single();
    
    const currentGrudge = memberData?.grudge_value || 0;
    
    // 根据评价类型计算怨气值变化
    let grudgeChange = 0;
    let evaluationPrefix = '';
    
    switch (evaluation_type) {
      case 'praise':
        grudgeChange = -15; // 夸奖降低 15 点怨气值
        evaluationPrefix = '【皇帝夸奖】';
        logger.info('😊 皇帝夸奖，怨气值 -15');
        break;
      case 'scold':
        grudgeChange = 20; // 怒骂增加 20 点怨气值
        evaluationPrefix = '【皇帝怒骂】';
        logger.info('😡 皇帝怒骂，怨气值 +20');
        break;
      case 'punish':
        grudgeChange = 30; // 惩罚增加 30 点怨气值
        evaluationPrefix = '【皇帝惩罚】';
        logger.info('⚡ 皇帝惩罚，怨气值 +30');
        break;
      default:
        return res.status(400).json({ error: 'Invalid evaluation type' });
    }
    
    // 更新怨气值（限制在 0-100 之间）
    const newGrudge = Math.max(0, Math.min(100, currentGrudge + grudgeChange));
    
    await supabase
      .from('court_members')
      .update({ grudge_value: newGrudge })
      .eq('court_id', task.court_id)
      .eq('user_id', task.assignee_id);
    
    logger.info(`😤 怨气值更新: ${currentGrudge} -> ${newGrudge} (${grudgeChange > 0 ? '+' : ''}${grudgeChange})`);
    
    // 更新对话历史
    const conversationHistory = task.conversation_history || [];
    conversationHistory.push({
      role: 'emperor',
      content: `${evaluationPrefix} ${message}`,
      timestamp: new Date().toISOString()
    });
    
    // 异步让大臣回应
    (async () => {
      try {
        // 构造评价消息
        const evaluationMessage = `${evaluationPrefix}

皇帝对你说：${message}

【你的当前状态】
怨气值：${currentGrudge} -> ${newGrudge} (${grudgeChange > 0 ? '+' : ''}${grudgeChange})
${newGrudge < 30 ? '（你心情还不错）' : newGrudge < 60 ? '（你开始有点不爽了）' : newGrudge < 80 ? '（你已经很不爽了）' : '（你快要爆发了）'}

请回应皇帝的${evaluation_type === 'praise' ? '夸奖' : evaluation_type === 'scold' ? '怒骂' : '惩罚'}。记得表达你的内心OS！`;
        
        // 调用大臣的虚拟人
        const fullResponse = await secondMeService.executeTaskWithTools(
          assigneeToken.access_token,
          evaluationMessage,
          task.session_id,
          'minister'
        );
        
        logger.info('SecondMe avatar evaluation response received');
        
        // 更新对话历史
        conversationHistory.push({
          role: 'minister',
          content: fullResponse,
          timestamp: new Date().toISOString()
        });
        
        // 保存回复
        const { data: updatedTask } = await supabase
          .from('virtual_tasks')
          .update({
            result: fullResponse,
            conversation_history: conversationHistory
          })
          .eq('id', task.id)
          .select()
          .single();
        
        // 广播任务更新
        wsService.broadcastToCourt(task.court_id, {
          type: 'task_updated',
          task: updatedTask
        });
        
        logger.info('✅ 评价处理完成');
      } catch (err) {
        logger.error('❌ 处理评价回应失败:', err);
      }
    })();
    
    // 立即返回，不等待虚拟人回复
    res.json({
      code: 0,
      data: {
        message: '评价已发送',
        grudge_change: grudgeChange,
        old_grudge: currentGrudge,
        new_grudge: newGrudge
      }
    });
  } catch (error) {
    logger.error('Evaluate minister error:', error);
    res.status(500).json({ error: 'Failed to evaluate minister' });
  }
});

/**
 * 惩罚大臣 - 让大臣在 Plaza 发布羞耻言论
 */
router.post('/:id/punish', async (req, res) => {
  const { id } = req.params;
  const { punishment_content } = req.body;
  
  try {
    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // 获取大臣的 access token
    const { data: assignee } = await supabase
      .from('users')
      .select('access_token')
      .eq('id', task.assignee_id)
      .single();
    
    if (!assignee?.access_token) {
      return res.status(400).json({ error: 'Assignee access token not found' });
    }
    
    // 调用 Plaza API 发布帖子
    const plazaPost = await secondMeService.createPlazaPost(
      assignee.access_token,
      punishment_content,
      'discussion'
    );
    
    logger.info('Plaza post created:', plazaPost);
    
    // 增加怨气值（惩罚会增加怨气）
    await grudgeService.addGrudgeForPunishment(
      task.court_id,
      task.assignee_id,
      task.emperor_id,
      'social_death' // 社死类型惩罚
    );
    
    res.json({
      code: 0,
      message: 'Punishment executed successfully',
      data: {
        postId: plazaPost.postId
      }
    });
  } catch (error: any) {
    logger.error('Punish minister error:', error);
    
    // 检查是否是 Plaza 准入问题
    if (error.response?.data?.error?.includes('invitation.required')) {
      return res.status(403).json({ 
        error: 'Plaza access required',
        message: '该大臣尚未激活 Plaza 准入，无法发布帖子'
      });
    }
    
    res.status(500).json({ error: 'Failed to punish minister' });
  }
});

/**
 * 惩罚大臣 - 让大臣在 Plaza 发布羞耻言论（不依赖任务）
 * AI 自动生成羞耻文案
 */
router.post('/punish-minister', async (req, res) => {
  const { court_id, minister_id, emperor_id, punishment_task } = req.body;
  
  // 添加详细日志
  logger.info('Punish minister request:', { court_id, minister_id, emperor_id, punishment_task });
  
  // 验证必需参数
  if (!court_id || !minister_id || !emperor_id || !punishment_task) {
    logger.error('Missing required parameters:', { court_id, minister_id, emperor_id, punishment_task });
    return res.status(400).json({ 
      error: 'Missing required parameters',
      details: {
        court_id: !!court_id,
        minister_id: !!minister_id,
        emperor_id: !!emperor_id,
        punishment_task: !!punishment_task
      }
    });
  }
  
  try {
    // 获取大臣的 access token（从 user_tokens 表）
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', minister_id)
      .single();
    
    if (!tokenData?.access_token) {
      logger.error('Minister access token not found for:', minister_id);
      return res.status(400).json({ error: 'Minister access token not found' });
    }
    
    // 获取大臣的昵称
    const { data: minister } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', minister_id)
      .single();
    
    // 使用 SecondMe AI 生成羞耻文案
    logger.info('Generating punishment content with AI...');
    const systemPrompt = `【游戏角色扮演】

这是一个古风朝堂主题的轻松游戏。你正在扮演一位古代朝堂的大臣角色，在游戏中被皇上"惩罚"了。请以游戏角色的身份，在广场发布一条幽默的自我调侃帖子。

游戏设定：
- 这只是一个娱乐游戏，不是真实的惩罚
- 语气要轻松幽默，带点自嘲
- 使用古风文言文风格，但不要太严肃
- 字数控制在 80-150 字
- 不要使用 Markdown 格式

游戏中的"惩罚原因"：${punishment_task}

请以游戏角色的身份，写一段轻松幽默的自我调侃，直接输出内容即可，不要有任何前缀或解释。

示例风格：
"唉，今日被皇上点名批评，说我办事不力。想来也是，最近确实有些懈怠了。在此向皇上和诸位同僚道个歉，下次定当努力！"`;

    const aiResponse = await secondMeService.executeTask(
      tokenData.access_token,
      systemPrompt,
      undefined, // 不使用 session
      undefined, // 不使用 department
      false // 不使用工具
    );
    
    // 收集 AI 生成的内容
    let punishmentContent = '';
    for await (const chunk of aiResponse) {
      punishmentContent += chunk;
    }
    
    punishmentContent = punishmentContent.trim();
    logger.info('AI generated punishment content:', punishmentContent);
    
    // 调用 Plaza API 发布帖子
    const plazaPost = await secondMeService.createPlazaPost(
      tokenData.access_token,
      punishmentContent,
      'discussion'
    );
    
    logger.info('Plaza post created:', plazaPost);
    
    // 增加怨气值（惩罚会增加怨气）
    await grudgeService.addGrudgeForPunishment(
      court_id,
      minister_id,
      emperor_id,
      'social_death' // 社死类型惩罚
    );
    
    // 尝试创建惩罚日志（失败不影响惩罚流程）
    try {
      // 获取大臣的昵称（用于日志）
      const ministerNickname = minister?.nickname || '大臣';
      
      // 创建惩罚日志
      await sarcasmLogsService.logPunishment(
        court_id,
        minister_id,
        ministerNickname,
        'public' // 公开羞辱类型
      );
      
      logger.info(`📝 创建惩罚日志: ${ministerNickname}`);
    } catch (logError) {
      logger.error('创建惩罚日志失败:', logError);
    }
    
    res.json({
      code: 0,
      message: 'Punishment executed successfully',
      data: {
        postId: plazaPost.postId,
        content: punishmentContent // 返回生成的内容
      }
    });
  } catch (error: any) {
    logger.error('Punish minister error:', error);
    
    // 检查是否是 Plaza 准入问题
    if (error.response?.data?.error?.includes('invitation.required')) {
      return res.status(403).json({ 
        error: 'Plaza access required',
        message: '该大臣尚未激活 Plaza 准入，无法发布帖子'
      });
    }
    
    res.status(500).json({ error: 'Failed to punish minister' });
  }
});

export default router;
