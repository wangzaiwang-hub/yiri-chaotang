import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';

interface Client {
  ws: WebSocket;
  courtId: string;
  userId: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'join') {
            // 客户端加入朝堂
            const clientId = `${data.userId}-${Date.now()}`;
            this.clients.set(clientId, {
              ws,
              courtId: data.courtId,
              userId: data.userId
            });
            logger.info(`Client ${data.userId} joined court ${data.courtId}`);
            
            // 发送确认消息
            ws.send(JSON.stringify({
              type: 'joined',
              courtId: data.courtId
            }));
          } else if (data.type === 'animation_start' || data.type === 'animation_end') {
            // 转发动画事件到朝堂内的其他成员（包括发送者自己，让前端自己过滤）
            logger.info(`Forwarding ${data.type} event for court ${data.courtId}`);
            this.broadcastToCourt(data.courtId, {
              type: data.type,
              taskId: data.taskId,
              phase: data.phase,
              senderId: data.senderId // 保留发送者 ID
            });
          }
        } catch (error) {
          logger.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        // 移除断开连接的客户端
        for (const [clientId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(clientId);
            logger.info(`Client ${client.userId} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    logger.info('WebSocket server initialized');
  }

  // 向朝堂内所有成员广播消息
  broadcastToCourt(courtId: string, message: any) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.courtId === courtId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
        sentCount++;
      }
    }

    logger.info(`Broadcast to court ${courtId}: ${sentCount} clients`);
  }

  // 向特定用户发送消息
  sendToUser(userId: string, message: any) {
    const messageStr = JSON.stringify(message);
    
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }
}

export const wsService = new WebSocketService();
