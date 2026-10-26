import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import learningService from '../services/learningService';

export const getLearningPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const roleTarget = (req.query.role as string) || 'Full Stack Software Engineer';

    const plan = await learningService.getOrCreatePlan(userId, roleTarget);
    return res.json({ success: true, plan });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { progressId, status, progressPercent, notes } = req.body;

    if (!progressId || !status) {
      return res.status(400).json({ success: false, error: 'progressId and status are required.' });
    }

    const updated = await learningService.updateProgress(
      progressId,
      status,
      progressPercent !== undefined ? parseInt(progressPercent) : 0,
      notes
    );

    return res.json({ success: true, message: 'Skill progress updated.', progress: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
