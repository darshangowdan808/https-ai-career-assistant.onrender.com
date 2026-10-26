import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import recommendationService from '../services/recommendationService';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const recommendations = await recommendationService.getRecommendationsForUser(userId);

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
