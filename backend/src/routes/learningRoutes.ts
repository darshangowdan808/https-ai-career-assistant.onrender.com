import { Router } from 'express';
import { getLearningPlan, updateProgress } from '../controllers/learningController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getLearningPlan);
router.post('/progress', authenticateToken, updateProgress);

export default router;
