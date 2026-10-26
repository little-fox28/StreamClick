/**
 * Valid event types within the e-commerce conversion funnel.
 */
export type EventType =
    | 'page_view'
    | 'product_view'
    | 'add_to_cart'
    | 'purchase';

/**
 * Client device and browser environment context.
 */
export interface DeviceContext {
    os?: string;
    browser?: string;
    user_agent?: string;
}

/**
 * Full payload of an event sent to the Backend Ingestion API.
 */
export interface TrackingEventPayload {
    event_id: string;
    timestamp: string;
    user_id?: string | null;
    anonymous_id: string;
    session_id: string;
    event_type: EventType;
    page_url: string;
    referrer_url?: string;
    product_id?: string;
    price?: number;
    amount?: number;
    device?: DeviceContext;
    properties?: Record<string, any>;
}

/**
 * Input interface passed from React components to trackEvent().
 */
export interface TrackEventInput {
    event_type: EventType;
    product_id?: string;
    price?: number;
    amount?: number;
    page_url?: string;
    referrer_url?: string;
    properties?: Record<string, any>;
}
