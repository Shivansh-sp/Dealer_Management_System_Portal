import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Import configs & middlewares
import { errorHandler } from './middlewares/error';
import { logger } from './config/logger';

// Import Routes
import authRoutes from './routes/authRoutes';
import preSalesRoutes from './routes/preSalesRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import salesRoutes from './routes/salesRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import serviceRoutes from './routes/serviceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// Logging Middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiter for general endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Mount Routing layers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pre-sales', preSalesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/service', serviceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Fallback Route for non-existent end-points
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
    data: null,
    pagination: null,
    errors: null,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
