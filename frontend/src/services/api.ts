import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// 开发环境使用代理，生产环境使用环境变量
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只在真正的认证失败时才退出登录
    // 网络错误或其他错误不应该导致退出登录
    if (error.response?.status === 401) {
      console.error('认证失败 (401):', error.config?.url);
      console.error('错误详情:', error.response?.data);
      
      // 只有在明确的认证错误时才退出登录
      // 避免因为网络问题或其他临时错误导致退出
      const errorMessage = error.response?.data?.error || '';
      if (errorMessage.includes('token') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        console.warn('Token 无效，退出登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API 方法
export const authAPI = {
  login: () => {
    // 开发环境使用代理，生产环境使用完整 URL
    const loginUrl = import.meta.env.PROD 
      ? `${import.meta.env.VITE_API_URL}/api/auth/secondme/login`
      : '/api/auth/secondme/login';
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
  downloadOutput: (filename: string) => `/api/files/outputs/${filename}`,
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
