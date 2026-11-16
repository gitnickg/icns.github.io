/** Google Analytics 4 measurement ID. Must match the gtag('config', …) call in public/analytics.js. */
export const GA_ID = 'G-F8TW9XQ0KV';

/** The only third-party script the site loads. */
export const GA_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

/**
 * Content-Security-Policy for the Cloudflare response-header rule. GA4 hosts per Google's CSP guide
 * (no Google signals). The e2e suite loads the page under this policy and fails on any violation.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://*.googletagmanager.com",
  "style-src 'self'",
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
