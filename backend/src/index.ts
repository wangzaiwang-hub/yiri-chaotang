// 首先加载配置和环境变量
import './config';

import express from 'express';
import cors from 'cors';
import http from 'http';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import courtRoutes from './routes/courts';
import taskRoutes from './routes/tasks';
import momentRoutes from './routes/moments';
import grudgeRoutes from './routes/grudge';
import userRoutes from './routes/users';
import fileRoutes from './routes/files';
import ttsRoutes from './routes/tts';
import whisperRoutes from './routes/whispers';
import territoryRoutes from './routes/territory';
import { dailySettlementJob } from './jobs/daily-settlement';
import { wsService } from './lib/websocket';

const app = express();
const PORT = process.env.PORT || 3001;

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 WebSocket
wsService.initialize(server);

// 中间件
app.use(cors({
  origin: (origin, callback) => {
    // 允许所有来源（开发环境）
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 处理 OPTIONS 预检请求
app.options('*', cors());

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/grudge', grudgeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/whispers', whisperRoutes);
app.use('/api/territory', territoryRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 启动服务器
// 监听所有网络接口（0.0.0.0），允许局域网访问
server.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Listening on all network interfaces (0.0.0.0)`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  
  // 启动定时任务
  dailySettlementJob.start();
  logger.info('Daily settlement job started');
});
