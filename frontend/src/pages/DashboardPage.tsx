import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  FileCheck2,
  Briefcase,
  BrainCircuit,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Edit3,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Job, ResumeAnalysis } from '../types';
import { ProfileModal } from '../components/ProfileModal';
import { JobDetailModal } from '../components/JobDetailModal';
import { ApplicationTrackerModal } from '../components/ApplicationTrackerModal';
import { useAuth } from '../context/AuthContext';

const toArray = (val: any, fallback: string[] = []): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return fallback;
};

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [savedRes, appsRes, intRes, anaRes] = await Promise.all([
        api.getSavedJobs(),
        api.getApplications(),
        api.getUserInterviews(),
        api.getLatestAnalysis(),
      ]);

      if (savedRes.success) setSavedJobs(savedRes.savedJobs || []);
      if (appsRes.success) setApplications(appsRes.applications || []);
      if (intRes.success) setInterviews(intRes.sessions || []);
      if (anaRes.success && anaRes.analysis) setLatestAnalysis(anaRes.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const profile = user?.profile;
  const completion = profile?.profileCompleted || 25;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OFFER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERVIEW':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'ASSESSMENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REJECTED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Please Sign In to View Your Dashboard</h2>
        <p className="text-xs text-slate-500">
          Your dashboard saves your applications, ATS feedback, saved jobs, and interview progression.
        </p>
        <Link to="/login" className="btn-primary text-xs px-5 py-2 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="card-premium p-6 lg:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wider">
              Candidate Workspace
            </span>
            <span className="text-xs text-slate-400">Pan-India Job Seeker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {profile?.headline || 'Undergraduate / Job Seeker preparing for placement and recruitment.'}
          </p>
        </div>

        {/* Profile Completion Bar */}
        <div className="w-full md:w-64 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Profile Strength</span>
            <span className="font-extrabold text-white">{completion}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full text-center text-[11px] text-brand-300 hover:text-white font-semibold flex items-center justify-center gap-1 pt-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Update Profile Details</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: ATS Score */}
        <div className="card-premium p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Latest ATS Score</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {latestAnalysis ? `${latestAnalysis.overallScore}/100` : 'Not Scanned'}
            </p>
            <Link to="/resume-analyzer" className="text-[11px] text-brand-600 font-semibold hover:underline">
              {latestAnalysis ? 'View Analysis' : 'Upload Resume'}
            </Link>
          </div>
        </div>

        {/* Metric 2: Applications Tracked */}
        <div className="card-premium p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Applications</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{applications.length}</p>
            <span className="text-[11px] text-slate-400">Tracked in portal</span>
          </div>
        </div>

        {/* Metric 3: Mock Interviews */}
        <div className="card-premium p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mock Sessions</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{interviews.length}</p>
            <Link to="/mock-interview" className="text-[11px] text-indigo-600 font-semibold hover:underline">
              Practice Interview
            </Link>
          </div>
        </div>

        {/* Metric 4: Saved Jobs */}
        <div className="card-premium p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Saved Vacancies</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{savedJobs.length}</p>
            <Link to="/jobs" className="text-[11px] text-emerald-600 font-semibold hover:underline">
              Search Openings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Tracker & Saved Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-600" />
              <span>Application Activity Tracker</span>
            </h2>
            <Link to="/jobs" className="text-xs text-brand-600 hover:underline font-semibold">
              Find More Jobs →
            </Link>
          </div>

          <div className="card-premium divide-y divide-slate-100 overflow-hidden">
            {applications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No applications recorded yet.</p>
                <Link to="/jobs" className="btn-primary text-xs px-4 py-1.5 inline-block">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{app.job.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {app.job.company} • {app.job.location}
                    </p>
                    {app.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-1">Note: "{app.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                    <button
                      onClick={() => setSelectedJob(app.job)}
                      className="text-xs text-slate-500 hover:text-slate-800 p-1"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Mock Interview Sessions */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                <span>Mock Interview Attempts</span>
              </h2>
              <Link to="/mock-interview" className="text-xs text-indigo-600 hover:underline font-semibold">
                Start New Session →
              </Link>
            </div>

            <div className="card-premium divide-y divide-slate-100 overflow-hidden">
              {interviews.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">No mock interview sessions attempted yet.</p>
                  <Link to="/mock-interview" className="btn-primary text-xs px-4 py-1.5 inline-block">
                    Take Practice Assessment
                  </Link>
                </div>
              ) : (
                interviews.map((session) => (
                  <div key={session.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{session.targetRole}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Current Round: {session.currentRound} of 4 • Difficulty: {session.difficulty}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        session.passStatus === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : session.passStatus === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {session.passStatus} {session.overallScore ? `(${session.overallScore}%)` : ''}
                      </span>
                      <Link
                        to="/mock-interview"
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        Resume
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Saved Jobs & Profile Summary */}
        <div className="space-y-6">
          {/* Candidate Profile Skills Summary */}
          <div className="card-premium p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Skills & Preferences</h3>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs text-brand-600 hover:underline font-semibold"
              >
                Edit
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Roles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {toArray(profile?.preferredRoles, ['Software Engineer']).map((r: string, i: number) => (
                  <span key={i} className="badge-brand text-[11px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Skills Catalog
              </p>
              <div className="flex flex-wrap gap-1.5">
                {toArray(profile?.skills, ['React', 'JavaScript', 'SQL']).map((s: string, i: number) => (
                  <span key={i} className="badge-slate text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Preferred Hubs
              </p>
              <p className="text-xs text-slate-700 font-medium">
                {toArray(profile?.preferredLocations, ['Bengaluru', 'Remote']).join(', ')}
              </p>
            </div>
          </div>

          {/* Saved Jobs List */}
          <div className="card-premium p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Saved Jobs ({savedJobs.length})</h3>
            <div className="divide-y divide-slate-100">
              {savedJobs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No saved jobs yet.</p>
              ) : (
                savedJobs.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2.5 space-y-1">
                    <h5
                      onClick={() => setSelectedJob(item.job)}
                      className="text-xs font-bold text-slate-800 hover:text-brand-600 cursor-pointer line-clamp-1"
                    >
                      {item.job.title}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {item.job.company} • {item.job.location}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdated={loadDashboardData}
      />

      {/* Details & Tracker Modals */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(j) => {
          setSelectedJob(null);
          setApplyJob(j);
        }}
        onToggleSave={() => {}}
      />

      <ApplicationTrackerModal
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onSuccess={() => {
          loadDashboardData();
          setApplyJob(null);
        }}
      />
    </div>
  );
};
