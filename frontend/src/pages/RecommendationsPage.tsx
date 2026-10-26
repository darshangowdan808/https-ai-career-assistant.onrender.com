import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  MapPin,
  IndianRupee,
  ExternalLink,
  ShieldCheck,
  Bookmark,
} from 'lucide-react';
import { api } from '../services/api';
import { JobRecommendation, Job } from '../types';
import { JobDetailModal } from '../components/JobDetailModal';
import { ApplicationTrackerModal } from '../components/ApplicationTrackerModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations();
      if (res.success && res.recommendations) {
        setRecommendations(res.recommendations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (jobId: string) => {
    try {
      const res = await api.toggleSaveJob(jobId);
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.job.id === jobId ? { ...rec, job: { ...rec.job, isSaved: res.isSaved } } : rec
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Transparent Multi-Factor Matching Algorithm</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Personalized Job Recommendations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Scored by matching your extracted resume skills (50%), target role similarity (25%), experience level (15%), and location preferences (10%).
        </p>
      </div>

      {!user ? (
        <div className="card-premium p-10 text-center max-w-lg mx-auto space-y-4">
          <Sparkles className="w-10 h-10 text-brand-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Log In for Personalized Matching</h3>
          <p className="text-xs text-slate-500">
            Sign in or upload your resume to generate tailored job suggestions based on your verified skills.
          </p>
          <Link to="/login" className="btn-primary text-xs px-5 py-2 inline-block">
            Log In or Use Demo Candidate
          </Link>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card-premium p-10 text-center space-y-4 max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Recommendations Yet</h3>
          <p className="text-xs text-slate-500">
            Upload your resume on the Resume Analyzer page to extract your skills and unlock tailored job suggestions!
          </p>
          <Link to="/resume-analyzer" className="btn-primary text-xs px-5 py-2 inline-block">
            Upload Resume Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const job = rec.job;
            const matchScore = rec.matchScore;

            return (
              <div
                key={job.id}
                className="card-premium p-6 hover:border-brand-300 transition-all space-y-4"
              >
                {/* Top Header: Title + Match Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3
                        onClick={() => setSelectedJob(job)}
                        className="text-base font-bold text-slate-900 hover:text-brand-600 cursor-pointer"
                      >
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{job.company}</span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="capitalize">{job.workMode.replace('_', '-')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{matchScore}% Match</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Weighted algorithm</p>
                    </div>

                    <button
                      onClick={() => handleToggleSave(job.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        job.isSaved
                          ? 'bg-brand-50 text-brand-600 border-brand-200'
                          : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-brand-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Relevance explanation banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    Why recommended: {rec.relevanceReason}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Skills: {rec.weights.skillsWeight}% • Role: {rec.weights.roleWeight}% • Exp: {rec.weights.experienceWeight}%
                  </span>
                </div>

                {/* Skills breakdown: Matched vs Inferred vs To Learn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 font-semibold">
                      Skills You Have ({rec.matchedSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.matchedSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          ✓ {s}
                        </span>
                      ))}
                      {rec.matchedSkills.length === 0 && (
                        <span className="text-slate-400 text-[11px]">No exact keyword overlap</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1 font-semibold">
                      Skills to Learn Next ({rec.toLearnSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.toLearnSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified feed: {job.provider}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setApplyJob(job)}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center space-x-1"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={(j) => {
          setSelectedJob(null);
          setApplyJob(j);
        }}
        onToggleSave={handleToggleSave}
      />

      <ApplicationTrackerModal
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onSuccess={(status) => {
          if (applyJob) {
            setRecommendations((prev) =>
              prev.map((rec) =>
                rec.job.id === applyJob.id
                  ? { ...rec, job: { ...rec.job, applicationStatus: status } }
                  : rec
              )
            );
          }
          setApplyJob(null);
        }}
      />
    </div>
  );
};
