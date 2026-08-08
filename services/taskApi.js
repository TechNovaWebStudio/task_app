import api from './api';

export const taskApi = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  completeTask: (id) => api.patch(`/tasks/${id}/complete`),
  pendingTask: (id) => api.patch(`/tasks/${id}/pending`),
  archiveTask: (id) => api.patch(`/tasks/${id}/archive`),
  bulkDelete: (ids) => api.post('/tasks/bulk-delete', { ids }),
  bulkComplete: (ids) => api.post('/tasks/bulk-complete', { ids }),
};
