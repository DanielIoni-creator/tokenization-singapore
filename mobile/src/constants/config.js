import { API_URL, WS_URL, ENABLE_BIOMETRIC, ENABLE_PUSH_NOTIFICATIONS, ENABLE_OFFLINE_MODE } from '@env';

export const CONFIG = {
  apiUrl: API_URL || 'http://localhost:3000/api',
  wsUrl: WS_URL || 'ws://localhost:3000',
  enableBiometric: ENABLE_BIOMETRIC === 'true',
  enablePushNotifications: ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableOfflineMode: ENABLE_OFFLINE_MODE === 'true',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
