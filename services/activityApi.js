import api from './api';

// Activity logs come from the dashboard endpoint (recentActivity)
// and from a dedicated query using task history
export const activityApi = {
  getActivity: (params) => api.get('/dashboard', { params }),
};
