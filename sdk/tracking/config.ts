export const TRACKING_CONFIG = {
  API_ENDPOINT: import.meta.env.VITE_TRACKING_API_URL || 'http://localhost:8000/track',

  // Dual-Flush (Batching) mechanism
  BATCH_MAX_SIZE: 10,               
  FLUSH_INTERVAL_MS: 3000,

  // Identity & Session Management
  SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000, 

  // Storage Keys in Browser
  STORAGE_KEYS: {
    USER_ID: 'streamclick_user_id',
    SESSION_ID: 'streamclick_session_id',
    SESSION_LAST_ACTIVE: 'streamclick_session_last_active',
  },
} as const;

export type TrackingConfig = typeof TRACKING_CONFIG;
