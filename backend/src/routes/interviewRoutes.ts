import { Router } from 'express';
import {
  startInterview,
  getInterviewSession,
  submitRound,
  retryRound,
  getUserInterviews,
} from '../controllers/interviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/start', authenticateToken, startInterview);
router.get('/my', authenticateToken, getUserInterviews);
router.get('/:id', authenticateToken, getInterviewSession);
router.post('/:id/submit', authenticateToken, submitRound);
router.post('/:id/retry', authenticateToken, retryRound);

export default router;
