import api from './axios'

export const reportsApi = {
  getAll: (params) => api.get('/reports/', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports/', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  submit: (id) => api.patch(`/reports/${id}/submit`),
  getAnalytics: () => api.get('/reports/analytics')
};
