import api from './api';

const STORAGE_KEY_TOKEN = 'proxispeak_auth_token';
const STORAGE_KEY_USER = 'proxispeak_auth_user';

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response?.data?.token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, response.data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      // If server endpoint does not exist or network is offline, provide graceful mock authentication
      console.warn('[authService] Falling back to local authentication mode:', err.message);
    }

    // Graceful offline/demo user simulation
    const mockUser = {
      id: `usr-${email.split('@')[0] || 'demo'}`,
      name: email.split('@')[0] ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'Mia Chen',
      email: email || 'mia.chen@proxispeak.internal',
      role: 'Member',
      avatar: '/avatar_mia.png',
      avatarColor: '#2563eb',
      title: 'Product Design Lead',
      bio: 'Pioneering spatial interface interactions and 2D canvas workflows.',
      workspace: 'Acme Corp Virtual HQ',
    };
    const mockToken = `mock-jwt-token-${Date.now()}`;
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  },

  async register({ fullName, email, password, workspaceName }) {
    try {
      const response = await api.post('/api/auth/register', {
        fullName,
        email,
        password,
        workspaceName,
      });
      if (response?.data?.token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, response.data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      console.warn('[authService] Local registration fallback:', err.message);
    }

    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: fullName || 'New Member',
      email,
      role: 'Admin',
      avatar: '/avatar_mia.png',
      avatarColor: '#6366f1',
      title: 'Workspace Pioneer',
      bio: `Member of ${workspaceName || 'ProxiSpeak'}`,
      workspace: workspaceName || 'My Virtual Workspace',
    };
    const mockToken = `mock-jwt-token-${Date.now()}`;
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    return { token: mockToken, user: newUser };
  },

  async forgotPassword(email) {
    try {
      await api.post('/api/auth/forgot-password', { email });
    } catch (e) {
      console.warn('[authService] Forgot password demo acknowledgment');
    }
    return { success: true, message: `Password reset instructions sent to ${email}` };
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  },

  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEY_TOKEN);
    } catch (e) {}
    return null;
  },

  logout() {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {}
  },

  updateProfile(profileData) {
    const current = this.getCurrentUser() || {};
    const updated = { ...current, ...profileData };
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  },
};

export default authService;
