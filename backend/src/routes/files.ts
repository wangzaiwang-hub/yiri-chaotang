import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * 获取输出文件列表
 */
router.get('/outputs', async (req, res) => {
  try {
    const outputDir = path.join(process.cwd(), 'outputs');
    
    // 确保目录存在
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
    
    const files = await fs.readdir(outputDir);
    
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(outputDir, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );
    
    // 按修改时间倒序排列
    fileList.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    
    res.json({
      code: 0,
      data: fileList
    });
  } catch (error) {
    logger.error('Get outputs error:', error);
    res.status(500).json({ error: 'Failed to get outputs' });
  }
});

/**
 * 下载输出文件
 */
router.get('/outputs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(process.cwd(), 'outputs', filename);
    
    // 检查文件是否存在
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 发送文件
    res.download(filepath, filename);
  } catch (error) {
    logger.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * 删除输出文件
 */
router.delete('/outputs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 安全检查
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(process.cwd(), 'outputs', filename);
    
    await fs.unlink(filepath);
    
    res.json({
      code: 0,
      data: { message: 'File deleted successfully' }
    });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
