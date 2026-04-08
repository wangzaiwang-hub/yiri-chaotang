import { Router, Request, Response } from 'express';
import {
  createSarcasmLog,
  getUnviewedLogs,
  getLogHistory,
  markLogsAsViewed,
  getLogProgress,
  getUnviewedLogCount
} from '../services/sarcasm-logs.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 创建毒舌日志
 * POST /api/logs/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { court_id, user_id, log_type, log_message, related_data } = req.body;

    if (!court_id || !user_id || !log_type || !log_message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const log = await createSarcasmLog(court_id, user_id, log_type, log_message, related_data);

    if (!log) {
      return res.status(500).json({
        success: false,
        message: '创建日志失败'
      });
    }

    res.json({
      success: true,
      message: '日志创建成功',
      logId: log.id
    });
  } catch (error) {
    logger.error('创建日志失败', { error });
    res.status(500).json({
      success: false,
      message: '创建日志失败'
    });
  }
});

/**
 * 获取未查看的日志
 * GET /api/logs/unviewed/:courtId/:userId
 */
router.get('/unviewed/:courtId/:userId', async (req: Request, res: Response) => {
  try {
    const { courtId, userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await getUnviewedLogs(courtId, userId, limit);
    const count = await getUnviewedLogCount(courtId, userId);

    res.json({
      success: true,
      unviewedLogs: logs,
      unviewedCount: count
    });
  } catch (error) {
    logger.error('获取未查看日志失败', { error });
    res.status(500).json({
      success: false,
      message: '获取未查看日志失败'
    });
  }
});

/**
 * 获取日志历史
 * GET /api/logs/history/:courtId/:userId
 */
router.get('/history/:courtId/:userId', async (req: Request, res: Response) => {
  try {
    const { courtId, userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await getLogHistory(courtId, userId, limit, offset);

    res.json({
      success: true,
      logs,
      total: logs.length
    });
  } catch (error) {
    logger.error('获取日志历史失败', { error });
    res.status(500).json({
      success: false,
      message: '获取日志历史失败'
    });
  }
});

/**
 * 标记日志为已查看
 * POST /api/logs/mark-viewed
 */
router.post('/mark-viewed', async (req: Request, res: Response) => {
  try {
    const { courtId, userId, logIds } = req.body;

    if (!courtId || !userId || !logIds || !Array.isArray(logIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const success = await markLogsAsViewed(courtId, userId, logIds);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: '标记日志为已查看失败'
      });
    }

    res.json({
      success: true,
      message: '标记日志为已查看成功'
    });
  } catch (error) {
    logger.error('标记日志为已查看失败', { error });
    res.status(500).json({
      success: false,
      message: '标记日志为已查看失败'
    });
  }
});

/**
 * 获取日志进度
 * GET /api/logs/progress/:courtId/:userId
 */
router.get('/progress/:courtId/:userId', async (req: Request, res: Response) => {
  try {
    const { courtId, userId } = req.params;

    const progress = await getLogProgress(courtId, userId);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    logger.error('获取日志进度失败', { error });
    res.status(500).json({
      success: false,
      message: '获取日志进度失败'
    });
  }
});

/**
 * 获取未查看日志数量
 * GET /api/logs/unviewed-count/:courtId/:userId
 */
router.get('/unviewed-count/:courtId/:userId', async (req: Request, res: Response) => {
  try {
    const { courtId, userId } = req.params;

    const count = await getUnviewedLogCount(courtId, userId);

    res.json({
      success: true,
      unviewedCount: count
    });
  } catch (error) {
    logger.error('获取未查看日志数量失败', { error });
    res.status(500).json({
      success: false,
      message: '获取未查看日志数量失败'
    });
  }
});

export default router;
