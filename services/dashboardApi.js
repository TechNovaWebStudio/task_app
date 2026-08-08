import api from './api';

export const dashboardApi = {
  getDashboard: () => api.get('/dashboard'),
};
