import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldCheck, Heart, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">AI Career Assistant</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's smart career ecosystem combining verified job discovery, transparent ATS resume scoring, and realistic 4-round mock interviews for students, freshers, and professionals.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real Job Feeds • 100% Free for Job Seekers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Core Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Verified Job Discovery
                </Link>
              </li>
              <li>
                <Link to="/resume-analyzer" className="hover:text-white transition-colors">
                  ATS Resume Analyzer
                </Link>
              </li>
              <li>
                <Link to="/mock-interview" className="hover:text-white transition-colors">
                  4-Round AI Mock Interview
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-white transition-colors">
                  Personalized Job Matches
                </Link>
              </li>
              <li>
                <Link to="/learning-plan" className="hover:text-white transition-colors">
                  Skill Roadmaps & Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Major Tech Hubs */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Top Indian Hubs</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Bengaluru (Silicon Plateau)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Hyderabad (Cyberabad)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Pune (Tech & Auto Corridor)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Delhi NCR (Gurugram / Noida)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Remote / Pan-India Opportunities</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Disclaimers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Integrity & Policies</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              We never fabricate vacancies or promise guaranteed placements. Job listings are synchronized from authorized partner feeds and public feeds with verified apply links.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-slate-300 font-medium">Privacy Protection:</span> Resume text is processed confidentially and never sold.
              </li>
              <li>
                <span className="text-slate-300 font-medium">ATS Transparency:</span> Scores represent heuristic guidelines, not proprietary employer ATS algorithms.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Career Assistant. Built for Indian job seekers & engineering graduates.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span>Security First</span>
            <span>•</span>
            <span>Zero Spam</span>
            <span>•</span>
            <span>Accessible Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
