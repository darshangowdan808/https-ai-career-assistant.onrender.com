import { Response } from 'express';
import multer from 'multer';
import prisma from '../config/db';
import resumeService from '../services/resumeService';
import { AuthRequest } from '../middleware/auth';

// Memory storage for secure ephemeral processing
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF (.pdf) and Word (.docx) files are supported.'));
    }
  },
});

export const uploadAndAnalyze = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Please provide a PDF or DOCX resume file to upload.' });
    }

    const targetRole = req.body.targetRole || 'Full Stack Software Engineer';
    const targetJobDesc = req.body.targetJobDesc || undefined;

    const result = await resumeService.analyzeAndSave(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      targetRole,
      targetJobDesc
    );

    return res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully.',
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Error parsing resume.' });
  }
};

export const getLatestResumeAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        skills: true,
      },
    });

    if (!resume || resume.analyses.length === 0) {
      return res.json({ success: true, analysis: null });
    }

    const a = resume.analyses[0];

    return res.json({
      success: true,
      resume: {
        id: resume.id,
        originalName: resume.originalName,
        createdAt: resume.createdAt,
        skills: resume.skills.map((s) => s.skillName),
      },
      analysis: {
        id: a.id,
        targetRole: a.targetRole,
        overallScore: a.overallScore,
        sectionScores: JSON.parse(a.sectionScoresJson),
        matchedSkills: JSON.parse(a.matchedSkillsJson),
        missingSkills: JSON.parse(a.missingSkillsJson),
        warnings: JSON.parse(a.warningsJson),
        strengths: JSON.parse(a.strengthsJson),
        weaknesses: JSON.parse(a.weaknessesJson),
        recommendations: JSON.parse(a.recommendationsJson),
        improvedSummary: a.improvedSummary,
        improvedBullets: a.improvedBulletsJson ? JSON.parse(a.improvedBulletsJson) : [],
        createdAt: a.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found.' });
    }

    // Cascade deletion of analyses and extracted skills
    await prisma.resume.delete({ where: { id: resume.id } });

    // Update profile
    await prisma.candidateProfile.update({
      where: { userId },
      data: { resumeUrl: null },
    });

    return res.json({ success: true, message: 'Resume and associated analysis data deleted securely.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
