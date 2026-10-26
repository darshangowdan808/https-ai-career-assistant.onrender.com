import React, { useState } from 'react';
import { Job } from '../types';
import { X, ExternalLink, CheckCircle, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ApplicationTrackerModalProps {
  job: Job | null;
  onClose: () => void;
  onSuccess: (updatedStatus: string) => void;
}

export const ApplicationTrackerModal: React.FC<ApplicationTrackerModalProps> = ({
  job,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>(job?.applicationStatus || 'APPLIED');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Prompt login or just open link
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }

    setLoading(true);
    try {
      await api.trackApplication({
        jobId: job.id,
        status,
        notes,
      });
      setSubmitted(true);
      onSuccess(status);
      // Open official employer link
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(`Could not record application: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900">Apply & Track Application</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{job.title}</p>
            <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Application Tracker Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select-field"
            >
              <option value="INTERESTED">Interested / Shortlisted</option>
              <option value="APPLIED">Applied (Ready to submit)</option>
              <option value="ASSESSMENT">Online Assessment (OA)</option>
              <option value="INTERVIEW">Interview Round</option>
              <option value="OFFER">Job Offer Received</option>
              <option value="REJECTED">Archived / Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Personal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Applied via official portal, referral from LinkedIn, OA expected next week..."
              rows={3}
              className="input-field text-xs resize-none"
            />
          </div>

          <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-800 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" />
              Direct Employer Redirect:
            </p>
            <p className="text-brand-700">
              Clicking proceed will open {job.company}'s official application page and save this entry to your dashboard.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-3 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-4 py-2 flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <span>Proceed to Company Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
