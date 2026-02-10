import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import certificateRoutes from './routes/certificateRoutes';
import jobRoutes from './routes/jobRoutes';
import interviewRoutes from './routes/interviewRoutes';
import aiRoutes from './routes/aiRoutes';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/ai', aiRoutes); // Public AI proxy routes (no auth required)

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Lune Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Keep-alive: ping own health endpoint every 13 minutes
    // Prevents Render free tier from spinning down after 15 min of inactivity
    if (process.env.NODE_ENV === 'production') {
        const KEEP_ALIVE_INTERVAL = 13 * 60 * 1000; // 13 minutes
        const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

        setInterval(async () => {
            try {
                const res = await fetch(`${selfUrl}/health`);
                if (res.ok) {
                    logger.info('Keep-alive ping successful');
                }
            } catch (err) {
                logger.warn('Keep-alive ping failed (server may be restarting)');
            }
        }, KEEP_ALIVE_INTERVAL);

        logger.info(`Keep-alive enabled: pinging ${selfUrl}/health every 13 minutes`);
    }
});

export default app;
