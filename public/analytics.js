// Google Analytics 4 setup. Loaded as a file (not inline) so the page works under script-src 'self' + googletagmanager.
// The measurement ID must match GA_ID in src/lib/analytics.ts (a build test checks this).
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-F8TW9XQ0KV');
