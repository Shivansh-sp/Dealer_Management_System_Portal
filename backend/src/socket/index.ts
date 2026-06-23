import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../config/logger';

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected to WebSocket: ${socket.id}`);

    // Join room for custom notifications
    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.debug(`User ${userId} joined their notification room: ${socket.id}`);
    });

    // Client tracking room for customer service status updates
    socket.on('track-service', (chassisNumber: string) => {
      socket.join(chassisNumber);
      logger.debug(`Client tracking service for vehicle: ${chassisNumber}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected from WebSocket: ${socket.id}`);
    });
  });

  return io;
};

// Global helpers to emit events from controllers/services
export const notifyUser = (userId: string, message: any) => {
  if (io) {
    io.to(userId).emit('notification', message);
  }
};

export const broadcastNotification = (type: string, message: any) => {
  if (io) {
    io.emit('notification', { type, ...message });
  }
};

export const emitServiceStageUpdate = (chassisNumber: string, stage: string) => {
  if (io) {
    io.to(chassisNumber).emit('service-stage-changed', {
      chassisNumber,
      stage,
      updatedAt: new Date(),
    });
  }
};
