import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import aiService from './aiService';
import prisma from '../config/db';

export interface ParsedResumeSections {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
}

class ResumeService {
  /**
   * Extracts text from uploaded file buffer
   */
  public async extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      try {
        const data = await pdfParse(buffer);
        if (!data.text || data.text.trim().length === 0) {
          throw new Error('PDF appears to be scanned or contains only images. OCR is required or upload a text-selectable PDF.');
        }
        return data.text.trim();
      } catch (err: any) {
        throw new Error(`Failed to parse PDF document: ${err.message || 'Corrupt or unsupported PDF file.'}`);
      }
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      filename.toLowerCase().endsWith('.docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value.trim();
      } catch (err: any) {
        throw new Error(`Failed to parse DOCX document: ${err.message || 'Corrupt Word document.'}`);
      }
    }

    if (mimeType === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error('Unsupported file format. Please upload a standard PDF (.pdf) or Word document (.docx).');
  }

  /**
   * Structures raw resume text into recognizable sections and skills
   */
  public parseSections(text: string): ParsedResumeSections {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?91[\s-]?)?[6789]\d{9}/);

    // Heuristic skill extraction from curated Indian industry catalog
    const commonSkills = [
      'Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'React', 'React.js',
      'Angular', 'Vue.js', 'Node.js', 'Express', 'Spring Boot', 'Hibernate', 'Django', 'FastAPI',
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'Git', 'GitHub', 'CI/CD', 'REST API', 'GraphQL', 'Power BI', 'Tableau', 'Excel', 'Pandas',
      'NumPy', 'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Data Analytics',
      'DSA', 'OOP', 'Agile', 'Scrum', 'Linux', 'Microservices', 'Tailwind CSS'
    ];

    const extractedSkills: string[] = [];
    for (const skill of commonSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        extractedSkills.push(skill);
      }
    }

    return {
      rawText: text,
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      skills: extractedSkills,
      education: text.toLowerCase().includes('b.tech') || text.toLowerCase().includes('degree') ? ['Degree detected in document'] : [],
      experience: text.toLowerCase().includes('experience') || text.toLowerCase().includes('intern') ? ['Experience sections detected'] : [],
      projects: text.toLowerCase().includes('project') ? ['Project sections detected'] : [],
      certifications: text.toLowerCase().includes('certification') || text.toLowerCase().includes('certified') ? ['Certifications noted'] : [],
    };
  }

  /**
   * Performs full analysis and saves record
   */
  public async analyzeAndSave(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    fileSize: number,
    targetRole: string = 'Software Engineer / Full Stack',
    targetJobDesc?: string
  ) {
    const rawText = await this.extractText(fileBuffer, mimeType, originalName);
    const parsed = this.parseSections(rawText);

    // Run ATS analyzer
    const analysis = await aiService.analyzeResume(rawText, targetRole, targetJobDesc);

    // Save Resume to Database
    const resume = await prisma.resume.create({
      data: {
        userId,
        originalName,
        mimeType,
        fileSize,
        rawText,
        parsedDataJson: JSON.stringify(parsed),
      },
    });

    // Save Extracted Skills
    for (const skill of parsed.skills) {
      await prisma.extractedSkill.create({
        data: {
          resumeId: resume.id,
          skillName: skill,
          category: 'Technical',
          proficiency: 'Intermediate',
          confidence: 0.95,
        },
      });
    }

    // Save Analysis
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        targetRole,
        targetJobDesc,
        overallScore: analysis.overallScore,
        sectionScoresJson: JSON.stringify(analysis.sectionScores),
        matchedSkillsJson: JSON.stringify(analysis.matchedSkills),
        missingSkillsJson: JSON.stringify(analysis.missingSkills),
        warningsJson: JSON.stringify(analysis.warnings),
        strengthsJson: JSON.stringify(analysis.strengths),
        weaknessesJson: JSON.stringify(analysis.weaknesses),
        recommendationsJson: JSON.stringify(analysis.recommendations),
        improvedSummary: analysis.improvedSummary,
        improvedBulletsJson: JSON.stringify(analysis.improvedBullets),
      },
    });

    // Update candidate profile skills & completion if empty
    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    if (profile) {
      const existingSkills = profile.skills ? JSON.parse(profile.skills) : [];
      const mergedSkills = Array.from(new Set([...existingSkills, ...parsed.skills]));
      await prisma.candidateProfile.update({
        where: { userId },
        data: {
          skills: JSON.stringify(mergedSkills),
          profileCompleted: Math.max(profile.profileCompleted, 75),
          resumeUrl: `resume-${resume.id}`,
        },
      });
    }

    return {
      resumeId: resume.id,
      analysisId: savedAnalysis.id,
      analysis,
      parsed,
    };
  }
}

export default new ResumeService();
