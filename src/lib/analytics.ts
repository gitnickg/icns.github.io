/** Google Analytics 4 measurement ID. Must match the gtag('config', …) call in public/analytics.js. */
export const GA_ID = 'G-F8TW9XQ0KV';

/** The only third-party script in the site's own HTML. */
export const GA_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

/**
 * Cloudflare Web Analytics (owner's choice, 2026-11-16). Not in the repo's HTML: Cloudflare's edge injects the
 * beacon for browser user agents. It loads from static.cloudflareinsights.com and reports to
 * cloudflareinsights.com (or same-origin /cdn-cgi/rum).
 */
export const CF_BEACON_HOST = 'static.cloudflareinsights.com';
export const CF_REPORT_HOST = 'cloudflareinsights.com';

/**
 * Content-Security-Policy for the Cloudflare response-header rule: GA4 hosts per Google's CSP guide
 * (no Google signals) plus Cloudflare Web Analytics. The e2e suite loads the page under this policy,
 * with the beacon injected the way Cloudflare does it, and fails on any violation.
 */
export const CSP = [
  "default-src 'self'",
  `script-src 'self' https://*.googletagmanager.com https://${CF_BEACON_HOST}`,
  "style-src 'self'",
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self'",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://${CF_REPORT_HOST}`,
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
