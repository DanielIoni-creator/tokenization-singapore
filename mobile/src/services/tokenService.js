import api from './api';

const tokenService = {
  getTokens: (params) => {
    return api.get('/tokens', { params });
  },

  getTokenById: (id) => {
    return api.get(`/tokens/${id}`);
  },

  getTokenStats: (id) => {
    return api.get(`/tokens/${id}/stats`);
  },
};

export default tokenService;
