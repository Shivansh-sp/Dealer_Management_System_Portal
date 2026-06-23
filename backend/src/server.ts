import http from 'http';
import dotenv from 'dotenv';

// Load Environment variables early
dotenv.config();

import app from './app';
import { connectDB, connectRedis } from './config/db';
import { seedDatabase } from './utils/seeder';
import { initSocket } from './socket';
import { initCronJobs } from './cron';
import { logger } from './config/logger';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Database Connections
    await connectDB();
    await connectRedis();

    // 2. Seed Database
    await seedDatabase();

    // 3. Setup Server
    const server = http.createServer(app);

    // 4. Initialize WebSockets (Socket.io)
    initSocket(server);

    // 5. Initialize Cron Jobs
    initCronJobs();

    // 6. Start listening
    server.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle Graceful shutdown
    process.on('SIGTERM', () => {
      logger.warn('SIGTERM received. Shutting down gracefully.');
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
