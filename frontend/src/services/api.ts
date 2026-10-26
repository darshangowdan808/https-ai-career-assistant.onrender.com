const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, error: 'Network response was not JSON' }));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: An unexpected error occurred.`);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (payload: any) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Resumes
  uploadResume: (formData: FormData) => request('/resumes/upload', { method: 'POST', body: formData }),
  getLatestAnalysis: () => request('/resumes/latest'),
  deleteResume: (id: string) => request(`/resumes/${id}`, { method: 'DELETE' }),

  // Jobs
  getJobs: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs?${query}`);
  },
  getJobById: (id: string) => request(`/jobs/${id}`),
  toggleSaveJob: (jobId: string) => request('/jobs/save', { method: 'POST', body: JSON.stringify({ jobId }) }),
  trackApplication: (payload: { jobId: string; status: string; notes?: string }) =>
    request('/jobs/apply', { method: 'POST', body: JSON.stringify(payload) }),
  getSavedJobs: () => request('/jobs/saved'),
  getApplications: () => request('/jobs/applications'),
  syncJobs: () => request('/jobs/sync', { method: 'POST' }),

  // Recommendations
  getRecommendations: () => request('/recommendations'),

  // Interviews
  startInterview: (payload: any) => request('/interviews/start', { method: 'POST', body: JSON.stringify(payload) }),
  getInterviewSession: (id: string) => request(`/interviews/${id}`),
  submitRound: (id: string, payload: any) => request(`/interviews/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  retryRound: (id: string, roundNumber: number) => request(`/interviews/${id}/retry`, { method: 'POST', body: JSON.stringify({ roundNumber }) }),
  getUserInterviews: () => request('/interviews/my'),

  // Learning
  getLearningPlan: (role?: string) => request(`/learning${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  updateProgress: (payload: any) => request('/learning/progress', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  triggerJobSync: () => request('/admin/sync-jobs', { method: 'POST' }),
  updateAdminSetting: (payload: any) => request('/admin/settings', { method: 'POST', body: JSON.stringify(payload) }),
};
