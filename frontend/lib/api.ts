import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

export const assignmentsApi = {
  getAll: () => api.get('/assignments'),
  getById: (id: string) => api.get(`/assignments/${id}`),
  getPaper: (id: string) => api.get(`/assignments/${id}/paper`),
  create: (formData: FormData) =>
    api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  getJobStatus: (jobId: string) => api.get(`/assignments/job/${jobId}/status`),
};

export const questionsApi = {
  getById: (id: string) => api.get(`/questions/${id}`),
  regenerate: (id: string) => api.post(`/questions/${id}/regenerate`),
};
