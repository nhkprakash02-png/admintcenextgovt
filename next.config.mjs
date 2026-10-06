/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The admin app must never be indexed, framed, or cached by browsers/CDNs. These headers apply
  // ONLY to the page itself and the login/logout/session API — static JS/CSS files keep Next's
  // normal long-lived caching so the dashboard stays fast.
  async headers() {
    const privateHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // FIX: this was 'no-referrer', which stops the browser telling Google's servers which site a
      // request comes from. Firebase/Firestore requests from a key that has "HTTP referrer"
      // restrictions then get rejected, so saves failed with "Could not sync your latest change".
      // This is the standard browser default and still sends only the site name, never full URLs.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cache-Control', value: 'no-store, max-age=0' },
    ];
    return [
      { source: '/', headers: privateHeaders },
      { source: '/api/:path*', headers: privateHeaders },
      // The service worker file must always be re-checked so updates are picked up straight away.
      { source: '/sw.js', headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ] },
    ];
  },
};

export default nextConfig;
