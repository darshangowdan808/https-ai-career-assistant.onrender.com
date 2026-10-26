import { Request, Response } from 'express';
import prisma from '../config/db';
import jobProviderService from '../services/jobProviderService';
import aiService from '../services/aiService';

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalResumes,
      totalInterviews,
      totalApplications,
      providers,
      settings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.resume.count(),
      prisma.interviewSession.count(),
      prisma.jobApplication.count(),
      prisma.jobProvider.findMany(),
      prisma.adminSetting.findMany(),
    ]);

    // Active AI status
    const isAiLive = aiService.isLiveAiConfigured();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalJobs,
        totalResumes,
        totalInterviews,
        totalApplications,
        isAiLive,
        aiEngine: isAiLive ? 'Gemini / LLM Connected' : 'Transparent Deterministic Heuristic Engine (Demo Mode Active)',
        jobProviders: providers,
        settings,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            resumes: true,
            interviews: true,
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const triggerJobSync = async (_req: Request, res: Response) => {
  try {
    const result = await jobProviderService.syncAllProviders();
    return res.json({
      success: true,
      message: 'Provider synchronization executed.',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAdminSetting = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: 'Setting key and value are required.' });
    }

    const setting = await prisma.adminSetting.upsert({
      where: { key },
      create: { key, value: String(value), description },
      update: { value: String(value), description },
    });

    return res.json({ success: true, message: 'Admin setting updated.', setting });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
