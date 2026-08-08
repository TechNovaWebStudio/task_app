import api from './api';

export const reportApi = {
  getReports: (params) => api.get('/reports', { params }),
};
