"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../src/config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const aiService_1 = __importDefault(require("../src/services/aiService"));
const interviewService_1 = __importDefault(require("../src/services/interviewService"));
const recommendationService_1 = __importDefault(require("../src/services/recommendationService"));
async function runTests() {
    console.log('🧪 Starting automated backend tests...');
    let passed = 0;
    let failed = 0;
    function assert(condition, msg) {
        if (condition) {
            console.log(`  ✅ PASS: ${msg}`);
            passed++;
        }
        else {
            console.error(`  ❌ FAIL: ${msg}`);
            failed++;
        }
    }
    try {
        // Test 1: User & Auth
        const user = await db_1.default.user.findUnique({ where: { email: 'candidate@careerassistant.in' } });
        assert(Boolean(user), 'Candidate user exists in database');
        const isPwValid = user ? await bcryptjs_1.default.compare('Candidate@123', user.passwordHash) : false;
        assert(isPwValid, 'Password hashing and verification works');
        // Test 2: Resume ATS Heuristic Analysis
        const sampleResume = `
      Aarav Sharma
      aarav.sharma@example.com | +91 9123456789 | Bengaluru, India
      
      Professional Summary:
      Final year computer science student with hands-on experience in React, TypeScript, and Node.js.
      
      Education:
      B.Tech Computer Science & Engineering, 2022 - 2026, VTU Karnataka (CGPA 8.7/10)
      
      Technical Skills:
      Languages: JavaScript, TypeScript, Python, SQL
      Frameworks: React, Node.js, Express, Tailwind CSS
      Tools: Git, Docker, Postman
      
      Projects:
      Full-Stack E-Commerce Portal: Built with React, Node.js, and PostgreSQL. Reduced latency by 35% through Redis caching and served 1200+ monthly active users.
    `;
        const analysis = await aiService_1.default.analyzeResume(sampleResume, 'Frontend / React Developer');
        assert(analysis.overallScore >= 60, `ATS score calculated (${analysis.overallScore}/100)`);
        assert(analysis.matchedSkills.length >= 2, `Matched skills identified: ${analysis.matchedSkills.join(', ')}`);
        assert(analysis.sectionScores.contactInfo === 100, 'Contact info detected correctly (Email + Phone)');
        // Test 3: Recommendation Engine
        if (user) {
            const recommendations = await recommendationService_1.default.getRecommendationsForUser(user.id);
            assert(Array.isArray(recommendations), 'Recommendation engine returns list');
            console.log(`     -> Generated ${recommendations.length} job recommendations`);
        }
        // Test 4: 4-Round Interview State Machine
        if (user) {
            console.log('Testing Mock Interview State Machine...');
            const session = await interviewService_1.default.createSession(user.id, 'Frontend Developer', 'Swiggy', 'React and TypeScript engineer', 'MEDIUM');
            assert(session.rounds.length === 4, 'All 4 interview rounds initialized');
            assert(session.rounds[0].status === 'NOT_STARTED', 'Round 1 is active (NOT_STARTED)');
            assert(session.rounds[1].status === 'LOCKED', 'Round 2 is initially LOCKED');
            assert(session.rounds[2].status === 'LOCKED', 'Round 3 is initially LOCKED');
            assert(session.rounds[3].status === 'LOCKED', 'Round 4 is initially LOCKED');
            // Test Locked Round Protection: Attempting to submit Round 2 should throw!
            let lockedBlocked = false;
            try {
                await interviewService_1.default.submitRoundAnswers(session.id, 2, user.id, []);
            }
            catch (err) {
                lockedBlocked = true;
            }
            assert(lockedBlocked, 'Server-side progression guard blocks submitting LOCKED Round 2');
            // Submit Round 1 with good answers
            const round1Questions = session.rounds[0].questions;
            const submissions = round1Questions.map((q) => ({
                questionId: q.id,
                answerText: 'I am a passionate software engineer with extensive practical experience in React, TypeScript, and modern state architectures. For example, in my last project I designed a responsive e-commerce web application because I wanted to solve checkout drop-off, which resulted in a 30% improvement in checkout conversion and reduced page load times. I tested this rigorously and collaborated with my team.',
            }));
            const afterRound1 = await interviewService_1.default.submitRoundAnswers(session.id, 1, user.id, submissions);
            assert(afterRound1.rounds[0].status === 'COMPLETED', `Round 1 marked COMPLETED with score ${afterRound1.rounds[0].score}%`);
            assert(afterRound1.rounds[1].status === 'NOT_STARTED', 'Round 2 successfully UNLOCKED following pass threshold!');
            // Clean up test session
            await db_1.default.interviewSession.delete({ where: { id: session.id } });
        }
        console.log(`\n🏁 Test Suite Results: ${passed} passed, ${failed} failed.`);
        if (failed > 0)
            process.exit(1);
    }
    catch (err) {
        console.error('Test execution failed:', err);
        process.exit(1);
    }
    finally {
        await db_1.default.$disconnect();
    }
}
runTests();
