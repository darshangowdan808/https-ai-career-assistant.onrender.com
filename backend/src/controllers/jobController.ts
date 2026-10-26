import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import jobProviderService from '../services/jobProviderService';

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      q,
      location,
      experience,
      workMode,
      employmentType,
      minSalary,
      provider,
      sort = 'newest',
      page = '1',
      limit = '15',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 15;
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma where query with strict AND clauses
    const andClauses: any[] = [{ isActive: true }];

    if (provider && provider !== 'ALL') {
      andClauses.push({ provider });
    }

    if (q) {
      andClauses.push({
        OR: [
          { title: { contains: q } },
          { company: { contains: q } },
          { description: { contains: q } },
          { skillsRequiredJson: { contains: q } },
        ],
      });
    }

    if (location && location !== 'ALL') {
      andClauses.push({
        OR: [
          { location: { contains: location } },
          { city: { contains: location } },
        ],
      });
    }

    if (workMode && workMode !== 'ALL') {
      andClauses.push({ workMode });
    }

    if (employmentType && employmentType !== 'ALL') {
      andClauses.push({ employmentType });
    }

    // Experience mapping
    if (experience && experience !== 'ALL') {
      if (experience === 'FRESHER' || experience === '0-1') {
        andClauses.push({ experienceMin: { lte: 1 } });
      } else if (experience === 'INTERNSHIP') {
        andClauses.push({ employmentType: 'INTERNSHIP' });
      } else if (experience === '1-3') {
        andClauses.push({ experienceMin: { lte: 3 }, experienceMax: { gte: 1 } });
      } else if (experience === '3-5') {
        andClauses.push({ experienceMin: { lte: 5 }, experienceMax: { gte: 3 } });
      } else if (experience === '5+') {
        andClauses.push({ experienceMin: { gte: 5 } });
      }
    }

    if (minSalary) {
      andClauses.push({ salaryMaxLpa: { gte: parseFloat(minSalary) } });
    }

    const where: any = { AND: andClauses };

    // Sorting
    let orderBy: any = { postedAt: 'desc' };
    if (sort === 'salary') {
      orderBy = { salaryMaxLpa: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { postedAt: 'asc' };
    }

    const [total, rawJobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    // Check saved status if logged in
    let savedJobIds: string[] = [];
    let applicationMap: Record<string, string> = {};

    if (req.user) {
      const [saved, apps] = await Promise.all([
        prisma.savedJob.findMany({
          where: { userId: req.user.id },
          select: { jobId: true },
        }),
        prisma.jobApplication.findMany({
          where: { userId: req.user.id },
          select: { jobId: true, status: true },
        }),
      ]);
      savedJobIds = saved.map((s) => s.jobId);
      apps.forEach((a) => {
        applicationMap[a.jobId] = a.status;
      });
    }

    const formattedJobs = rawJobs.map((j) => ({
      ...j,
      skillsRequired: j.skillsRequiredJson ? JSON.parse(j.skillsRequiredJson) : [],
      isSaved: savedJobIds.includes(j.id),
      applicationStatus: applicationMap[j.id] || null,
    }));

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      jobs: formattedJobs,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job listing not found.' });
    }

    let isSaved = false;
    let application = null;

    if (req.user) {
      const saved = await prisma.savedJob.findUnique({
        where: { userId_jobId: { userId: req.user.id, jobId: id } },
      });
      isSaved = Boolean(saved);

      application = await prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId: req.user.id, jobId: id } },
      });
    }

    return res.json({
      success: true,
      job: {
        ...job,
        skillsRequired: job.skillsRequiredJson ? JSON.parse(job.skillsRequiredJson) : [],
        isSaved,
        application,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleSaveJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID is required.' });
    }

    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return res.json({ success: true, isSaved: false, message: 'Job removed from saved list.' });
    } else {
      await prisma.savedJob.create({ data: { userId, jobId } });
      return res.json({ success: true, isSaved: true, message: 'Job saved to your dashboard.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const trackApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { jobId, status = 'APPLIED', notes } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID is required.' });
    }

    const validStatuses = ['INTERESTED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid application status.' });
    }

    const app = await prisma.jobApplication.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: {
        userId,
        jobId,
        status,
        notes,
      },
      update: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { job: true },
    });

    return res.json({
      success: true,
      message: `Application status recorded as ${status}.`,
      application: app,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const apps = await prisma.jobApplication.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({
      success: true,
      applications: apps.map((a) => ({
        ...a,
        job: {
          ...a.job,
          skillsRequired: a.job.skillsRequiredJson ? JSON.parse(a.job.skillsRequiredJson) : [],
        },
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getUserSavedJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const saved = await prisma.savedJob.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      savedJobs: saved.map((s) => ({
        id: s.id,
        savedAt: s.createdAt,
        job: {
          ...s.job,
          skillsRequired: s.job.skillsRequiredJson ? JSON.parse(s.job.skillsRequiredJson) : [],
        },
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const syncJobs = async (_req: Request, res: Response) => {
  try {
    const result = await jobProviderService.syncAllProviders();
    return res.json({
      success: true,
      message: 'Job synchronization completed.',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
