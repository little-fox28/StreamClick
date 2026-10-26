import { TRACKING_CONFIG } from './config';

export class IdentityManager {
    /**
     * Generates a native standard UUID v4 using Web Crypto API
     * (includes fallback for older browsers or non-secure HTTP contexts).
     */
    public static generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Retrieves or generates a persistent UserId stored in localStorage.
     */
    public static getUserId(): string {
        try {
            let userId = localStorage.getItem(TRACKING_CONFIG.STORAGE_KEYS.USER_ID);
            if (!userId) {
                userId = `anon_${this.generateUUID()}`;
                localStorage.setItem(TRACKING_CONFIG.STORAGE_KEYS.USER_ID, userId);
            }
            return userId;
        } catch {
            return 'anonymous_fallback';
        }
    }

    /**
     * Updates UserId when a user successfully authenticates.
     */
    public static setUserId(userId: string): void {
        try {
            localStorage.setItem(TRACKING_CONFIG.STORAGE_KEYS.USER_ID, userId);
        } catch {
            // Silent failure
        }
    }

    /**
     * Manages SessionId with a 30-minute idle TTL mechanism (Sliding Window).
     */
    public static getSessionId(): string {
        const now = Date.now();
        const { SESSION_ID, SESSION_LAST_ACTIVE } = TRACKING_CONFIG.STORAGE_KEYS;

        try {
            const storedSessionId = localStorage.getItem(SESSION_ID);
            const lastActiveStr = localStorage.getItem(SESSION_LAST_ACTIVE);

            if (storedSessionId && lastActiveStr) {
                const lastActiveTime = parseInt(lastActiveStr, 10);
                const idleTime = now - lastActiveTime;

                // Session remains valid if idle time is under 30 minutes
                if (idleTime < TRACKING_CONFIG.SESSION_IDLE_TIMEOUT_MS) {
                    localStorage.setItem(SESSION_LAST_ACTIVE, now.toString());
                    return storedSessionId;
                }
            }

            // Create new session if none exists or previous session expired
            const newSessionId = `sess_${this.generateUUID().slice(0, 12)}`;
            localStorage.setItem(SESSION_ID, newSessionId);
            localStorage.setItem(SESSION_LAST_ACTIVE, now.toString());
            return newSessionId;
        } catch {
            return `sess_${this.generateUUID().slice(0, 12)}`;
        }
    }
}
