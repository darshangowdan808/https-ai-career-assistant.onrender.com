import React from 'react';

interface ATSScoreGaugeProps {
  score: number;
  sectionScores?: {
    contactInfo: number;
    summary: number;
    skills: number;
    experience: number;
    education: number;
    formatting: number;
  };
}

export const ATSScoreGauge: React.FC<ATSScoreGaugeProps> = ({ score, sectionScores }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 65) return 'text-brand-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent ATS Alignment';
    if (score >= 65) return 'Competitive Baseline';
    if (score >= 50) return 'Moderate Match';
    return 'Actionable Gaps Detected';
  };

  const sections = sectionScores ? [
    { label: 'Technical Skills Alignment', score: sectionScores.skills },
    { label: 'Experience & Projects Depth', score: sectionScores.experience },
    { label: 'Education & Academics', score: sectionScores.education },
    { label: 'Professional Summary', score: sectionScores.summary },
    { label: 'Contact Details & Links', score: sectionScores.contactInfo },
    { label: 'Layout & ATS Formatting', score: sectionScores.formatting },
  ] : [];

  return (
    <div className="card-premium p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between border-b border-slate-100 pb-6 mb-6">
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${getScoreColor()} transition-all duration-1000 ease-out`}
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out of 100</span>
          </div>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1.5">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            score >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-brand-50 text-brand-700 border border-brand-200'
          }`}>
            {getScoreLabel()}
          </span>
          <h3 className="text-lg font-bold text-slate-900">ATS Readiness Analysis</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            Calculated using transparent structural checks: keyword presence, section headers, quantifiable impact metrics, and readability by recruiter scanning bots.
          </p>
        </div>
      </div>

      {/* Section Bars */}
      {sections.length > 0 && (
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Section-Wise Performance
          </h4>
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">{sec.label}</span>
                <span className="text-slate-900 font-bold">{sec.score}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    sec.score >= 80 ? 'bg-emerald-500' : sec.score >= 60 ? 'bg-brand-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${sec.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
