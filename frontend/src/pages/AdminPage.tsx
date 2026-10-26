import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  FileCheck2,
  BrainCircuit,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Settings,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const [thresholdInput, setThresholdInput] = useState('70');
  const [updatingSetting, setUpdatingSetting] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        const thresh = statsRes.stats.settings?.find((s: any) => s.key === 'passing_threshold');
        if (thresh) setThresholdInput(thresh.value);
      }
      if (usersRes.success) setUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncJobs = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await api.triggerJobSync();
      if (res.success && res.result) {
        setSyncMessage(`Synchronization complete: ${res.result.added} new jobs added, ${res.result.updated} updated.`);
        await loadAdminData();
      }
    } catch (err: any) {
      setSyncMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSetting(true);
    try {
      await api.updateAdminSetting({
        key: 'passing_threshold',
        value: thresholdInput,
        description: 'Mock interview passing score threshold percentage',
      });
      alert('Passing threshold updated successfully.');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingSetting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-xs text-slate-500">
          This area is restricted to authorized platform administrators. Please log in with the administrator credentials.
        </p>
        <Link to="/login" className="btn-primary text-xs px-5 py-2 inline-block">
          Admin Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2 border border-amber-200">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Platform Administration & Controls</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor verified job provider sync, manage interview passing thresholds, and view candidate activity.
          </p>
        </div>

        <button
          onClick={handleSyncJobs}
          disabled={syncing}
          className="btn-primary text-xs px-4 py-2 flex items-center space-x-2 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Feeds...' : 'Sync Provider Jobs Now'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card-premium p-4">
            <p className="text-xs text-slate-500 font-medium">Registered Users</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-500 font-medium">Jobs Synchronized</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalJobs}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-500 font-medium">Resumes Scanned</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalResumes}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-500 font-medium">Mock Interviews</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalInterviews}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-500 font-medium">Applications Tracked</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalApplications}</p>
          </div>
        </div>
      )}

      {/* AI & Job Provider Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Providers Status */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Job Provider Adapters & Health
          </h3>
          <div className="divide-y divide-slate-100">
            {stats?.jobProviders?.map((prov: any) => (
              <div key={prov.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{prov.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    Code: {prov.code} • Last Sync: {prov.lastSyncAt ? new Date(prov.lastSyncAt).toLocaleString() : 'Pending'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  prov.syncStatus === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : prov.syncStatus === 'RUNNING'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {prov.syncStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Settings & Thresholds */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Platform Configuration
          </h3>

          <form onSubmit={handleUpdateThreshold} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mock Interview Passing Score Threshold (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="40"
                  max="95"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="input-field max-w-[120px]"
                />
                <button
                  type="submit"
                  disabled={updatingSetting}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Save Threshold
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Default: 70%. Candidates scoring below this threshold are required to retry before unlocking the next interview round.
              </p>
            </div>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-semibold text-slate-700">AI Service Engine Status:</span>
            <p className="text-slate-600">{stats?.aiEngine}</p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="card-premium p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Registered Candidates ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Resumes</th>
                <th className="py-2.5 px-3">Interviews</th>
                <th className="py-2.5 px-3">Applications</th>
                <th className="py-2.5 px-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{u._count?.resumes || 0}</td>
                  <td className="py-2.5 px-3 font-medium">{u._count?.interviews || 0}</td>
                  <td className="py-2.5 px-3 font-medium">{u._count?.applications || 0}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
