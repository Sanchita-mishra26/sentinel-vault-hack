/// <reference types="vite/client" />
import axios, { AxiosError } from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      return Promise.reject(new Error("⚠️ DDoS Protection Active: Please wait before trying again."));
    }
    return Promise.reject(error);
  }
);

export const uploadFile = (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
  return axios.post(`${API_BASE}/api/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

export const getStats = () => {
  return api.get('/api/stats');
};

export const downloadFile = (fileId: string) => {
  window.open(`${API_BASE}/api/download/${fileId}`, '_blank');
};

export const deleteFile = (fileId: string) => {
  return api.delete(`/api/delete/${fileId}`);
};

export const chatWithAI = (message: string) => {
  return api.post('/api/chat', { message });
};

export const sabotageFile = (fileId: string) => {
  return api.post(`/api/sabotage/${fileId}`);
};

export const reportIntrusion = (email: string) => {
  return api.post('/api/auth/intrusion-alert', { email });
};

export const login = (data: { email: string; password: string }) => {
  return api.post('/api/auth/login', data);
};

export const analyzeIp = (data: { email: string; current_ip: string; last_ip: string }) => {
  return api.post('/api/chat/analyze-ip', data);
};

export default api;
