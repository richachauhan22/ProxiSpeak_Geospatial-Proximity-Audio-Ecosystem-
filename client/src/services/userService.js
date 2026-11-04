import api from './api';
import { MOCK_TEAM_MEMBERS } from './mockDataService';

export const userService = {
  async getTeamMembers() {
    try {
      const response = await api.get('/api/users');
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      // Graceful fallback to mock data
    }
    return MOCK_TEAM_MEMBERS;
  },

  async getUserById(userId) {
    const members = await this.getTeamMembers();
    return members.find((m) => m.id === userId) || null;
  },
};

export default userService;
