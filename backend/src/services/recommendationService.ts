import prisma from '../config/db';

export interface JobRecommendationItem {
  job: any;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  inferredSkills: string[];
  toLearnSkills: string[];
  relevanceReason: string;
  weights: {
    skillsWeight: number;
    roleWeight: number;
    experienceWeight: number;
    locationWeight: number;
  };
}

class RecommendationService {
  /**
   * Generates tailored job recommendations based on user's resume and candidate profile
   */
  public async getRecommendationsForUser(userId: string): Promise<JobRecommendationItem[]> {
    // 1. Fetch user's candidate profile and latest resume
    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const latestResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });

    // Collect candidate skills
    const resumeSkills = latestResume?.skills.map((s) => s.skillName) || [];
    const profileSkills = profile?.skills ? JSON.parse(profile.skills) : [];
    const candidateSkills = Array.from(new Set([...resumeSkills, ...profileSkills]));

    const preferredRoles: string[] = profile?.preferredRoles ? JSON.parse(profile.preferredRoles) : [];
    const preferredLocations: string[] = profile?.preferredLocations ? JSON.parse(profile.preferredLocations) : [];
    const candidateExpYears = profile?.experienceYears || 0;

    // 2. Fetch all active jobs
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { postedAt: 'desc' },
      take: 50,
    });

    const recommendations: JobRecommendationItem[] = [];

    for (const job of jobs) {
      const requiredSkills: string[] = job.skillsRequiredJson ? JSON.parse(job.skillsRequiredJson) : [];

      // Skills matching
      const matched = requiredSkills.filter((req) =>
        candidateSkills.some((cs) => cs.toLowerCase() === req.toLowerCase() || req.toLowerCase().includes(cs.toLowerCase()))
      );
      const missing = requiredSkills.filter((req) => !matched.includes(req));

      // Inferred skills (e.g. if candidate knows React, inferred HTML/CSS/JS)
      const inferred: string[] = [];
      if (candidateSkills.some((s) => /react|vue|angular/i.test(s))) {
        inferred.push('Frontend Architecture', 'Client State Management');
      }
      if (candidateSkills.some((s) => /node|express|fastapi|django/i.test(s))) {
        inferred.push('RESTful APIs', 'Backend Architecture');
      }

      // Calculation of weighted score:
      // Skills: 50%
      const skillScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 100 : 70;

      // Role similarity: 25%
      let roleScore = 60;
      const jobTitleLower = job.title.toLowerCase();
      if (preferredRoles.some((r) => jobTitleLower.includes(r.toLowerCase()))) {
        roleScore = 100;
      } else if (candidateSkills.length > 0 && jobTitleLower.includes('software') || jobTitleLower.includes('developer')) {
        roleScore = 80;
      }

      // Experience match: 15%
      let expScore = 80;
      if (candidateExpYears <= 1 && (job.experienceMin === 0 || job.employmentType === 'INTERNSHIP')) {
        expScore = 100; // Perfect for freshers/students
      } else if (candidateExpYears >= job.experienceMin && candidateExpYears <= job.experienceMax + 1) {
        expScore = 100;
      } else if (candidateExpYears < job.experienceMin) {
        expScore = 40;
      }

      // Location match: 10%
      let locScore = 70;
      if (job.workMode === 'REMOTE') {
        locScore = 100;
      } else if (preferredLocations.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))) {
        locScore = 100;
      }

      // Final composite score
      const finalScore = Math.round(
        skillScore * 0.50 +
        roleScore * 0.25 +
        expScore * 0.15 +
        locScore * 0.10
      );

      // Relevance explanation
      let reason = `Matches ${matched.length} of ${requiredSkills.length} core skills`;
      if (job.experienceMin === 0) reason += ' • Entry-level / Fresher friendly';
      if (job.workMode === 'REMOTE') reason += ' • Remote flexibility';

      recommendations.push({
        job: {
          ...job,
          skillsRequired: requiredSkills,
        },
        matchScore: Math.min(99, Math.max(30, finalScore)),
        matchedSkills: matched,
        missingSkills: missing,
        inferredSkills: inferred,
        toLearnSkills: missing.slice(0, 3),
        relevanceReason: reason,
        weights: {
          skillsWeight: Math.round(skillScore),
          roleWeight: roleScore,
          experienceWeight: expScore,
          locationWeight: locScore,
        },
      });
    }

    // Sort by matchScore descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
  }
}

export default new RecommendationService();
