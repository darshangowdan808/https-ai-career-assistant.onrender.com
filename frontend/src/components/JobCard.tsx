import React from 'react';
import { Job } from '../types';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Building2,
  Star,
  Flame,
  ChevronRight,
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
  onApply: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onViewDetails, onToggleSave, onApply }) => {
  // Format Indian LPA Salary in Naukri style
  const formatSalary = () => {
    if (!job.salaryDisclosed || (!job.salaryMinLpa && !job.salaryMaxLpa)) {
      return 'Not disclosed';
    }
    if (job.salaryMinLpa && job.salaryMaxLpa) {
      return `₹ ${job.salaryMinLpa} - ${job.salaryMaxLpa} Lacs P.A.`;
    }
    return `₹ ${job.salaryMinLpa || job.salaryMaxLpa} Lacs P.A.`;
  };

  // Format Experience in Naukri style
  const formatExperience = () => {
    if (job.employmentType === 'INTERNSHIP') return 'Internship';
    if (job.experienceMin === 0 && job.experienceMax <= 1) return '0 - 1 Yrs (Fresher)';
    return `${job.experienceMin} - ${job.experienceMax} Yrs`;
  };

  // Mock authentic rating based on company for Naukri fidelity
  const getRating = (company: string) => {
    const hash = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rating = (3.8 + (hash % 11) / 10).toFixed(1);
    const reviews = 500 + (hash % 45) * 120;
    return { rating, reviews: reviews > 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews };
  };

  const { rating, reviews } = getRating(job.company);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-card p-5 transition-all duration-200 flex flex-col justify-between group relative">
      <div>
        {/* Top: Job Title & Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex-1">
            <h3
              onClick={() => onViewDetails(job)}
              className="text-base font-bold text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors leading-snug line-clamp-1"
            >
              {job.title}
            </h3>

            {/* Company Name & Naukri Rating */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className="font-semibold text-slate-800">{job.company}</span>
              <span className="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                <Star className="w-3 h-3 mr-0.5 fill-amber-500 text-amber-500" />
                {rating}
              </span>
              <span className="text-slate-400 text-[11px]">({reviews} Reviews)</span>

              {job.provider === 'VERIFIED_PARTNER' && (
                <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" /> Verified Employer
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onToggleSave(job.id)}
            title={job.isSaved ? 'Remove from saved jobs' : 'Save this job'}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              job.isSaved
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-blue-600' : ''}`} />
          </button>
        </div>

        {/* Naukri 3-Column Attributes: Exp, Salary, Location */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 py-2.5 my-2 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center space-x-1 font-medium text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatExperience()}</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center space-x-1 font-semibold text-slate-900">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatSalary()}</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center space-x-1 truncate max-w-[280px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-slate-700 font-medium">{job.location}</span>
          </div>
        </div>

        {/* 2-Line Role Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {job.description}
        </p>

        {/* Skills Tags (Naukri style subtle gray pills) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {job.skillsRequired.slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/90"
            >
              {skill}
            </span>
          ))}
          {job.skillsRequired.length > 5 && (
            <span className="text-[11px] text-slate-400 font-medium pl-1">
              +{job.skillsRequired.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Posted info & Apply buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            Posted recently
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center text-orange-600 font-medium">
            <Flame className="w-3 h-3 mr-0.5" />
            Few Applicants
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewDetails(job)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onApply(job)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs flex items-center space-x-1"
          >
            <span>Apply</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
