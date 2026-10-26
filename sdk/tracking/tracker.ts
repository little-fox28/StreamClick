import { IdentityManager } from './identity';
import { getDeviceContext } from './device';
import { EventTransport } from './transport';
import { EventType, TrackEventInput, TrackingEventPayload } from './types';

/**
 * TrackingService (Facade & Singleton):
 * Provides a unified API for the application, orchestrating Identity, Device Context, and Event Transport.
 */
export class TrackingService {
    private static instance: TrackingService;
    private transport = new EventTransport();
    private isInitialized = false;

    private readonly handleVisibilityChange: () => void;
    private readonly handleBeforeUnload: () => void;

    private constructor() {
        // Pre-initialize user identity and session
        IdentityManager.getUserId();
        IdentityManager.getSessionId();

        // Bind handlers once to preserve exact function references when removing listeners
        this.handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                this.transport.flushWithBeacon();
            }
        };

        this.handleBeforeUnload = () => {
            this.transport.flushWithBeacon();
        };
    }

    /**
     * Singleton accessor: Ensures a single global instance across the app.
     */
    public static getInstance(): TrackingService {
        if (!TrackingService.instance) {
            TrackingService.instance = new TrackingService();
        }
        return TrackingService.instance;
    }

    /**
     * Registers DOM listeners and starts the background flush timer.
     */
    public init(): void {
        if (this.isInitialized) {
            return;
        }

        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
            window.addEventListener('beforeunload', this.handleBeforeUnload);
            // Mobile Safari support on app switch/dismissal
            window.addEventListener('pagehide', this.handleBeforeUnload);
        }

        this.transport.startTimer();
        this.isInitialized = true;
    }

    /**
     * Unregisters DOM listeners, stops timer, and flushes remaining queued events via sendBeacon.
     */
    public cleanup(): void {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            window.removeEventListener('pagehide', this.handleBeforeUnload);
        }

        this.transport.stopTimer();
        this.transport.flushWithBeacon();
        this.isInitialized = false;
    }

    /**
     * Tracks a clickstream event (supports both object input and parameter list).
     */
    public trackEvent(input: TrackEventInput): void;
    public trackEvent(eventType: EventType, productId?: string, price?: number, amount?: number): void;
    public trackEvent(
        eventOrInput: EventType | TrackEventInput,
        productId?: string,
        price?: number,
        amount?: number
    ): void {
        try {
            const input: TrackEventInput = typeof eventOrInput === 'string'
                ? {
                    event_type: eventOrInput,
                    product_id: productId,
                    price: price,
                    amount: amount,
                }
                : eventOrInput;

            const storedId = IdentityManager.getUserId();
            const isAnonymous = storedId.startsWith('anon_');

            const payload: TrackingEventPayload = {
                event_id: IdentityManager.generateUUID(),
                timestamp: new Date().toISOString(),
                user_id: isAnonymous ? null : storedId,
                anonymous_id: storedId,
                session_id: IdentityManager.getSessionId(),
                event_type: input.event_type,
                page_url: input.page_url || (typeof window !== 'undefined' ? window.location.href : ''),
                referrer_url: input.referrer_url ?? (typeof document !== 'undefined' ? document.referrer : undefined),
                product_id: input.product_id,
                price: input.price,
                amount: input.amount,
                device: getDeviceContext(),
                properties: input.properties || {},
            };

            this.transport.enqueue(payload);
        } catch (e) {
            console.warn('[StreamClick SDK] Failed to track event:', e);
        }
    }

    // Identity convenience methods
    public setUserId(userId: string): void {
        IdentityManager.setUserId(userId);
    }

    public getUserId(): string {
        return IdentityManager.getUserId();
    }

    public getSessionId(): string {
        return IdentityManager.getSessionId();
    }
}

// Export singleton instance for app-wide usage
export const trackingService = TrackingService.getInstance();