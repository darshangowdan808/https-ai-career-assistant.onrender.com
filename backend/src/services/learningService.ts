import prisma from '../config/db';

export interface LearningSkillResource {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  estimatedHours: number;
  documentationUrl: string;
  freeCourse: string;
  practiceTask: string;
  recommendedProject: string;
}

class LearningService {
  /**
   * Generates or retrieves candidate's personalized learning plan
   */
  public async getOrCreatePlan(userId: string, roleTarget: string = 'Full Stack Software Engineer') {
    // Check if existing plan exists
    const existing = await prisma.learningPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { progressItems: true },
    });

    if (existing) {
      return {
        ...existing,
        prioritySkills: JSON.parse(existing.prioritySkillsJson),
        resources: JSON.parse(existing.resourcesJson),
        projectIdeas: JSON.parse(existing.projectIdeasJson),
      };
    }

    // Curated learning pathways for common tech domains
    const resourceBank: Record<string, LearningSkillResource> = {
      'System Design': {
        skill: 'System Design & Scalability',
        priority: 'HIGH',
        category: 'Architecture',
        estimatedHours: 25,
        documentationUrl: 'https://github.com/donnemartin/system-design-primer',
        freeCourse: 'ByteByteGo System Design Basics & Primer',
        practiceTask: 'Design a scalable URL shortener handling 10,000 requests/sec with caching.',
        recommendedProject: 'Distributed Rate Limiter microservice using Redis token bucket algorithm.',
      },
      'Docker & Containers': {
        skill: 'Docker & Containerization',
        priority: 'HIGH',
        category: 'DevOps',
        estimatedHours: 15,
        documentationUrl: 'https://docs.docker.com/get-started/',
        freeCourse: 'Docker for Beginners by Docker Official / FreeCodeCamp',
        practiceTask: 'Multi-stage Dockerfile build for a full-stack Node.js + React application.',
        recommendedProject: 'Containerized Microservices cluster with Docker Compose and Nginx reverse proxy.',
      },
      'PostgreSQL & Optimization': {
        skill: 'PostgreSQL & Query Optimization',
        priority: 'HIGH',
        category: 'Databases',
        estimatedHours: 20,
        documentationUrl: 'https://www.postgresql.org/docs/current/tutorial.html',
        freeCourse: 'PostgreSQL Tutorial by freeCodeCamp & PG Exercises',
        practiceTask: 'Analyze slow queries using EXPLAIN ANALYZE and implement composite B-Tree indexes.',
        recommendedProject: 'E-commerce transactional inventory ledger with concurrency locks and ACID transactions.',
      },
      'TypeScript': {
        skill: 'TypeScript Advanced Patterns',
        priority: 'MEDIUM',
        category: 'Frontend/Backend',
        estimatedHours: 18,
        documentationUrl: 'https://www.typescriptlang.org/docs/handbook/intro.html',
        freeCourse: 'TypeScript Deep Dive & Official Handbook',
        practiceTask: 'Build custom utility types (DeepPartial, ReturnType, Discriminated Unions).',
        recommendedProject: 'Type-safe schema validator and form generator library.',
      },
      'Data Structures & Algorithms': {
        skill: 'Data Structures & Algorithmic Problem Solving',
        priority: 'HIGH',
        category: 'Core CS',
        estimatedHours: 40,
        documentationUrl: 'https://neetcode.io/roadmap',
        freeCourse: 'NeetCode 150 & Striver SDE Sheet',
        practiceTask: 'Solve 2 problems daily on Graphs, Dynamic Programming, and Two Pointers.',
        recommendedProject: 'Interactive visualizer for Graph Traversal (Dijkstra / BFS / DFS).',
      },
    };

    const targetSkills = Object.values(resourceBank);
    const prioritySkillsList = targetSkills.map((t) => t.skill);

    const projectIdeas = [
      {
        title: 'High-Concurrency Ticket Booking System',
        description: 'Implement distributed locking with Redis and optimistic concurrency control in PostgreSQL to prevent double-booking.',
        techStack: ['Node.js/FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
      },
      {
        title: 'Real-Time Collaborative Code Editor',
        description: 'WebSockets-based operational transformation editor with syntax highlighting, AST parsing, and room authentication.',
        techStack: ['React', 'TypeScript', 'WebSockets', 'Tailwind CSS'],
      },
    ];

    // Create LearningPlan record
    const plan = await prisma.learningPlan.create({
      data: {
        userId,
        roleTarget,
        prioritySkillsJson: JSON.stringify(prioritySkillsList),
        resourcesJson: JSON.stringify(targetSkills),
        projectIdeasJson: JSON.stringify(projectIdeas),
        timelineWeeks: 6,
        status: 'ACTIVE',
      },
    });

    // Create initial Progress items
    for (const item of targetSkills) {
      await prisma.learningProgress.create({
        data: {
          learningPlanId: plan.id,
          skillName: item.skill,
          status: 'NOT_STARTED',
          progressPercent: 0,
        },
      });
    }

    const created = await prisma.learningPlan.findUnique({
      where: { id: plan.id },
      include: { progressItems: true },
    });

    return {
      ...created,
      prioritySkills: prioritySkillsList,
      resources: targetSkills,
      projectIdeas,
    };
  }

  /**
   * Updates skill progress in candidate's learning plan
   */
  public async updateProgress(progressId: string, status: string, progressPercent: number, notes?: string) {
    return prisma.learningProgress.update({
      where: { id: progressId },
      data: {
        status,
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
        notes,
      },
    });
  }
}

export default new LearningService();
