import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken, AuthRequest } from '../middleware/auth';

const formatProfile = (profile: any) => {
  if (!profile) return null;
  return {
    ...profile,
    skills: typeof profile.skills === 'string' ? JSON.parse(profile.skills) : (profile.skills || []),
    preferredRoles: typeof profile.preferredRoles === 'string' ? JSON.parse(profile.preferredRoles) : (profile.preferredRoles || []),
    preferredLocations: typeof profile.preferredLocations === 'string' ? JSON.parse(profile.preferredLocations) : (profile.preferredLocations || []),
    employmentTypes: typeof profile.employmentTypes === 'string' ? JSON.parse(profile.employmentTypes) : (profile.employmentTypes || []),
  };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone,
        role: userRole,
        profile: {
          create: {
            headline: 'Aspiring Professional / Student',
            skills: JSON.stringify(['Problem Solving', 'Communication']),
            preferredRoles: JSON.stringify(['Software Engineer']),
            preferredLocations: JSON.stringify(['Bengaluru', 'Remote']),
            experienceYears: 0,
            profileCompleted: 35,
          },
        },
      },
      include: { profile: true },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profile: formatProfile(user.profile),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profile: formatProfile(user.profile),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error during login.' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const latestResume = user.resumes[0];
    const latestAnalysis = latestResume?.analyses[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profile: formatProfile(user.profile),
        latestResumeId: latestResume?.id || null,
        latestAtsScore: latestAnalysis?.overallScore || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Return friendly generic message for security
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    });
  }

  // In demo / production mode, provide a one-time reset token link
  return res.json({
    success: true,
    message: 'Password reset link generated. (Demo Mode: You can enter a new password directly in Reset Password workflow).',
    demoResetToken: 'demo-reset-token-' + user.id,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email and new password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return res.json({ success: true, message: 'Password has been updated successfully. Please log in.' });
};
