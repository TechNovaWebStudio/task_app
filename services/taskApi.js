import api from './api';

export const taskApi = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getSeries: (seriesId) => api.get(`/tasks/series/${seriesId}`),
  deleteSeries: (seriesId) => api.delete(`/tasks/series/${seriesId}`),
  completeTask: (id, data) => api.patch(`/tasks/${id}/complete`, data),
  pendingTask: (id, data) => api.patch(`/tasks/${id}/pending`, data),
  archiveTask: (id) => api.patch(`/tasks/${id}/archive`),
  bulkDelete: (ids) => api.post('/tasks/bulk-delete', { ids }),
  bulkComplete: (ids) => api.post('/tasks/bulk-complete', { ids }),
};
