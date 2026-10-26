import axios from 'axios';
import prisma from '../config/db';
import { INDIAN_TECH_JOBS_CATALOG } from '../data/indianJobsData';

export interface NormalizedJob {
  externalId: string;
  provider: string; // ARBEITNOW, REMOTIVE, JOBICY, ADZUNA, VERIFIED_PARTNER, DEMO
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
  postedAt: Date;
  verifiedAt: Date;
}

export interface JobProviderAdapter {
  name: string;
  code: string;
  fetchJobs(): Promise<NormalizedJob[]>;
}

// Indian Tech State & Hub Keywords
const INDIAN_TECH_HUBS = [
  'india', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'gurugram', 'gurgaon', 'noida',
  'delhi', 'chennai', 'mumbai', 'kolkata', 'kochi', 'coimbatore', 'ahmedabad', 'gandhinagar',
  'trivandrum', 'thiruvananthapuram', 'mysuru', 'mysore', 'karnataka', 'maharashtra',
  'telangana', 'tamil nadu', 'kerala', 'gujarat', 'west bengal', 'pan-india'
];

function isIndiaEligible(locationText: string): boolean {
  const lower = (locationText || '').toLowerCase();
  return INDIAN_TECH_HUBS.some(hub => lower.includes(hub));
}

/**
 * 1. Verified Indian Tech Employers Official Feed
 */
export class VerifiedIndianEmployersAdapter implements JobProviderAdapter {
  public name = 'Verified Indian Employers Career Feed';
  public code = 'VERIFIED_PARTNER';

  public async fetchJobs(): Promise<NormalizedJob[]> {
    return INDIAN_TECH_JOBS_CATALOG;
  }
}

/**
 * 2. Arbeitnow Public Job API Adapter (India Filtered)
 */
export class ArbeitnowAdapter implements JobProviderAdapter {
  public name = 'Arbeitnow Live Job Board';
  public code = 'ARBEITNOW';

  public async fetchJobs(): Promise<NormalizedJob[]> {
    try {
      const response = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
        timeout: 8000,
        headers: { 'User-Agent': 'AICareerAssistant/1.0' },
      });

      const items = response.data?.data || [];
      const normalized: NormalizedJob[] = [];

      for (const item of items) {
        const isRemote = Boolean(item.remote);
        const loc = (item.location || '').toLowerCase();

        // STRICT INDIA FILTER: Only accept if location explicitly mentions India or Indian tech hub
        if (!isIndiaEligible(loc)) {
          continue; // REJECT non-India vacancy
        }

        const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
        
        let cityTitle = 'Remote';
        let locationTitle = 'Remote, India (Pan-India)';

        const matchedCity = INDIAN_TECH_HUBS.find(h => loc.includes(h) && h !== 'india' && h !== 'pan-india');
        if (matchedCity) {
          const capCity = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
          cityTitle = capCity === 'Bangalore' ? 'Bengaluru' : capCity === 'Gurgaon' ? 'Gurugram' : capCity;
          locationTitle = `${cityTitle}, India`;
        } else {
          cityTitle = 'Remote';
          locationTitle = 'Remote, India (Pan-India)';
        }

        normalized.push({
          externalId: `arbeitnow-${item.slug || item.id || Math.random()}`,
          provider: 'ARBEITNOW',
          title: item.title || 'Software Engineer',
          company: item.company_name || 'Tech Company',
          location: locationTitle,
          city: cityTitle,
          workMode: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceMin: 1,
          experienceMax: 4,
          salaryMinLpa: 10.0,
          salaryMaxLpa: 22.0,
          salaryDisclosed: false,
          skillsRequired: tags.length ? tags : ['Software Engineering', 'APIs', 'Git'],
          description: item.description ? item.description.replace(/<[^>]*>?/gm, ' ').slice(0, 1500) : 'Exciting software engineering role open for Indian tech talent.',
          responsibilities: 'Design and build resilient software systems, participate in architecture discussions, and ensure code quality.',
          qualifications: 'B.Tech/BE or equivalent experience in Computer Science or relevant technical discipline.',
          sourceUrl: item.url,
          applicationType: 'EXTERNAL',
          isDemo: false,
          postedAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
          verifiedAt: new Date(),
        });
      }

      return normalized;
    } catch (err: any) {
      console.warn('Arbeitnow API fetch notice:', err.message);
      return [];
    }
  }
}

/**
 * 3. Remotive Live Remote Feed Adapter (India Eligible)
 */
export class RemotiveAdapter implements JobProviderAdapter {
  public name = 'Remotive Global & India Developer Feed';
  public code = 'REMOTIVE';

  public async fetchJobs(): Promise<NormalizedJob[]> {
    try {
      const response = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=40', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AICareerAssistant/1.0' },
      });

      const items = response.data?.jobs || [];
      const normalized: NormalizedJob[] = [];

      for (const item of items) {
        const loc = (item.candidate_required_location || '').toLowerCase();
        const isIndia = loc.includes('india') || loc.includes('worldwide') || loc.includes('anywhere') || loc.includes('apac');
        if (!isIndia) {
          continue; // REJECT non-India jobs
        }

        const cleanDesc = item.description
          ? item.description.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500)
          : 'Exciting software engineering opportunity with a global distributed team open to engineers in India.';

        const locationStr = loc.includes('india')
          ? 'Bengaluru, Karnataka / Remote (India)'
          : 'Remote, India (Pan-India / Global Tech)';
        const cityStr = loc.includes('india') ? 'Bengaluru' : 'Remote';

        let salaryMin = 12.0;
        let salaryMax = 26.0;
        let salaryDisclosed = false;

        if (item.salary && typeof item.salary === 'string' && item.salary.includes('$')) {
          const numbers = item.salary.match(/\d+[\d,]*/g);
          if (numbers && numbers.length >= 2) {
            const raw1 = parseInt(numbers[0].replace(/,/g, ''), 10);
            const raw2 = parseInt(numbers[1].replace(/,/g, ''), 10);
            const n1 = raw1 < 1000 ? raw1 * 1000 : raw1;
            const n2 = raw2 < 1000 ? raw2 * 1000 : raw2;
            salaryMin = Math.round((n1 * 84 / 100000) * 10) / 10;
            salaryMax = Math.round((n2 * 84 / 100000) * 10) / 10;
            salaryDisclosed = true;
          }
        }

        const tags: string[] = Array.isArray(item.tags) && item.tags.length > 0
          ? item.tags
          : ['TypeScript', 'JavaScript', 'APIs', 'Git', 'Software Development'];

        normalized.push({
          externalId: `remotive-${item.id}`,
          provider: 'REMOTIVE',
          title: item.title || 'Full Stack Engineer',
          company: item.company_name || 'Tech Innovators',
          companyLogo: item.company_logo || undefined,
          location: locationStr,
          city: cityStr,
          workMode: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceMin: 1,
          experienceMax: 4,
          salaryMinLpa: salaryMin,
          salaryMaxLpa: salaryMax,
          salaryDisclosed,
          skillsRequired: tags,
          description: cleanDesc,
          responsibilities: 'Collaborate with cross-functional product and engineering teams; write clean, tested and well-documented code.',
          qualifications: 'Demonstrated experience in software development and proactive communication.',
          sourceUrl: item.url,
          applicationType: 'EXTERNAL',
          isDemo: false,
          postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
          verifiedAt: new Date(),
        });
      }

      return normalized;
    } catch (err: any) {
      console.warn('Remotive API fetch notice:', err.message);
      return [];
    }
  }
}

/**
 * 4. Jobicy Live Engineering Feed Adapter (India Eligible)
 */
export class JobicyAdapter implements JobProviderAdapter {
  public name = 'Jobicy Live Tech & Developer Feed';
  public code = 'JOBICY';

  public async fetchJobs(): Promise<NormalizedJob[]> {
    try {
      const response = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=30&industry=dev', {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AICareerAssistant/1.0' },
      });

      const items = response.data?.jobs || [];
      const normalized: NormalizedJob[] = [];

      for (const item of items) {
        const geo = (item.jobGeo || '').toLowerCase();
        const isIndia = geo.includes('india') || geo.includes('anywhere') || geo.includes('worldwide') || geo.includes('apac');
        if (!isIndia) {
          continue; // REJECT non-India jobs
        }

        const cleanDesc = (item.jobDescription || item.jobExcerpt || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1500) || 'Exciting engineering role working on modern cloud and web technologies.';

        const locationStr = geo.includes('india')
          ? 'Hyderabad, Telangana / Remote (India)'
          : 'Remote, India (Pan-India / Global Tech)';
        const cityStr = geo.includes('india') ? 'Hyderabad' : 'Remote';

        const skillKeywords = ['React', 'Node.js', 'Python', 'TypeScript', 'Java', 'Go', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'GraphQL', 'Next.js', 'Tailwind', 'REST API', 'DevOps'];
        const matchedSkills = skillKeywords.filter(k =>
          (item.jobTitle || '').toLowerCase().includes(k.toLowerCase()) ||
          cleanDesc.toLowerCase().includes(k.toLowerCase())
        );
        const skillsRequired = matchedSkills.length > 0 ? matchedSkills : ['Software Engineering', 'Problem Solving', 'Git', 'Clean Architecture'];

        normalized.push({
          externalId: `jobicy-${item.id}`,
          provider: 'JOBICY',
          title: item.jobTitle || 'Software Developer',
          company: item.companyName || 'Global Tech Partner',
          companyLogo: item.companyLogo || undefined,
          location: locationStr,
          city: cityStr,
          workMode: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceMin: 1,
          experienceMax: 4,
          salaryMinLpa: 11.0,
          salaryMaxLpa: 24.0,
          salaryDisclosed: false,
          skillsRequired,
          description: cleanDesc,
          responsibilities: 'Build scalable software features; collaborate with international teams; adhere to security best practices.',
          qualifications: 'B.Tech/BE or equivalent practical experience with demonstrated proficiency in modern programming stacks.',
          sourceUrl: item.url,
          applicationType: 'EXTERNAL',
          isDemo: false,
          postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          verifiedAt: new Date(),
        });
      }

      return normalized;
    } catch (err: any) {
      console.warn('Jobicy API fetch notice:', err.message);
      return [];
    }
  }
}

/**
 * 5. Adzuna India Job Search API Adapter
 */
export class AdzunaAdapter implements JobProviderAdapter {
  public name = 'Adzuna India Job Feed';
  public code = 'ADZUNA';

  public async fetchJobs(): Promise<NormalizedJob[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return [];
    }

    try {
      const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&content-type=application/json`;
      const response = await axios.get(url, { timeout: 8000 });
      const results = response.data?.results || [];
      const normalized: NormalizedJob[] = [];

      for (const item of results) {
        const salaryMin = item.salary_min ? Math.round((item.salary_min / 100000) * 10) / 10 : undefined;
        const salaryMax = item.salary_max ? Math.round((item.salary_max / 100000) * 10) / 10 : undefined;

        normalized.push({
          externalId: `adzuna-${item.id}`,
          provider: 'ADZUNA',
          title: item.title,
          company: item.company?.display_name || 'Employer',
          location: item.location?.display_name || 'Bengaluru, Karnataka',
          city: item.location?.area?.[0] || 'Bengaluru',
          workMode: 'HYBRID',
          employmentType: 'FULL_TIME',
          experienceMin: 0,
          experienceMax: 3,
          salaryMinLpa: salaryMin,
          salaryMaxLpa: salaryMax,
          salaryDisclosed: Boolean(salaryMin || salaryMax),
          skillsRequired: ['Communication', 'Problem Solving', 'Technical Foundations'],
          description: item.description,
          sourceUrl: item.redirect_url,
          applicationType: 'EXTERNAL',
          isDemo: false,
          postedAt: new Date(item.created),
          verifiedAt: new Date(),
        });
      }
      return normalized;
    } catch (err: any) {
      console.warn('Adzuna API sync error:', err.message);
      return [];
    }
  }
}

class JobProviderService {
  private adapters: JobProviderAdapter[] = [
    new VerifiedIndianEmployersAdapter(),
    new RemotiveAdapter(),
    new JobicyAdapter(),
    new AdzunaAdapter(),
  ];

  /**
   * Synchronizes jobs from all active providers into the relational database
   * and purges non-Indian vacancies to strictly enforce India-only job portal policy.
   */
  public async syncAllProviders(): Promise<{ added: number; updated: number; errors: string[] }> {
    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const adapter of this.adapters) {
      try {
        await prisma.jobProvider.upsert({
          where: { code: adapter.code },
          create: {
            name: adapter.name,
            code: adapter.code,
            isEnabled: true,
            syncStatus: 'RUNNING',
            lastSyncAt: new Date(),
          },
          update: {
            syncStatus: 'RUNNING',
            lastSyncAt: new Date(),
          },
        });

        const jobs = await adapter.fetchJobs();

        for (const j of jobs) {
          // Double verification: Must be India-eligible
          if (!isIndiaEligible(j.location) && !isIndiaEligible(j.city)) {
            continue;
          }

          const existing = await prisma.job.findUnique({
            where: { externalId: j.externalId },
          });

          if (existing) {
            await prisma.job.update({
              where: { id: existing.id },
              data: {
                title: j.title,
                company: j.company,
                location: j.location,
                city: j.city,
                workMode: j.workMode,
                employmentType: j.employmentType,
                salaryMinLpa: j.salaryMinLpa,
                salaryMaxLpa: j.salaryMaxLpa,
                salaryDisclosed: j.salaryDisclosed,
                skillsRequiredJson: JSON.stringify(j.skillsRequired),
                description: j.description,
                sourceUrl: j.sourceUrl,
                verifiedAt: new Date(),
                isDemo: j.isDemo,
              },
            });
            updated++;
          } else {
            await prisma.job.create({
              data: {
                externalId: j.externalId,
                provider: j.provider,
                title: j.title,
                company: j.company,
                companyLogo: j.companyLogo,
                location: j.location,
                city: j.city,
                workMode: j.workMode,
                employmentType: j.employmentType,
                experienceMin: j.experienceMin,
                experienceMax: j.experienceMax,
                salaryMinLpa: j.salaryMinLpa,
                salaryMaxLpa: j.salaryMaxLpa,
                salaryDisclosed: j.salaryDisclosed,
                skillsRequiredJson: JSON.stringify(j.skillsRequired),
                description: j.description,
                responsibilities: j.responsibilities,
                qualifications: j.qualifications,
                sourceUrl: j.sourceUrl,
                applicationType: j.applicationType,
                isDemo: j.isDemo,
                postedAt: j.postedAt,
                verifiedAt: j.verifiedAt,
              },
            });
            added++;
          }
        }

        await prisma.jobProvider.update({
          where: { code: adapter.code },
          data: {
            syncStatus: 'SUCCESS',
            errorLog: null,
          },
        });
      } catch (err: any) {
        errors.push(`Provider [${adapter.code}] error: ${err.message}`);
        await prisma.jobProvider.update({
          where: { code: adapter.code },
          data: {
            syncStatus: 'ERROR',
            errorLog: err.message,
          },
        });
      }
    }

    // Purge any foreign non-Indian vacancies to strictly enforce India-only job portal policy
    try {
      // Purge all Arbeitnow jobs completely
      await prisma.job.deleteMany({
        where: { provider: 'ARBEITNOW' },
      });

      const allJobs = await prisma.job.findMany({ select: { id: true, title: true, location: true, city: true, provider: true } });
      const FORBIDDEN_CITIES = ['us', 'usa', 'united states', 'uk', 'germany', 'france', 'berlin', 'munich', 'london', 'toronto', 'canada', 'australia', 'rwanda', 'nigeria'];
      const nonIndiaIds = allJobs
        .filter(j => {
          const cityLower = (j.city || '').trim().toLowerCase();
          const titleLower = (j.title || '').toLowerCase();
          if (FORBIDDEN_CITIES.includes(cityLower)) {
            return true;
          }
          if (titleLower.includes('(m/w/d)') || titleLower.includes('für') || titleLower.includes('chargé')) {
            return true;
          }
          return !isIndiaEligible(j.location) && !isIndiaEligible(j.city);
        })
        .map(j => j.id);

      if (nonIndiaIds.length > 0) {
        await prisma.job.deleteMany({
          where: { id: { in: nonIndiaIds } },
        });
        console.log(`Purged ${nonIndiaIds.length} non-Indian vacancies from database.`);
      }
    } catch (purgeErr) {
      console.warn('Purge non-India jobs warning:', purgeErr);
    }

    return { added, updated, errors };
  }
}

export default new JobProviderService();
