import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { ResumeAnalysis } from '../types';
import { ATSScoreGauge } from '../components/ATSScoreGauge';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const ResumeAnalyzerPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load existing latest analysis on mount
  useEffect(() => {
    if (user) {
      loadLatest();
    }
  }, [user]);

  const loadLatest = async () => {
    try {
      const res = await api.getLatestAnalysis();
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
        setResumeId(res.resume?.id || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg('File exceeds 5MB size limit. Please upload a smaller PDF or DOCX file.');
        return;
      }
      setFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMsg('');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg('File exceeds 5MB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a PDF or DOCX resume document.');
      return;
    }
    if (!user) {
      setErrorMsg('Please log in or click "Demo Candidate" in the top bar to analyze resumes.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetRole', targetRole);
      if (targetJobDesc) formData.append('targetJobDesc', targetJobDesc);

      const res = await api.uploadResume(formData);
      if (res.success && res.data) {
        setAnalysis(res.data.analysis);
        setResumeId(res.data.resumeId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze resume. Ensure file contains selectable text.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (analysis?.improvedSummary) {
      navigator.clipboard.writeText(analysis.improvedSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeId) return;
    if (window.confirm('Delete this uploaded resume and its ATS analysis history?')) {
      try {
        await api.deleteResume(resumeId);
        setAnalysis(null);
        setResumeId(null);
        setFile(null);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Transparent 0-100 Heuristic ATS Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          AI-Powered ATS Resume Analyzer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Scan your resume against Indian tech hiring standards. Discover missing skills, fix formatting risks, and view AI-optimized bullet points.
        </p>
      </div>

      {/* Upload Box */}
      <div className="card-premium p-6 lg:p-8 bg-white border-slate-200 shadow-subtle">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="select-field"
              >
                <option value="Frontend / React Developer">Frontend / React Developer</option>
                <option value="Backend / Node / Python Developer">Backend / Node / Python Developer</option>
                <option value="Full Stack Software Engineer">Full Stack Software Engineer</option>
                <option value="Data Analytics / BI Engineer">Data Analytics / Power BI</option>
                <option value="Java Developer">Java Spring Boot Developer</option>
                <option value="Machine Learning / AI Engineer">Machine Learning / AI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Optional Target Job Description (Paste Text)
              </label>
              <input
                type="text"
                value={targetJobDesc}
                onChange={(e) => setTargetJobDesc(e.target.value)}
                placeholder="Paste specific job description for tailored keyword matching..."
                className="input-field"
              />
            </div>
          </div>

          {/* Drag & Drop File Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
              file
                ? 'border-brand-500 bg-brand-50/30'
                : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-upload" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                {file ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to select or drag and drop your resume'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, DOCX (Max 5MB). Scanned image PDFs are automatically identified.
                </p>
              </div>

              {file && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 border border-brand-200">
                  Ready: {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Privacy Guaranteed: Your resume is processed securely in memory and never shared.</span>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="btn-primary text-sm px-6 py-2.5 shadow-md flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning ATS Criteria...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Resume Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Dashboard */}
      {analysis && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Analysis Results for: <span className="text-brand-600">{analysis.targetRole}</span>
            </h2>

            {resumeId && (
              <button
                onClick={handleDeleteResume}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Resume & Data</span>
              </button>
            )}
          </div>

          {/* Top Score Gauge + Section breakdown */}
          <ATSScoreGauge
            score={analysis.overallScore}
            sectionScores={analysis.sectionScores}
          />

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3>Matched Skills Detected ({analysis.matchedSkills.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                These keywords align with recruiter search queries for {analysis.targetRole}.
              </p>
            </div>

            {/* Missing Keywords */}
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3>Recommended Missing Keywords ({analysis.missingSkills.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Adding relevant projects or coursework covering these keywords will boost your ATS match score.
              </p>
            </div>
          </div>

          {/* Formatting & Parsing Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="card-premium p-6 border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3>Formatting & Parsing Notices ({analysis.warnings.length})</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
                {analysis.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-premium p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Resume Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-premium p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Prioritized Action Items
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Resume Improvement Section */}
          <div className="card-premium p-6 lg:p-8 bg-gradient-to-br from-white via-brand-50/20 to-indigo-50/20 border-brand-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="badge-brand">AI Content Assistant</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Optimized Professional Summary Suggestion
                </h3>
              </div>
              <button
                onClick={handleCopySummary}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>

            <p className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              "{analysis.improvedSummary}"
            </p>

            {/* Improved STAR Bullet Points */}
            {analysis.improvedBullets.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Impact-Driven Bullet Rewrites (Google X-Y-Z Formula):
                </h4>
                <div className="space-y-2">
                  {analysis.improvedBullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/recommendations"
                className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5"
              >
                <span>View Job Recommendations for Extracted Skills</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/mock-interview"
                className="btn-secondary text-xs px-4 py-2 flex items-center space-x-1.5"
              >
                <span>Practice Technical Mock Interview</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
