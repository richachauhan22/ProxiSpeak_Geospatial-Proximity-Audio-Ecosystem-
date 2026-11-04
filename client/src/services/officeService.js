import api from './api';
import { MOCK_OFFICES } from './mockDataService';
import {
  fetchOfficeLayout,
  saveOfficeLayout,
  resetOfficeLayout,
} from './officePersistenceService';

export const officeService = {
  async getOffices() {
    try {
      const response = await api.get('/api/offices');
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Graceful fallback to rich mock data
    }
    return MOCK_OFFICES;
  },

  async getOfficeById(officeId) {
    const offices = await this.getOffices();
    return offices.find((o) => o.id === officeId || o.slug === officeId) || offices[0];
  },

  getOfficeLayout: fetchOfficeLayout,
  saveOfficeLayout: saveOfficeLayout,
  resetOfficeLayout: resetOfficeLayout,
};

export default officeService;
