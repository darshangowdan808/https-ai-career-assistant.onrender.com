"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Seed Admin User
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@careerassistant.in' },
        update: {},
        create: {
            email: 'admin@careerassistant.in',
            name: 'Super Administrator',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            phone: '+91 9876543210',
        },
    });
    console.log('👤 Admin user seeded:', adminUser.email);
    // 2. Seed Sample Student/Fresher Candidate
    const candidatePasswordHash = await bcryptjs_1.default.hash('Candidate@123', 10);
    const candidateUser = await prisma.user.upsert({
        where: { email: 'candidate@careerassistant.in' },
        update: {},
        create: {
            email: 'candidate@careerassistant.in',
            name: 'Aarav Sharma',
            passwordHash: candidatePasswordHash,
            role: 'USER',
            phone: '+91 9123456789',
            profile: {
                create: {
                    headline: 'Final Year CS Student | Full Stack & React Enthusiast',
                    bio: 'Passionate computer science undergraduate with strong foundation in data structures, React.js, Node.js, and relational databases. Seeking entry-level Software Development Engineer role in Bengaluru or remote.',
                    education: 'B.Tech in Computer Science & Engineering (2022 - 2026)',
                    graduationYear: 2026,
                    experienceYears: 0,
                    currentRole: 'Undergraduate Student / Fresher',
                    preferredRoles: JSON.stringify(['Software Engineer', 'Frontend Developer', 'Full Stack Developer']),
                    skills: JSON.stringify(['React', 'JavaScript', 'TypeScript', 'Node.js', 'SQL', 'HTML', 'CSS', 'Git', 'Data Structures']),
                    preferredLocations: JSON.stringify(['Bengaluru', 'Pune', 'Hyderabad', 'Remote']),
                    expectedSalaryLpa: 8.5,
                    employmentTypes: JSON.stringify(['FULL_TIME', 'INTERNSHIP']),
                    profileCompleted: 85,
                },
            },
        },
    });
    console.log('🎓 Candidate user seeded:', candidateUser.email);
    // 3. Seed Admin Settings
    const settings = [
        { key: 'passing_threshold', value: '70', description: 'Minimum percentage score required to pass mock interview rounds.' },
        { key: 'demo_mode', value: 'true', description: 'Enable deterministic fallback when external AI/Job APIs lack credentials.' },
        { key: 'max_daily_interviews', value: '5', description: 'Maximum mock interview sessions a candidate can initiate per day.' },
    ];
    for (const s of settings) {
        await prisma.adminSetting.upsert({
            where: { key: s.key },
            create: s,
            update: { value: s.value },
        });
    }
    console.log('⚙️ Admin settings seeded.');
    console.log('✅ Database seeding finished successfully.');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
