import api from './axios'

export const projectsApi = {
  getAll: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};
