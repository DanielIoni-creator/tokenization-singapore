import api from './api';

const orderService = {
  createOrder: (data) => {
    return api.post('/orders', data);
  },

  getOrders: () => {
    return api.get('/orders');
  },

  getOrderById: (id) => {
    return api.get(`/orders/${id}`);
  },

  cancelOrder: (id) => {
    return api.put(`/orders/${id}/cancel`);
  },

  confirmPayment: (id, data) => {
    return api.put(`/orders/${id}/confirm-payment`, data);
  },

  completeOrder: (id) => {
    return api.put(`/orders/${id}/complete`);
  },
};

export default orderService;
