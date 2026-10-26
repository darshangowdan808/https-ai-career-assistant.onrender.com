import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  IndianRupee,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Globe,
  Sparkles,
  Building,
  GraduationCap,
  TrendingUp,
  X,
} from 'lucide-react';
import { Job } from '../types';
import { api } from '../services/api';
import { JobCard } from '../components/JobCard';
import { JobDetailModal } from '../components/JobDetailModal';
import { ApplicationTrackerModal } from '../components/ApplicationTrackerModal';
import { useAuth } from '../context/AuthContext';

export const JobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search Bar States
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || 'ALL');

  // Additional Filter States
  const [workMode, setWorkMode] = useState(searchParams.get('workMode') || 'ALL');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || 'ALL');
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '');
  const [provider, setProvider] = useState(searchParams.get('provider') || 'ALL');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  // Sync state with URL params
  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '15',
      };
      if (q) params.q = q;
      if (location && location !== 'ALL') params.location = location;
      if (experience !== 'ALL') params.experience = experience;
      if (workMode !== 'ALL') params.workMode = workMode;
      if (employmentType !== 'ALL') params.employmentType = employmentType;
      if (minSalary) params.minSalary = minSalary;
      if (provider !== 'ALL') params.provider = provider;
      if (sort) params.sort = sort;

      const res = await api.getJobs(params);
      if (res.success) {
        setJobs(res.jobs);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (customParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    const queryVal = customParams?.q !== undefined ? customParams.q : q;
    const locVal = customParams?.location !== undefined ? customParams.location : location;
    const expVal = customParams?.experience !== undefined ? customParams.experience : experience;
    const modeVal = customParams?.workMode !== undefined ? customParams.workMode : workMode;
    const provVal = customParams?.provider !== undefined ? customParams.provider : provider;
    const salVal = customParams?.minSalary !== undefined ? customParams.minSalary : minSalary;
    const sortVal = customParams?.sort !== undefined ? customParams.sort : sort;

    if (queryVal) params.set('q', queryVal);
    if (locVal && locVal !== 'ALL') params.set('location', locVal);
    if (expVal && expVal !== 'ALL') params.set('experience', expVal);
    if (modeVal && modeVal !== 'ALL') params.set('workMode', modeVal);
    if (provVal && provVal !== 'ALL') params.set('provider', provVal);
    if (salVal) params.set('minSalary', salVal);
    if (sortVal) params.set('sort', sortVal);

    params.set('page', '1');
    setPage(1);
    setSearchParams(params);
  };

  const resetFilters = () => {
    setQ('');
    setLocation('');
    setExperience('ALL');
    setWorkMode('ALL');
    setEmploymentType('ALL');
    setMinSalary('');
    setProvider('ALL');
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  const handleSyncLiveJobs = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await api.syncJobs();
      if (res.success) {
        setSyncNotice(`Synced live vacancies! Sourced ${res.result?.added || 0} fresh openings in Indian tech hubs.`);
        await fetchJobs();
      }
    } catch (err: any) {
      setSyncNotice('Unable to refresh live feeds. Displaying cached verified openings.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.toggleSaveJob(jobId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, isSaved: res.isSaved } : j))
      );
    } catch (err: any) {
      alert(`Error saving job: ${err.message}`);
    }
  };

  // Indian Tech States and Hubs
  const INDIAN_HUBS = [
    { city: 'Bengaluru', label: 'Bengaluru, Karnataka' },
    { city: 'Pune', label: 'Pune, Maharashtra' },
    { city: 'Hyderabad', label: 'Hyderabad, Telangana' },
    { city: 'Gurugram', label: 'Delhi NCR (Gurugram / Noida)' },
    { city: 'Chennai', label: 'Chennai, Tamil Nadu' },
    { city: 'Mumbai', label: 'Mumbai, Maharashtra' },
    { city: 'Kolkata', label: 'Kolkata, West Bengal' },
    { city: 'Kochi', label: 'Kochi, Kerala' },
    { city: 'Ahmedabad', label: 'Ahmedabad, Gujarat' },
    { city: 'Remote', label: 'Remote (Pan-India)' },
  ];

  const hasActiveFilters = Boolean(
    q || (location && location !== 'ALL') || experience !== 'ALL' || workMode !== 'ALL' || minSalary || provider !== 'ALL'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. NAUKRI-STYLE SEARCH BANNER                                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl space-y-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            <span>India’s Verified Tech Job Network</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Find Your Next Tech Job in India
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Verified opportunities in Bengaluru, Pune, Hyderabad, Delhi NCR, and premier Indian tech hubs with disclosed CTC in LPA.
          </p>
        </div>

        {/* Consolidated 3-Input Search Bar (Exact Naukri Layout) */}
        <div className="bg-white rounded-xl shadow-2xl p-2 md:p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 border border-slate-200">
          {/* Input 1: Designation / Skills / Company */}
          <div className="flex-1 flex items-center px-3 py-1.5 border-b lg:border-b-0 lg:border-r border-slate-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Enter skills / designations / companies (e.g. React, Java, Swiggy)"
              className="w-full text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
            />
          </div>

          {/* Input 2: Experience Selector */}
          <div className="w-full lg:w-48 flex items-center px-3 py-1.5 border-b lg:border-b-0 lg:border-r border-slate-200">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
            <select
              value={experience}
              onChange={(e) => {
                setExperience(e.target.value);
              }}
              className="w-full text-xs md:text-sm text-slate-800 bg-transparent focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">Select experience</option>
              <option value="FRESHER">Fresher (&lt; 1 yr)</option>
              <option value="1-3">1 - 3 Years</option>
              <option value="3-5">3 - 5 Years</option>
              <option value="5+">5+ Years</option>
            </select>
          </div>

          {/* Input 3: Location / Tech Hub Selector */}
          <div className="w-full lg:w-60 flex items-center px-3 py-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
              }}
              className="w-full text-xs md:text-sm text-slate-800 bg-transparent focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="">Select location / city</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Pune">Pune, Maharashtra</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
              <option value="Gurugram">Gurugram / Noida (NCR)</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Kolkata">Kolkata, West Bengal</option>
              <option value="Kochi">Kochi, Kerala</option>
              <option value="Ahmedabad">Ahmedabad / GIFT City</option>
              <option value="Remote">Remote (Pan-India)</option>
            </select>
          </div>

          {/* Naukri Blue Search Button */}
          <button
            onClick={() => applyFilters()}
            className="w-full lg:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm transition-colors shadow-md shrink-0 flex items-center justify-center space-x-1.5"
          >
            <span>Search</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Naukri Trending Searches Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            Trending Searches:
          </span>
          {[
            { label: 'Fresher Tech Jobs', exp: 'FRESHER', loc: '' },
            { label: 'Remote (Pan-India)', exp: 'ALL', loc: 'Remote' },
            { label: 'React Developer', q: 'React', exp: 'ALL' },
            { label: 'Java Spring Boot', q: 'Java', exp: 'ALL' },
            { label: 'Data Analyst', q: 'Data Analyst', exp: 'ALL' },
            { label: 'Bengaluru Hub', exp: 'ALL', loc: 'Bengaluru' },
            { label: 'Hyderabad Hub', exp: 'ALL', loc: 'Hyderabad' },
            { label: 'Pune Hub', exp: 'ALL', loc: 'Pune' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.q) setQ(item.q);
                if (item.loc) setLocation(item.loc);
                if (item.exp) setExperience(item.exp);
                applyFilters({
                  q: item.q || '',
                  location: item.loc || '',
                  experience: item.exp || 'ALL',
                });
              }}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium border border-white/10 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN LAYOUT: NAUKRI SIDEBAR FILTERS + JOB LISTINGS                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: Naukri Facet Filters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
          {/* Header & Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>All Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100 text-[11px]">
              {q && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  Keyword: {q}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setQ(''); applyFilters({ q: '' }); }} />
                </span>
              )}
              {location && location !== 'ALL' && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  {location}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setLocation(''); applyFilters({ location: '' }); }} />
                </span>
              )}
              {experience !== 'ALL' && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  Exp: {experience}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setExperience('ALL'); applyFilters({ experience: 'ALL' }); }} />
                </span>
              )}
              {workMode !== 'ALL' && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  Mode: {workMode}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setWorkMode('ALL'); applyFilters({ workMode: 'ALL' }); }} />
                </span>
              )}
              {minSalary && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  ₹{minSalary}+ LPA
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setMinSalary(''); applyFilters({ minSalary: '' }); }} />
                </span>
              )}
            </div>
          )}

          {/* 1. Work Mode (Naukri Facet) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Work Mode
            </label>
            <div className="space-y-1.5 text-xs text-slate-600">
              {[
                { id: 'ALL', label: 'All Modes' },
                { id: 'HYBRID', label: 'Hybrid' },
                { id: 'REMOTE', label: 'Remote (Work from Anywhere)' },
                { id: 'ON_SITE', label: 'Work from Office' },
              ].map((m) => (
                <label key={m.id} className="flex items-center space-x-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="workModeRadio"
                    checked={workMode === m.id}
                    onChange={() => {
                      setWorkMode(m.id);
                      applyFilters({ workMode: m.id });
                    }}
                    className="text-blue-600 focus:ring-blue-500 rounded-sm"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Indian Tech State & Location (Naukri Facet) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tech State &amp; City
            </label>
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                applyFilters({ location: e.target.value });
              }}
              className="select-field text-xs font-medium"
            >
              <option value="">All Indian Tech States</option>
              {INDIAN_HUBS.map((h) => (
                <option key={h.city} value={h.city}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Experience (Naukri Facet) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Experience Level
            </label>
            <select
              value={experience}
              onChange={(e) => {
                setExperience(e.target.value);
                applyFilters({ experience: e.target.value });
              }}
              className="select-field text-xs"
            >
              <option value="ALL">Any Experience</option>
              <option value="FRESHER">Fresher / Graduate (&lt; 1 Yr)</option>
              <option value="1-3">1 - 3 Years (Junior / Mid)</option>
              <option value="3-5">3 - 5 Years (Senior)</option>
              <option value="5+">5+ Years (Lead / Principal)</option>
            </select>
          </div>

          {/* 4. Salary in Lakhs Per Annum (Naukri Facet) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Salary (LPA)
            </label>
            <select
              value={minSalary}
              onChange={(e) => {
                setMinSalary(e.target.value);
                applyFilters({ minSalary: e.target.value });
              }}
              className="select-field text-xs"
            >
              <option value="">Any CTC</option>
              <option value="3">₹ 3+ Lakhs</option>
              <option value="6">₹ 6+ Lakhs</option>
              <option value="10">₹ 10+ Lakhs</option>
              <option value="15">₹ 15+ Lakhs</option>
              <option value="20">₹ 20+ Lakhs</option>
              <option value="30">₹ 30+ Lakhs</option>
            </select>
          </div>

          {/* 5. Source Transparency Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Job Source</span>
            </label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                applyFilters({ provider: e.target.value });
              }}
              className="select-field text-xs font-medium"
            >
              <option value="ALL">All Verified Indian Feeds</option>
              <option value="VERIFIED_PARTNER">Top Indian Tech Employers (Direct)</option>
              <option value="REMOTIVE">Remotive Live (Pan-India Remote)</option>
              <option value="JOBICY">Jobicy Live (Developer Feed)</option>
              <option value="ARBEITNOW">Arbeitnow Live (Tech)</option>
            </select>
          </div>

          {/* Naukri Verified Notice */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1 text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              100% India-Focused
            </span>
            <p className="leading-relaxed">
              Every vacancy is strictly validated for Indian tech hubs and remote eligibility. No foreign vacancies.
            </p>
          </div>
        </div>

        {/* Right Section: Naukri Job Listings */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Bar: Count, Sort, and Sync Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">
              Showing <span className="text-blue-600 font-bold">{total}</span> Tech Job Vacancies in India
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSyncLiveJobs}
                disabled={syncing}
                title="Fetch real-time updates from Indian tech career portals"
                className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : 'text-blue-500'}`} />
                <span>{syncing ? 'Syncing Feeds...' : 'Sync Live Openings'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    applyFilters({ sort: e.target.value });
                  }}
                  className="select-field py-1 px-2 text-xs w-auto font-medium"
                >
                  <option value="newest">Recently Posted</option>
                  <option value="salary">Highest Salary (LPA)</option>
                  <option value="oldest">Earliest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sync notification banner */}
          {syncNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Job Listings Grid / Stack (Naukri style stacked cards) */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-10 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Matching Vacancies Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No vacancies matched your selected criteria in Indian tech states. Try broadening your location or resetting filters.
              </p>
              <button
                onClick={resetFilters}
                className="btn-primary text-xs px-4 py-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewDetails={(j) => setSelectedJob(j)}
                  onToggleSave={handleToggleSave}
                  onApply={(j) => setApplyJob(j)}
                />
              ))}
            </div>
          )}

          {/* Pagination (Naukri style) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(newPage));
                  setSearchParams(p);
                }}
                disabled={page <= 1}
                className="btn-secondary px-3 py-1.5 flex items-center space-x-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-slate-600 font-medium">
                Page <strong className="text-slate-900">{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, page + 1);
                  setPage(newPage);
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(newPage));
                  setSearchParams(p);
                }}
                disabled={page >= totalPages}
                className="btn-secondary px-3 py-1.5 flex items-center space-x-1 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onToggleSave={handleToggleSave}
          onApply={(j) => {
            setSelectedJob(null);
            setApplyJob(j);
          }}
        />
      )}

      {applyJob && (
        <ApplicationTrackerModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onSuccess={() => {
            setApplyJob(null);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
};
