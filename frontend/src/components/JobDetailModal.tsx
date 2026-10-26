import React from 'react';
import { Job } from '../types';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  ShieldCheck,
  ExternalLink,
  Bookmark,
  Share2,
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onApply: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onApply,
  onToggleSave,
}) => {
  if (!job) return null;

  const formatSalary = () => {
    if (!job.salaryDisclosed || (!job.salaryMinLpa && !job.salaryMaxLpa)) {
      return 'Salary Undisclosed / Competitive as per industry standards';
    }
    if (job.salaryMinLpa && job.salaryMaxLpa) {
      return `₹${job.salaryMinLpa} - ${job.salaryMaxLpa} LPA`;
    }
    return `₹${job.salaryMinLpa || job.salaryMaxLpa} LPA`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                {job.company.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 text-sm">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location}
                </span>
                <span>•</span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-medium">
                  {job.workMode.replace('_', '-')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(job.id)}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Save Job"
            >
              <Bookmark className={`w-5 h-5 ${job.isSaved ? 'fill-brand-600 text-brand-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Experience</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {job.employmentType === 'INTERNSHIP' ? 'Internship' : `${job.experienceMin} - ${job.experienceMax} Yrs`}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Salary (INR)</p>
              <p className="font-semibold text-slate-900 mt-0.5">{formatSalary()}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Employment Type</p>
              <p className="font-semibold text-slate-900 mt-0.5">{job.employmentType.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase">Verified Feed</p>
              <p className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {job.provider}
              </p>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Skills Required
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Job Overview & Requirements
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {job.responsibilities && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Key Responsibilities
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{job.responsibilities}</p>
            </div>
          )}

          {job.qualifications && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Candidate Qualifications
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{job.qualifications}</p>
            </div>
          )}

          {/* Source Attribution Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Source Transparency & Verification:</p>
            <p>
              This vacancy is sourced via {job.provider}. Clicking Apply will open the official employer application portal and record your application in your Candidate Dashboard.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {job.applicationStatus ? (
              <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded">
                Current Tracker Status: {job.applicationStatus}
              </span>
            ) : (
              'Application not yet tracked'
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Close
            </button>
            <button
              onClick={() => onApply(job)}
              className="btn-primary text-xs px-5 py-2 flex items-center space-x-1.5"
            >
              <span>Apply on Company Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
