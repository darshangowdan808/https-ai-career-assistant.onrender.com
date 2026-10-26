import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  FolderGit2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { LearningPlan, LearningProgressItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const LearningPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlan();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.getLearningPlan();
      if (res.success && res.plan) {
        setPlan(res.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (item: LearningProgressItem, newStatus: string) => {
    const newPercent = newStatus === 'COMPLETED' ? 100 : newStatus === 'IN_PROGRESS' ? 50 : 0;
    try {
      await api.updateProgress({
        progressId: item.id,
        status: newStatus,
        progressPercent: newPercent,
      });

      setPlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          progressItems: prev.progressItems.map((p) =>
            p.id === item.id ? { ...p, status: newStatus as any, progressPercent: newPercent } : p
          ),
        };
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <Compass className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Your Learning Roadmap</h2>
        <p className="text-xs text-slate-500">
          Personalized roadmaps are dynamically compiled based on your resume skill gaps and target roles.
        </p>
        <Link to="/login" className="btn-primary text-xs px-5 py-2 inline-block">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Curated Tech Roadmaps & Real Projects</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Personalized Career Preparation Plan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bridge your detected resume gaps and prepare for placements with official documentation, practice challenges, and portfolio blueprints.
        </p>
      </div>

      {loading ? (
        <div className="card-premium p-10 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      ) : plan ? (
        <div className="space-y-8">
          {/* Plan Overview Banner */}
          <div className="card-premium p-6 bg-gradient-to-r from-brand-900 to-indigo-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                {plan.timelineWeeks}-Week Acceleration Roadmap
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Target Role: {plan.roleTarget}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Focus on the high-impact skills below to boost your ATS compatibility and technical interview scores.
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-brand-300">
                {plan.progressItems.filter((i) => i.status === 'COMPLETED').length} / {plan.progressItems.length}
              </span>
              <p className="text-[11px] text-slate-300">Competencies Mastered</p>
            </div>
          </div>

          {/* Core Skills & Resources List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Prioritized Learning Pathways</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.resources.map((res, idx) => {
                const progressItem = plan.progressItems.find((p) => p.skillName === res.skill);
                const currentStatus = progressItem?.status || 'NOT_STARTED';

                return (
                  <div key={idx} className="card-premium p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          res.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {res.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{res.estimatedHours} Hours
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{res.skill}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{res.category}</p>

                      <div className="mt-4 space-y-2.5 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                            Official Guide & Tutorials:
                          </p>
                          <a
                            href={res.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline flex items-center gap-1"
                          >
                            <span>{res.freeCourse}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Hands-On Challenge:
                          </p>
                          <p className="text-slate-600">{res.practiceTask}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Selector */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Status:</span>
                      <div className="flex items-center space-x-1">
                        {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => progressItem && handleUpdateStatus(progressItem, st)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              currentStatus === st
                                ? st === 'COMPLETED'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'IN_PROGRESS'
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-slate-700 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st === 'NOT_STARTED' ? 'To Do' : st === 'IN_PROGRESS' ? 'In Progress' : 'Mastered ✓'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Blueprints Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-slate-900">Recommended Portfolio Project Blueprints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.projectIdeas.map((proj, idx) => (
                <div key={idx} className="card-premium p-6 space-y-3 bg-gradient-to-br from-white to-slate-50">
                  <div className="flex items-center space-x-2 text-brand-700">
                    <FolderGit2 className="w-5 h-5" />
                    <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.techStack.map((tech, tIdx) => (
                      <span key={tIdx} className="badge-slate text-[11px]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
