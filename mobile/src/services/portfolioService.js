import api from './api';

const portfolioService = {
  getPortfolio: () => {
    return api.get('/portfolio');
  },

  getPerformance: () => {
    return api.get('/portfolio/performance');
  },

  getDividends: () => {
    return api.get('/portfolio/dividends');
  },
};

export default portfolioService;
