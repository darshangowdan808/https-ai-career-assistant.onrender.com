import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  triggerJobSync,
  updateAdminSetting,
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin endpoints with authentication and Admin role guard
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/sync-jobs', triggerJobSync);
router.post('/settings', updateAdminSetting);

export default router;
