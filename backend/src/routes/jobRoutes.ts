import { Router } from 'express';
import {
  getJobs,
  getJobById,
  toggleSaveJob,
  trackApplication,
  getUserApplications,
  getUserSavedJobs,
  syncJobs,
} from '../controllers/jobController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getJobs);
router.get('/saved', authenticateToken, getUserSavedJobs);
router.get('/applications', authenticateToken, getUserApplications);
router.get('/:id', optionalAuth, getJobById);
router.post('/save', authenticateToken, toggleSaveJob);
router.post('/apply', authenticateToken, trackApplication);
router.post('/sync', syncJobs);

export default router;
