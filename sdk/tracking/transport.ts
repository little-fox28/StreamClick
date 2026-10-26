import { TRACKING_CONFIG } from './config';
import { TrackingEventPayload } from './types';

/**
 * Manages the in-memory event queue, dual-flush mechanism, and network transport (Fetch & sendBeacon).
 */
export class EventTransport {
    private eventQueue: TrackingEventPayload[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;

    /**
     * Enqueues an event; automatically triggers flush if BATCH_MAX_SIZE threshold is reached.
     */
    public enqueue(event: TrackingEventPayload): void {
        this.eventQueue.push(event);

        if (this.eventQueue.length >= TRACKING_CONFIG.BATCH_MAX_SIZE) {
            void this.flushQueue();
        }
    }

    /**
     * Periodically flushes queue via fetch() with race-condition safety.
     */
    public async flushQueue(): Promise<void> {
        if (this.eventQueue.length === 0) {
            return;
        }

        // Atomically snapshot and empty queue immediately before awaiting network I/O
        const batchToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            const response = await fetch(TRACKING_CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batchToSend),
                keepalive: true,
            });

            if (!response.ok) {
                console.warn(
                    `[StreamClick SDK] Ingestion API responded with status ${response.status}: ${response.statusText}`
                );
            }
        } catch (e) {
            console.warn('[StreamClick SDK] Network error while flushing events:', e);
        }
    }

    /**
     * Emergency flush triggered when the user leaves or closes the tab via Beacon API.
     */
    public flushWithBeacon(): void {
        if (this.eventQueue.length === 0) {
            return;
        }

        const batchToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([JSON.stringify(batchToSend)], {
                    type: 'application/json',
                });

                const isQueued = navigator.sendBeacon(TRACKING_CONFIG.API_ENDPOINT, blob);
                if (!isQueued) {
                    console.warn('[StreamClick SDK] sendBeacon queue is full');
                }
            } else {
                // Fallback when sendBeacon is unsupported
                void fetch(TRACKING_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batchToSend),
                    keepalive: true,
                });
            }
        } catch (e) {
            console.warn('[StreamClick SDK] Emergency flush with beacon failed:', e);
        }
    }

    /**
     * Starts background timer to periodically flush events based on FLUSH_INTERVAL_MS.
     */
    public startTimer(): void {
        if (this.flushTimer !== null) {
            return;
        }

        this.flushTimer = setInterval(() => {
            if (this.eventQueue.length > 0) {
                void this.flushQueue();
            }
        }, TRACKING_CONFIG.FLUSH_INTERVAL_MS);
    }

    /**
     * Stops background timer to prevent memory leaks.
     */
    public stopTimer(): void {
        if (this.flushTimer !== null) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Returns the current number of events pending in queue.
     */
    public getQueueLength(): number {
        return this.eventQueue.length;
    }
}
