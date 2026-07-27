import api from './api';

const authService = {
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  register: (data) => {
    return api.post('/auth/register', data);
  },

  getProfile: () => {
    return api.get('/auth/profile');
  },

  updateProfile: (data) => {
    return api.put('/auth/profile', data);
  },

  logout: () => {
    // Client-side logout only
    return Promise.resolve();
  },
};

export default authService;
