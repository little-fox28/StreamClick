import { DeviceContext } from './types';

/**
 * Extracts device context, operating system, and browser information from navigator.userAgent.
 */
export function getDeviceContext(): DeviceContext {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { os: 'unknown', browser: 'unknown', user_agent: 'ssr' };
    }

    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';

    let browser = 'Unknown Browser';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    return {
        os,
        browser,
        user_agent: ua,
    };
}
