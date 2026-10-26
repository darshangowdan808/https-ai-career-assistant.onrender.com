import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import resumeRoutes from './routes/resumeRoutes';
import jobRoutes from './routes/jobRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import interviewRoutes from './routes/interviewRoutes';
import learningRoutes from './routes/learningRoutes';
import adminRoutes from './routes/adminRoutes';
import jobProviderService from './services/jobProviderService';
import aiService from './services/aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'AI Career Assistant Backend API',
    timestamp: new Date().toISOString(),
    aiEngine: aiService.isLiveAiConfigured() ? 'Live LLM (Gemini/OpenAI)' : 'Transparent Heuristic Engine (Demo Mode Active)',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/admin', adminRoutes);

// Serve Frontend Static Assets (Production / Unified Mode)
const possibleFrontendPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
];
const frontendDistPath = possibleFrontendPaths.find(p => fs.existsSync(p));
if (frontendDistPath) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 AI Career Assistant Backend listening on port ${PORT}`);
  console.log(`📡 Health Check available at: http://localhost:${PORT}/api/health`);
  
  // Asynchronously seed / sync jobs from configured providers on startup
  try {
    console.log('🔄 Initializing job feed synchronization...');
    const syncRes = await jobProviderService.syncAllProviders();
    console.log(`✅ Job synchronization complete: ${syncRes.added} new jobs, ${syncRes.updated} updated.`);
  } catch (err: any) {
    console.warn('⚠️ Notice during startup job sync:', err.message);
  }
});

export default app;
