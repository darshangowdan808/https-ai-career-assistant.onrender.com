import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  FileCheck2,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Star,
  Users,
  Award,
  Zap,
} from 'lucide-react';
import { Job } from '../types';
import { api } from '../services/api';
import { JobCard } from '../components/JobCard';
import { JobDetailModal } from '../components/JobDetailModal';
import { ApplicationTrackerModal } from '../components/ApplicationTrackerModal';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchExperience, setSearchExperience] = useState('ALL');

  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.getJobs({ limit: '6' });
        if (res.success && res.jobs) {
          setFeaturedJobs(res.jobs);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    if (searchExperience && searchExperience !== 'ALL') params.set('experience', searchExperience);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleSaveJob(jobId);
      setFeaturedJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, isSaved: res.isSaved } : j))
      );
    } catch (err: any) {
      alert(`Error saving job: ${err.message}`);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-brand-50/50 via-white to-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-100/70 text-brand-800 text-xs font-semibold mb-6 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Built for Students, Freshers & Experienced Techies in India</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Your Career. Your Skills.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              Your Next Opportunity.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The all-in-one Indian career ecosystem. Discover verified jobs with real LPA salaries, get transparent ATS resume feedback, and practice realistic 4-round AI mock interviews.
          </p>

          {/* Prominent Naukri-inspired Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 max-w-4xl mx-auto bg-white p-3 rounded-2xl shadow-elevated border border-slate-200 flex flex-col md:flex-row items-center gap-2 text-left"
          >
            {/* Keyword / Role */}
            <div className="flex-1 w-full flex items-center px-3 py-2 border-b md:border-b-0 md:border-r border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Role, Skill or Company
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. React, Java, Data Analyst, Swiggy..."
                  className="w-full text-xs font-medium text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex-1 w-full flex items-center px-3 py-2 border-b md:border-b-0 md:border-r border-slate-100">
              <MapPin className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
              <div className="w-full">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Location / City
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Pune, Remote..."
                  className="w-full text-xs font-medium text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Experience Dropdown */}
            <div className="w-full md:w-48 px-3 py-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Experience
              </label>
              <select
                value={searchExperience}
                onChange={(e) => setSearchExperience(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ALL">Any Experience</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FRESHER">Fresher (0 - 1 Yrs)</option>
                <option value="1-3">1 - 3 Years</option>
                <option value="3-5">3 - 5 Years</option>
                <option value="5+">5+ Years</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-7 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 shrink-0"
            >
              <span>Search Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Popular in India:</span>
            {['Bengaluru', 'Remote', 'Frontend React', 'Java Spring Boot', 'Data Analytics', 'Fresher Friendly'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (tag === 'Fresher Friendly') setSearchExperience('FRESHER');
                  else setSearchQuery(tag);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/resume-analyzer"
              className="btn-primary px-6 py-3 text-sm shadow-md flex items-center space-x-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Upload Resume for ATS Score</span>
            </Link>
            <Link
              to="/mock-interview"
              className="btn-secondary px-6 py-3 text-sm flex items-center space-x-2"
            >
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              <span>Explore 4-Round Mock Interviews</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured & Recently Verified Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-brand-700 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Genuine Vacancies Only</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Tech Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verified openings from top tech employers and live partner feeds. Never fabricated.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
          >
            <span>Browse All Active Listings ({featuredJobs.length}+)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card-premium p-6 animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetails={(j) => setSelectedJob(j)}
                onToggleSave={handleToggleSave}
                onApply={(j) => setApplyJob(j)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3 Pillars of AI Career Assistant */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold text-brand-400 tracking-wider">
              Comprehensive Career Readiness
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              How AI Career Assistant Accelerates Your Job Hunt
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Most platforms only host job listings. We diagnose your resume, match you with genuine roles, and train you with full-length mock interviews until you clear the bar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xl border border-brand-500/30">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">1. ATS Resume Analyzer</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Extracts text from PDF and DOCX files. Computes a transparent 0–100 score based on section completeness, action verbs, and keyword density. Offers AI-improved bullet points using Google's X-Y-Z formula.
              </p>
              <Link to="/resume-analyzer" className="inline-flex items-center text-xs text-brand-400 font-semibold hover:text-brand-300">
                Analyze your resume <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Intelligent Job Matches</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Connects your extracted skills with verified openings from Indian employers. Shows exact matched skills, missing skills to learn, and transparent percentage scores weighted by skill, role, and location.
              </p>
              <Link to="/recommendations" className="inline-flex items-center text-xs text-emerald-400 font-semibold hover:text-emerald-300">
                View your job feed <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">3. 4-Round AI Mock Interview</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Simulates real Indian recruitment: Introduction, Timed Aptitude MCQs, Technical Architecture tailored to your skills, and HR Culture rounds. Rounds unlock only when you achieve the 70% passing threshold.
              </p>
              <Link to="/mock-interview" className="inline-flex items-center text-xs text-indigo-400 font-semibold hover:text-indigo-300">
                Start mock session <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Round Interview Simulation Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-premium p-8 lg:p-12 border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-indigo-50/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="badge-brand">State Machine Progression</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Practice Like You Interview in Real Life
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Forget generic one-question bots. Our structured assessment mirrors campus placements and Indian tech interviews:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Round 1: Introduction & Communication</h4>
                    <p className="text-xs text-slate-500">Evaluates storytelling, STAR structure, and clarity.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Round 2: Aptitude Assessment (Timed)</h4>
                    <p className="text-xs text-slate-500">Quantitative, logical reasoning, and verbal MCQs with automated scoring.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Round 3: Core Technical & Architecture</h4>
                    <p className="text-xs text-slate-500">Adapts dynamically to the skills detected on your resume.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Round 4: HR & Behavioral Culture Alignment</h4>
                    <p className="text-xs text-slate-500">Conflict resolution, expectations in LPA, and joining availability.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/mock-interview" className="btn-primary text-sm px-6 py-2.5 shadow-md">
                  Launch Free Mock Assessment
                </Link>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-300">Live Mock Session Demo</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-brand-400">
                  Threshold: 70% Pass
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-400">Interviewer Question:</p>
                <p className="font-medium text-slate-100 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  "Walk me through how you optimize a React dashboard experiencing high re-renders when rendering real-time market data."
                </p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AI Rubric Score: 88/100 (Passed)
                </p>
                <p className="text-slate-300 text-[11px]">
                  "Excellent mention of React.memo, useMemo, and virtualized list windowing. Unlocking Round 2 (Aptitude Assessment)."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Details Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(j) => {
          setSelectedJob(null);
          setApplyJob(j);
        }}
        onToggleSave={handleToggleSave}
      />

      {/* Apply & Track Modal */}
      <ApplicationTrackerModal
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onSuccess={(status) => {
          if (applyJob) {
            setFeaturedJobs((prev) =>
              prev.map((j) => (j.id === applyJob.id ? { ...j, applicationStatus: status } : j))
            );
          }
          setApplyJob(null);
        }}
      />
    </div>
  );
};
