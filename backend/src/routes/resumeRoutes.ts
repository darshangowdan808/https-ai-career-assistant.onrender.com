import { Router } from 'express';
import { upload, uploadAndAnalyze, getLatestResumeAnalysis, deleteResume } from '../controllers/resumeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/upload', authenticateToken, upload.single('resume'), uploadAndAnalyze);
router.get('/latest', authenticateToken, getLatestResumeAnalysis);
router.delete('/:id', authenticateToken, deleteResume);

export default router;
