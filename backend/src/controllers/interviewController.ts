import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import interviewService from '../services/interviewService';

export const startInterview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { targetRole, targetCompany, jobDescription, difficulty, mode } = req.body;

    if (!targetRole) {
      return res.status(400).json({ success: false, error: 'Target job role is required to configure the interview.' });
    }

    const session = await interviewService.createSession(
      userId,
      targetRole,
      targetCompany,
      jobDescription,
      difficulty || 'MEDIUM',
      mode || 'TEXT'
    );

    return res.status(201).json({
      success: true,
      message: 'Mock interview session created successfully.',
      session,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getInterviewSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const session = await interviewService.getSessionDetails(id, userId);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
};

export const submitRound = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { roundNumber, submissions } = req.body;

    if (!roundNumber || !Array.isArray(submissions)) {
      return res.status(400).json({ success: false, error: 'roundNumber and submissions array are required.' });
    }

    const updatedSession = await interviewService.submitRoundAnswers(
      id,
      parseInt(roundNumber),
      userId,
      submissions
    );

    return res.json({
      success: true,
      message: `Round ${roundNumber} completed and scored.`,
      session: updatedSession,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const retryRound = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { roundNumber } = req.body;

    if (!roundNumber) {
      return res.status(400).json({ success: false, error: 'roundNumber is required.' });
    }

    const updatedSession = await interviewService.retryRound(id, parseInt(roundNumber), userId);
    return res.json({
      success: true,
      message: `Round ${roundNumber} has been reset for a new attempt.`,
      session: updatedSession,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const getUserInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        rounds: {
          select: {
            roundNumber: true,
            roundName: true,
            status: true,
            score: true,
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    return res.json({
      success: true,
      sessions,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
