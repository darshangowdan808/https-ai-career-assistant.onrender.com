import React, { useState, useEffect } from 'react';
import { X, Save, User, GraduationCap, Briefcase, MapPin, IndianRupee, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [currentRole, setCurrentRole] = useState('');
  const [expectedSalaryLpa, setExpectedSalaryLpa] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [rolesInput, setRolesInput] = useState('');
  const [locationsInput, setLocationsInput] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      if (user.profile) {
        const p = user.profile;
        setHeadline(p.headline || '');
        setBio(p.bio || '');
        setEducation(p.education || '');
        setGraduationYear(p.graduationYear ? String(p.graduationYear) : '');
        setExperienceYears(String(p.experienceYears || 0));
        setCurrentRole(p.currentRole || '');
        setExpectedSalaryLpa(p.expectedSalaryLpa ? String(p.expectedSalaryLpa) : '');
        setSkillsInput(Array.isArray(p.skills) ? p.skills.join(', ') : '');
        setRolesInput(Array.isArray(p.preferredRoles) ? p.preferredRoles.join(', ') : '');
        setLocationsInput(Array.isArray(p.preferredLocations) ? p.preferredLocations.join(', ') : '');
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const preferredRoles = rolesInput.split(',').map((s) => s.trim()).filter(Boolean);
      const preferredLocations = locationsInput.split(',').map((s) => s.trim()).filter(Boolean);

      await api.updateProfile({
        name,
        phone,
        headline,
        bio,
        education,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        experienceYears: parseFloat(experienceYears) || 0,
        currentRole,
        expectedSalaryLpa: expectedSalaryLpa ? parseFloat(expectedSalaryLpa) : null,
        skills,
        preferredRoles,
        preferredLocations,
      });

      await refreshUser();
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900">Edit Candidate Profile</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Final Year CS Undergrad | React & Full Stack Developer"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Highest Education / Degree
              </label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="e.g. 2026"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Experience in Years (0 for Freshers/Students)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Expected CTC (in LPA)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={expectedSalaryLpa}
                onChange={(e) => setExpectedSalaryLpa(e.target.value)}
                placeholder="e.g. 10.5"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Technical & Professional Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, Node.js, SQL, Python, Git..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Target Job Roles (comma-separated)
            </label>
            <input
              type="text"
              value={rolesInput}
              onChange={(e) => setRolesInput(e.target.value)}
              placeholder="Frontend Developer, Software Engineer, Full Stack Developer..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Preferred Locations in India (comma-separated)
            </label>
            <input
              type="text"
              value={locationsInput}
              onChange={(e) => setLocationsInput(e.target.value)}
              placeholder="Bengaluru, Pune, Hyderabad, Remote..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">About Me / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your career focus and what kind of projects excite you..."
              className="input-field resize-none text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-5 py-2 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
