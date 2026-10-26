export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  phone?: string;
  latestResumeId?: string | null;
  latestAtsScore?: number | null;
  profile?: CandidateProfile;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  education?: string;
  graduationYear?: number;
  experienceYears: number;
  currentRole?: string;
  preferredRoles: string[];
  skills: string[];
  preferredLocations: string[];
  expectedSalaryLpa?: number;
  employmentTypes: string[];
  resumeUrl?: string;
  profileCompleted: number;
}

export interface Job {
  id: string;
  externalId?: string;
  provider: string; // ARBEITNOW, ADZUNA, VERIFIED_PARTNER, DEMO
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  city: string;
  workMode: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  employmentType: 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME' | 'CONTRACT';
  experienceMin: number;
  experienceMax: number;
  salaryMinLpa?: number;
  salaryMaxLpa?: number;
  salaryDisclosed: boolean;
  skillsRequired: string[];
  description: string;
  responsibilities?: string;
  qualifications?: string;
  sourceUrl: string;
  applicationType: 'EXTERNAL' | 'DIRECT';
  isDemo: boolean;
  postedAt: string;
  verifiedAt: string;
  isSaved?: boolean;
  applicationStatus?: string | null;
}

export interface ResumeAnalysis {
  id: string;
  targetRole: string;
  overallScore: number;
  sectionScores: {
    contactInfo: number;
    summary: number;
    skills: number;
    experience: number;
    education: number;
    formatting: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  improvedSummary: string;
  improvedBullets: string[];
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  questionIndex: number;
  questionText: string;
  questionType: 'TEXT' | 'MCQ' | 'CODING';
  options?: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  userAnswer?: {
    answerText?: string;
    selectedOption?: string;
    score: number;
    aiFeedback?: string;
    timeTakenSeconds?: number;
  };
  correctAnswer?: string;
  explanation?: string;
}

export interface InterviewRound {
  id: string;
  roundNumber: number;
  roundName: string;
  status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  score?: number | null;
  passingScore: number;
  feedback?: string;
  evaluation?: any;
  questions: InterviewQuestion[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  targetRole: string;
  targetCompany?: string;
  difficulty: string;
  mode: string;
  currentRound: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  overallScore?: number;
  passStatus: 'PENDING' | 'PASSED' | 'FAILED';
  createdAt: string;
  rounds: InterviewRound[];
}

export interface JobRecommendation {
  job: Job;
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

export interface LearningProgressItem {
  id: string;
  skillName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  notes?: string;
}

export interface LearningPlan {
  id: string;
  roleTarget: string;
  timelineWeeks: number;
  prioritySkills: string[];
  resources: Array<{
    skill: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    estimatedHours: number;
    documentationUrl: string;
    freeCourse: string;
    practiceTask: string;
    recommendedProject: string;
  }>;
  projectIdeas: Array<{
    title: string;
    description: string;
    techStack: string[];
  }>;
  progressItems: LearningProgressItem[];
}
