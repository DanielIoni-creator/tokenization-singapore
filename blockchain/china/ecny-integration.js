// blockchain/china/ecny-integration.js
// Integrazione con e-CNY (Digital Yuan)

const ECNY_CONFIG = {
  type: 'CBDC',
  issuer: 'People Bank of China',
  network: 'permissioned',
  banks: [
    'Bank of China',
    'Industrial and Commercial Bank of China',
    'China Construction Bank',
    'Agricultural Bank of China'
  ],
  settlement: {
    currency: 'CNY',
    digital: true,
    realTime: true,
    crossBorder: false
  },
  api: {
    baseUrl: 'https://api.ecny.pbc.gov.cn',
    version: 'v1',
    authentication: 'PKI'
  }
};

// Tasso di conversione RMB -> USD
const CONVERSION_RATE = 0.14;
