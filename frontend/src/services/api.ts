import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = 'https://backend-production-a216.up.railway.app';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || '';
      if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: () => {
    const loginUrl = `${API_BASE_URL}/api/auth/secondme/login?frontend_url=${encodeURIComponent(window.location.origin)}`;
    window.location.href = loginUrl;
  },
  getMe: () => api.get('/auth/me'),
};

export const courtAPI = {
  create: (data: { name: string; description: string; user_id: string }) =>
    api.post('/courts', data),
  list: (userId: string) => api.get(`/courts?user_id=${userId}`),
  get: (id: string) => api.get(`/courts/${id}`),
  getMembers: (id: string) => api.get(`/courts/${id}/members`),
  getRanking: (id: string) => api.get(`/courts/${id}/ranking`),
  invite: (courtId: string, userId: string, department?: string) =>
    api.post(`/courts/${courtId}/invite`, { user_id: userId, department }),
  destroy: (courtId: string, userId: string) =>
    api.delete(`/courts/${courtId}`, { data: { user_id: userId } }),
  leave: (courtId: string, userId: string) =>
    api.post(`/courts/${courtId}/leave`, { user_id: userId }),
};

export const taskAPI = {
  create: (data: any) => api.post('/tasks', data),
  list: (courtId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (courtId) params.append('court_id', courtId);
    if (status) params.append('status', status);
    return api.get(`/tasks?${params.toString()}`);
  },
  get: (id: string) => api.get(`/tasks/${id}`),
  plan: (id: string, plannerId: string) =>
    api.post(`/tasks/${id}/plan`, { planner_id: plannerId }),
  review: (id: string, reviewerId: string, approved: boolean, comment?: string) =>
    api.post(`/tasks/${id}/review`, { reviewer_id: reviewerId, approved, comment }),
  dispatch: (id: string, dispatcherId: string) =>
    api.post(`/tasks/${id}/dispatch`, { dispatcher_id: dispatcherId }),
  execute: (id: string, executorId: string) =>
    api.post(`/tasks/${id}/execute`, { executor_id: executorId }),
  report: (id: string, reporterId: string) =>
    api.post(`/tasks/${id}/report`, { reporter_id: reporterId }),
  approve: (id: string, feedback: string) =>
    api.post(`/tasks/${id}/approve`, { feedback }),
  reject: (id: string, feedback: string) =>
    api.post(`/tasks/${id}/reject`, { feedback }),
  closeTask: (id: string) =>
    api.post(`/tasks/${id}/close`),
  approveTask: (id: string, feedback?: string) =>
    api.post(`/tasks/${id}/approve`, { feedback: feedback || '准奏' }),
  rejectTask: (id: string, reason: string) =>
    api.post(`/tasks/${id}/reject`, { feedback: reason }),
};

export const grudgeAPI = {
  getRecords: (userId: string, courtId: string) =>
    api.get(`/grudge/records?user_id=${userId}&court_id=${courtId}`),
  getRanking: (courtId: string) => api.get(`/grudge/ranking/${courtId}`),
};

export const fileAPI = {
  listOutputs: () => api.get('/files/outputs'),
  downloadOutput: (filename: string) => `${API_BASE_URL}/api/files/outputs/${filename}`,
  deleteOutput: (filename: string) => api.delete(`/files/outputs/${filename}`),
};

export const ttsAPI = {
  generate: (text: string, userId: string, emotion: string = 'fluent') =>
    api.post('/tts/generate', { text, userId, emotion }),
};

export const boredAPI = {
  generateMessage: (emperorId: string) =>
    api.post('/tasks/bored-message', { emperor_id: emperorId }),
};
