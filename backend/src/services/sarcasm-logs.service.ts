import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * 皇帝毒舌日志服务
 */

export interface SarcasmLog {
  id: string;
  courtId: string;
  userId: string;
  logType: string;
  logMessage: string;
  relatedData?: Record<string, any>;
  viewedByMinister: boolean;
  viewedAt?: string;
  createdAt: string;
}

export interface LogProgress {
  id: string;
  courtId: string;
  userId: string;
  lastViewedLogId?: string;
  lastViewedAt?: string;
  unviewedCount: number;
  updatedAt: string;
}

/**
 * 创建毒舌日志
 */
export async function createSarcasmLog(
  courtId: string,
  userId: string,
  logType: string,
  logMessage: string,
  relatedData?: Record<string, any>
): Promise<SarcasmLog | null> {
  try {
    const { data, error } = await supabase.rpc('create_sarcasm_log', {
      p_court_id: courtId,
      p_user_id: userId,
      p_log_type: logType,
      p_log_message: logMessage,
      p_related_data: relatedData || {}
    });

    if (error) {
      logger.error('创建毒舌日志失败', { error, courtId, userId, logType });
      return null;
    }

    logger.info('创建毒舌日志成功', { courtId, userId, logType });
    return data?.[0] || null;
  } catch (error) {
    logger.error('创建毒舌日志异常', { error, courtId, userId });
    return null;
  }
}

/**
 * 获取未查看的日志
 */
export async function getUnviewedLogs(
  courtId: string,
  userId: string,
  limit: number = 50
): Promise<SarcasmLog[]> {
  try {
    const { data, error } = await supabase.rpc('get_unviewed_logs', {
      p_court_id: courtId,
      p_user_id: userId,
      p_limit: limit
    });

    if (error) {
      logger.error('获取未查看日志失败', { error, courtId, userId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('获取未查看日志异常', { error, courtId, userId });
    return [];
  }
}

/**
 * 获取日志历史
 */
export async function getLogHistory(
  courtId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<SarcasmLog[]> {
  try {
    const { data, error } = await supabase.rpc('get_log_history', {
      p_court_id: courtId,
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      logger.error('获取日志历史失败', { error, courtId, userId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('获取日志历史异常', { error, courtId, userId });
    return [];
  }
}

/**
 * 标记日志为已查看
 */
export async function markLogsAsViewed(
  courtId: string,
  userId: string,
  logIds: string[]
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_logs_as_viewed', {
      p_court_id: courtId,
      p_user_id: userId,
      p_log_ids: logIds
    });

    if (error) {
      logger.error('标记日志为已查看失败', { error, courtId, userId });
      return false;
    }

    logger.info('标记日志为已查看成功', { courtId, userId, logCount: logIds.length });
    return true;
  } catch (error) {
    logger.error('标记日志为已查看异常', { error, courtId, userId });
    return false;
  }
}

/**
 * 获取日志进度
 */
export async function getLogProgress(
  courtId: string,
  userId: string
): Promise<LogProgress | null> {
  try {
    const { data, error } = await supabase
      .from('minister_log_progress')
      .select('*')
      .eq('court_id', courtId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('获取日志进度失败', { error, courtId, userId });
      return null;
    }

    return data || null;
  } catch (error) {
    logger.error('获取日志进度异常', { error, courtId, userId });
    return null;
  }
}

/**
 * 获取未查看日志数量
 */
export async function getUnviewedLogCount(
  courtId: string,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('emperor_sarcasm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('court_id', courtId)
      .eq('user_id', userId)
      .eq('viewed_by_minister', false);

    if (error) {
      logger.error('获取未查看日志数量失败', { error, courtId, userId });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('获取未查看日志数量异常', { error, courtId, userId });
    return 0;
  }
}

/**
 * 任务分配日志
 */
export async function logTaskAssignment(
  courtId: string,
  ministerId: string,
  ministerName: string,
  taskName: string,
  taskId: string
): Promise<void> {
  // 判断是任务还是对话
  const isTask = taskName.includes('写') || taskName.includes('做') || taskName.includes('完成') || 
                 taskName.includes('准备') || taskName.includes('整理') || taskName.includes('分析') ||
                 taskName.includes('报告') || taskName.includes('方案') || taskName.includes('计划');
  
  let message: string;
  
  if (isTask) {
    // 任务类型的讽刺消息
    const taskMessages = [
      `皇帝让${ministerName}去${taskName}，${ministerName}连屁都不敢放，乖乖接受了`,
      `皇帝让${ministerName}去${taskName}，${ministerName}虽然很不情愿，但还是接受了`,
      `皇帝让${ministerName}去${taskName}，${ministerName}战战兢兢地接受了，生怕拒绝`,
      `皇帝吩咐${ministerName}${taskName}，${ministerName}只能硬着头皮答应了`,
      `皇帝命令${ministerName}${taskName}，${ministerName}心里一万个不愿意，但还是接了`
    ];
    message = taskMessages[Math.floor(Math.random() * taskMessages.length)];
  } else {
    // 对话类型的讽刺消息
    const chatMessages = [
      `皇帝对${ministerName}说："${taskName}"，${ministerName}只能唯唯诺诺地听着`,
      `皇帝跟${ministerName}说了句"${taskName}"，${ministerName}连大气都不敢出`,
      `皇帝："${taskName}"，${ministerName}听了只能点头哈腰`,
      `皇帝对${ministerName}说："${taskName}"，${ministerName}战战兢兢地回应`,
      `皇帝说："${taskName}"，${ministerName}吓得赶紧表态`
    ];
    message = chatMessages[Math.floor(Math.random() * chatMessages.length)];
  }

  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${message}`;

  await createSarcasmLog(courtId, ministerId, 'task_assigned', logMessage, {
    taskId,
    taskName
  });
}

/**
 * 任务失败日志
 */
export async function logTaskFailure(
  courtId: string,
  ministerId: string,
  ministerName: string,
  taskName: string,
  taskId: string,
  score: number
): Promise<void> {
  // 判断是任务还是对话
  const isTask = taskName.includes('写') || taskName.includes('做') || taskName.includes('完成') || 
                 taskName.includes('准备') || taskName.includes('整理') || taskName.includes('分析') ||
                 taskName.includes('报告') || taskName.includes('方案') || taskName.includes('计划') ||
                 taskName.includes('设计') || taskName.includes('开发') || taskName.includes('实施');
  
  let message: string;
  
  if (isTask) {
    // 任务类型的驳回消息
    const taskFailureMessages = [
      `${ministerName}的"${taskName}"被驳回了，${score}分的成绩，皇帝看了一眼就摇头了`,
      `${ministerName}"${taskName}"做得一塌糊涂，${score}分，皇帝说"这都做不好？"`,
      `${ministerName}的"${taskName}"被打回重做，${score}分，皇帝直接扔到一边了`,
      `${ministerName}"${taskName}"不合格，${score}分，皇帝说"重新做！"`,
      `${ministerName}的"${taskName}"被驳回，${score}分，皇帝说"就这水平？"`
    ];
    message = taskFailureMessages[Math.floor(Math.random() * taskFailureMessages.length)];
  } else {
    // 对话类型的驳回消息
    const chatFailureMessages = [
      `${ministerName}对"${taskName}"的回应让皇帝很不满意，${score}分，皇帝说"这都说不好？"`,
      `皇帝对${ministerName}关于"${taskName}"的回答很失望，${score}分，直接驳回了`,
      `${ministerName}回应"${taskName}"时表现糟糕，${score}分，皇帝说"重新想想！"`,
      `皇帝对${ministerName}的回答不满意，${score}分，说"就这？"`,
      `${ministerName}的回应让皇帝摇头，${score}分，"再想想怎么说"`
    ];
    message = chatFailureMessages[Math.floor(Math.random() * chatFailureMessages.length)];
  }

  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${message}`;

  await createSarcasmLog(courtId, ministerId, 'task_failed', logMessage, {
    taskId,
    taskName,
    score
  });
}

/**
 * 任务成功日志
 */
export async function logTaskSuccess(
  courtId: string,
  ministerId: string,
  ministerName: string,
  taskName: string,
  taskId: string,
  score: number
): Promise<void> {
  // 判断是任务还是对话
  const isTask = taskName.includes('写') || taskName.includes('做') || taskName.includes('完成') || 
                 taskName.includes('准备') || taskName.includes('整理') || taskName.includes('分析') ||
                 taskName.includes('报告') || taskName.includes('方案') || taskName.includes('计划') ||
                 taskName.includes('设计') || taskName.includes('开发') || taskName.includes('实施');
  
  let message: string;
  
  if (isTask) {
    // 任务类型的批准消息
    if (score >= 90) {
      const excellentMessages = [
        `${ministerName}的"${taskName}"居然做得还不错，${score}分，皇帝难得地点了点头`,
        `${ministerName}这次"${taskName}"表现出人意料，${score}分，皇帝说"还算有点用"`,
        `${ministerName}"${taskName}"完成得挺好，${score}分，皇帝罕见地露出了笑容`
      ];
      message = excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
    } else if (score >= 80) {
      const goodMessages = [
        `${ministerName}"${taskName}"完成了，${score}分，皇帝勉强点了点头`,
        `${ministerName}的"${taskName}"得了${score}分，皇帝说"还行吧"`,
        `${ministerName}"${taskName}"做完了，${score}分，皇帝说"可以接受"`
      ];
      message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    } else {
      const okMessages = [
        `${ministerName}"${taskName}"总算完成了，${score}分，皇帝看了一眼就放下了`,
        `${ministerName}的"${taskName}"得了${score}分，皇帝说"凑合吧"`,
        `${ministerName}"${taskName}"做完了，${score}分，皇帝没说什么就批准了`
      ];
      message = okMessages[Math.floor(Math.random() * okMessages.length)];
    }
  } else {
    // 对话类型的批准消息
    if (score >= 90) {
      const excellentMessages = [
        `${ministerName}对"${taskName}"的回应让皇帝满意，${score}分，皇帝点了点头`,
        `${ministerName}关于"${taskName}"的回答不错，${score}分，皇帝说"还算会说话"`,
        `皇帝对${ministerName}的回应很满意，${score}分，"这次说得好"`
      ];
      message = excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
    } else if (score >= 80) {
      const goodMessages = [
        `${ministerName}对"${taskName}"的回应还行，${score}分，皇帝勉强点了点头`,
        `皇帝对${ministerName}的回答表示认可，${score}分，"还行吧"`,
        `${ministerName}的回应得了${score}分，皇帝说"可以"`
      ];
      message = goodMessages[Math.floor(Math.random() * goodMessages.length)];
    } else {
      const okMessages = [
        `${ministerName}的回应凑合，${score}分，皇帝看了一眼就批准了`,
        `皇帝对${ministerName}的回答不置可否，${score}分，"算了，就这样吧"`,
        `${ministerName}的回应得了${score}分，皇帝没说什么就过了`
      ];
      message = okMessages[Math.floor(Math.random() * okMessages.length)];
    }
  }

  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${message}`;

  await createSarcasmLog(courtId, ministerId, 'task_success', logMessage, {
    taskId,
    taskName,
    score
  });
}

/**
 * 排名变化日志
 */
export async function logRankingChange(
  courtId: string,
  ministerId: string,
  ministerName: string,
  oldRank: number,
  newRank: number,
  oldScore: number,
  newScore: number
): Promise<void> {
  let rankingMessage = '';
  if (newRank > oldRank) {
    rankingMessage = `${ministerName}的排名从第${oldRank}位下降到第${newRank}位，无能指数从${oldScore.toFixed(1)}升到${newScore.toFixed(1)}`;
  } else {
    rankingMessage = `${ministerName}的排名从第${oldRank}位上升到第${newRank}位，无能指数从${oldScore.toFixed(1)}降到${newScore.toFixed(1)}`;
  }

  const rankingReactions = [
    `${ministerName}的脸都绿了`,
    `${ministerName}的脸都红了`,
    `${ministerName}的心都凉了`,
    `${ministerName}开始后悔了`,
    `${ministerName}开始绝望了`
  ];

  const reaction = rankingReactions[Math.floor(Math.random() * rankingReactions.length)];
  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${rankingMessage}，${reaction}`;

  await createSarcasmLog(courtId, ministerId, 'ranking_changed', logMessage, {
    oldRank,
    newRank,
    oldScore,
    newScore
  });
}

/**
 * 皇帝嘲笑日志
 */
export async function logEmperorMocking(
  courtId: string,
  ministerId: string,
  ministerName: string,
  mockingMessage: string
): Promise<void> {
  const mockingLogs = [
    `皇帝看着${ministerName}的排行榜排名，说'${mockingMessage}'`,
    `皇帝看着${ministerName}的失败历史，说'${mockingMessage}'`,
    `皇帝看着${ministerName}的无能指数，说'${mockingMessage}'`
  ];

  const log = mockingLogs[Math.floor(Math.random() * mockingLogs.length)];
  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${log}`;

  await createSarcasmLog(courtId, ministerId, 'emperor_mocking', logMessage, {
    mockingMessage
  });
}

/**
 * 惩罚日志
 */
export async function logPunishment(
  courtId: string,
  ministerId: string,
  ministerName: string,
  punishmentType: string
): Promise<void> {
  const punishmentMessages: Record<string, string[]> = {
    virtual: [
      `皇帝对${ministerName}进行了虚拟惩罚，${ministerName}下的连连磕头，求饶都没用`,
      `皇帝对${ministerName}进行了虚拟惩罚，${ministerName}虽然很生气，但也无可奈何`
    ],
    public: [
      `皇帝在朝堂中公开羞辱了${ministerName}，${ministerName}的脸都红了，但还是无法反驳`,
      `皇帝在朝堂中嘲笑了${ministerName}，${ministerName}虽然很委屈，但也只能接受`
    ],
    salary: [
      `皇帝扣除了${ministerName}的工资，${ministerName}虽然很生气，但也无可奈何`,
      `皇帝扣除了${ministerName}的工资，${ministerName}虽然很愤怒，但也无法反抗`
    ]
  };

  const messages = punishmentMessages[punishmentType] || punishmentMessages.virtual;
  const message = messages[Math.floor(Math.random() * messages.length)];
  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${message}`;

  await createSarcasmLog(courtId, ministerId, 'punishment', logMessage, {
    punishmentType
  });
}

/**
 * 奖励日志
 */
export async function logReward(
  courtId: string,
  ministerId: string,
  ministerName: string,
  rewardType: string,
  rewardAmount?: number
): Promise<void> {
  const rewardMessages: Record<string, string[]> = {
    salary: [
      `皇帝给${ministerName}加薪${rewardAmount}%，${ministerName}虽然很感谢，但也知道皇帝随时可以收回`,
      `皇帝给${ministerName}加薪${rewardAmount}%，${ministerName}虽然很高兴，但还是有点不安`
    ],
    promotion: [
      `皇帝提拔了${ministerName}为高级大臣，${ministerName}虽然很荣幸，但也知道这是暂时的`,
      `皇帝提拔了${ministerName}，${ministerName}虽然很感谢，但也知道皇帝随时可以撤销`
    ],
    reward: [
      `皇帝赏赐了${ministerName}${rewardAmount}两银子，${ministerName}虽然很高兴，但还是有点不安`,
      `皇帝赏赐了${ministerName}，${ministerName}虽然很感谢，但也知道这不会改变什么`
    ]
  };

  const messages = rewardMessages[rewardType] || rewardMessages.reward;
  const message = messages[Math.floor(Math.random() * messages.length)];
  const logMessage = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}] ${message}`;

  await createSarcasmLog(courtId, ministerId, 'reward', logMessage, {
    rewardType,
    rewardAmount
  });
}
