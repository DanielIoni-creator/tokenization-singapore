// mobile/src/services/moneroService.js
import api from './api';

class MoneroService {
  // ===== GET WALLET STATUS =====
  async getStatus() {
    try {
      const response = await api.get('/monero/status');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting Monero status:', error);
      throw error;
    }
  }

  // ===== GET WALLET BALANCE =====
  async getBalance() {
    try {
      const response = await api.get('/monero/balance');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting Monero balance:', error);
      throw error;
    }
  }

  // ===== GET WALLET ADDRESS =====
  async getAddress() {
    try {
      const response = await api.get('/monero/address');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting Monero address:', error);
      throw error;
    }
  }

  // ===== GENERATE SUBADDRESS =====
  async generateSubaddress(label) {
    try {
      const response = await api.post('/monero/generate-subaddress', { label });
      return response.data;
    } catch (error) {
      console.error('❌ Error generating subaddress:', error);
      throw error;
    }
  }

  // ===== SEND PAYMENT =====
  async sendPayment(address, amount, priority = 'normal') {
    try {
      const response = await api.post('/monero/send', {
        address,
        amount,
        priority
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error sending payment:', error);
      throw error;
    }
  }

  // ===== GET TRANSACTION HISTORY =====
  async getTransactions(limit = 50, offset = 0) {
    try {
      const response = await api.get('/monero/transactions', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      throw error;
    }
  }

  // ===== CHECK PAYMENT =====
  async checkPayment(subaddress, expectedAmount) {
    try {
      const response = await api.post('/monero/check-payment', {
        subaddress,
        expectedAmount
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error checking payment:', error);
      throw error;
    }
  }

  // ===== FORMAT XMR =====
  formatXMR(atomicUnits) {
    return (atomicUnits / 1e12).toFixed(4);
  }

  // ===== VALIDATE ADDRESS =====
  isValidAddress(address) {
    return /^[48][0-9A-Za-z]{94}$/.test(address);
  }
}

export default new MoneroService();
