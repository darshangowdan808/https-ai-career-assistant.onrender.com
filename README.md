# 🎯 AI Career Assistant — Full-Stack AI-Powered Job Portal & Mock Interview Platform

**AI Career Assistant** is a production-oriented, full-stack career platform specifically architected for students, freshers, and experienced job seekers in India. It unites verified Indian tech job discovery, transparent ATS resume scoring, intelligent skill matching, and an adaptive 4-round AI mock interview simulator in one application.

---

## 🌟 Key Pillars & Features

### 1. 💼 Verified Job Discovery (Naukri-Inspired Usability)
- **Indian Job Market Usability**: Prominent search bar filtering by role, skill, location (Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Remote), and experience (Internship, Fresher 0–1 yr, 1–3 yrs, 3–5 yrs, 5+ yrs).
- **Salary Transparency**: Prominently displays CTC in LPA (₹ Lakhs Per Annum) when disclosed.
- **Provider Adapter Architecture**:
  - `ArbeitnowAdapter`: Live tech job feed with genuine URLs and remote tags.
  - `AdzunaAdapter`: Integrates with Adzuna India job search API when credentials are provided.
  - `VerifiedPartnerAdapter`: Official career portal openings for top employers (Razorpay, Swiggy, TCS, PhonePe, Zerodha, Zomato) with real apply links.
  - **Zero Fabricated Listings**: Clearly badges verified sources and never presents fake vacancies.
- **Application Activity Tracker**: Tracks lifecycle statuses (`INTERESTED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`) with personal notes.

### 2. 📄 ATS Resume Analyzer
- **Dual Format Extraction**: Processes both **PDF** and **DOCX** files with text validation and scan detection.
- **Transparent 0–100 Score**: Section-by-section breakdown (Skills 30%, Experience 25%, Contact 15%, Summary 10%, Education 10%, Formatting 10%).
- **Keyword Gap Analysis**: Highlights matched skills vs. underrepresented keywords for target roles.
- **AI Content Improvement**: Generates optimized summaries and bullet point rewrites following the **Google X-Y-Z formula**.
- **Privacy First**: Secure memory processing with complete data deletion controls.

### 3. 🤖 5-Round AI Mock Interview & DSA Coding Sandbox
- **Strict Server-Side State Machine**:
  - **Round 1**: Introduction & Professional Communication (STAR method evaluation).
  - **Round 2**: Aptitude Assessment (Timed MCQs: Quantitative, Logical, Verbal, Number Series with automatic scoring).
  - **Round 3**: Core Technical & Architecture (Tailored dynamically to resume skills and role).
  - **Round 4**: Data Structures & Algorithms (DSA) Coding Challenge (2 coding problems with monospace editor, Big-O complexity analysis, and automated evaluation).
  - **Round 5**: HR & Behavioral Culture Alignment (Conflict resolution, LPA expectations, joining timeline).
- **Anti-Cheating Proctoring**: Real-time detection of browser tab switches, permitting a maximum of 3 tab switches before session termination.
- **Strict Question Non-Repetition**: Unique questions selected within and across sessions so candidates never repeat questions.
- **Progression Lock**: Subsequent rounds remain strictly locked until candidate scores $\ge 70\%$ on previous rounds.
- **Retry Mechanism**: Failed rounds provide tailored improvement tips and allow instant retry attempts.
- **Persistence**: Round progress, countdown timers, and answer logs survive browser refreshes and session logouts.

### 4. 🧭 Personalized Learning Roadmaps
- **Skill Acceleration**: Tailored weekly roadmaps addressing candidate skill gaps with curated official documentation links, free courses, and hands-on portfolio project blueprints.

### 5. 🛡️ Role-Protected Admin Dashboard
- **System Telemetry**: Real-time stats on registered candidates, jobs indexed, resumes scanned, and mock interviews.
- **Provider Sync Engine**: 1-click manual trigger and automated background syncing for job feeds.
- **Configurable Thresholds**: Live adjustment of mock interview passing thresholds (default 70%).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT, BCrypt |
| **Database & ORM** | SQLite (Zero-config out of the box), PostgreSQL compatible, Prisma ORM |
| **Document Parsers** | `pdf-parse` (PDF text extraction), `mammoth` (DOCX extraction) |
| **AI Integration** | Pluggable Gemini/OpenAI adapter + Built-in deterministic Heuristic ATS engine |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) and npm installed.

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Run database migration & generate Prisma Client
npx prisma db push

# Seed default admin, sample student candidate, and verified jobs
npm run prisma:seed

# Start development server on port 5000
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server on port 5173
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing

Run the automated backend test suite covering Authentication, ATS Scoring, Recommendation Math, and the 4-Round State Machine progression:

```bash
cd backend
npm run test
```

Expected test results:
```text
  ✅ PASS: Candidate user exists in database
  ✅ PASS: Password hashing and verification works
  ✅ PASS: ATS score calculated (84/100)
  ✅ PASS: Matched skills identified: react, javascript, typescript, css, tailwind, git
  ✅ PASS: Contact info detected correctly (Email + Phone)
  ✅ PASS: Recommendation engine returns list
  ✅ PASS: All 5 interview rounds initialized
  ✅ PASS: Round 1 is active (NOT_STARTED)
  ✅ PASS: Round 2 is initially LOCKED
  ✅ PASS: Round 3 is initially LOCKED
  ✅ PASS: Round 4 (DSA) is initially LOCKED
  ✅ PASS: Round 5 (HR) is initially LOCKED
  ✅ PASS: Round 4 contains exactly 2 DSA Coding questions
  ✅ PASS: Round 4 questions are CODING type
  ✅ PASS: Server-side progression guard blocks submitting LOCKED Round 2
  ✅ PASS: Round 1 marked COMPLETED with score 95%
  ✅ PASS: Round 2 successfully UNLOCKED following pass threshold!
```

---

## 🔑 Default Demo Credentials

For quick evaluation, use the one-click buttons on the login page or enter:

| Role | Email | Password |
|---|---|---|
| **Candidate / Student** | `candidate@careerassistant.in` | `Candidate@123` |
| **Platform Administrator** | `admin@careerassistant.in` | `Admin@123` |

---

## ⚙️ Environment Configuration (`.env`)

See `.env.example` in `backend/.env.example`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET=super-secret-ai-career-assistant-token-2026

# Optional: Add external LLM credentials if desired (Demo mode works automatically)
GEMINI_API_KEY=
OPENAI_API_KEY=

# Optional: Adzuna Job Search API credentials
ADZUNA_APP_ID=
ADZUNA_APP_KEY=

PASSING_THRESHOLD=70
DEMO_MODE=true
```
