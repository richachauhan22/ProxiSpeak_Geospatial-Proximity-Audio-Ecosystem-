import api from './api';
import { MOCK_NOTIFICATIONS } from './mockDataService';

export const notificationService = {
  async getNotifications() {
    try {
      const response = await api.get('/api/notifications');
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Fallback
    }
    return MOCK_NOTIFICATIONS;
  },
};

export default notificationService;
