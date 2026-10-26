import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    return res.json({
      success: true,
      profile: {
        ...profile,
        preferredRoles: profile.preferredRoles ? JSON.parse(profile.preferredRoles) : [],
        skills: profile.skills ? JSON.parse(profile.skills) : [],
        preferredLocations: profile.preferredLocations ? JSON.parse(profile.preferredLocations) : [],
        employmentTypes: profile.employmentTypes ? JSON.parse(profile.employmentTypes) : [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      phone,
      headline,
      bio,
      education,
      graduationYear,
      experienceYears,
      currentRole,
      preferredRoles,
      skills,
      preferredLocations,
      expectedSalaryLpa,
      employmentTypes,
    } = req.body;

    // Update User name & phone if provided
    if (name || phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          phone: phone || undefined,
        },
      });
    }

    // Compute profile completeness
    let completion = 20; // Base creation
    if (headline) completion += 10;
    if (bio) completion += 10;
    if (education) completion += 15;
    if (skills && skills.length > 0) completion += 20;
    if (preferredRoles && preferredRoles.length > 0) completion += 15;
    if (preferredLocations && preferredLocations.length > 0) completion += 10;

    const updatedProfile = await prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline,
        bio,
        education,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        experienceYears: experienceYears !== undefined ? parseFloat(experienceYears) : 0,
        currentRole,
        preferredRoles: preferredRoles ? JSON.stringify(preferredRoles) : null,
        skills: skills ? JSON.stringify(skills) : null,
        preferredLocations: preferredLocations ? JSON.stringify(preferredLocations) : null,
        expectedSalaryLpa: expectedSalaryLpa ? parseFloat(expectedSalaryLpa) : null,
        employmentTypes: employmentTypes ? JSON.stringify(employmentTypes) : null,
        profileCompleted: Math.min(100, completion),
      },
      update: {
        headline,
        bio,
        education,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        experienceYears: experienceYears !== undefined ? parseFloat(experienceYears) : 0,
        currentRole,
        preferredRoles: preferredRoles ? JSON.stringify(preferredRoles) : undefined,
        skills: skills ? JSON.stringify(skills) : undefined,
        preferredLocations: preferredLocations ? JSON.stringify(preferredLocations) : undefined,
        expectedSalaryLpa: expectedSalaryLpa ? parseFloat(expectedSalaryLpa) : null,
        employmentTypes: employmentTypes ? JSON.stringify(employmentTypes) : undefined,
        profileCompleted: Math.min(100, completion),
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        ...updatedProfile,
        name: name || req.user!.name,
        preferredRoles: updatedProfile.preferredRoles ? JSON.parse(updatedProfile.preferredRoles) : [],
        skills: updatedProfile.skills ? JSON.parse(updatedProfile.skills) : [],
        preferredLocations: updatedProfile.preferredLocations ? JSON.parse(updatedProfile.preferredLocations) : [],
        employmentTypes: updatedProfile.employmentTypes ? JSON.parse(updatedProfile.employmentTypes) : [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
