/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The admin app must never be indexed, framed, or cached by browsers/CDNs. These headers apply
  // ONLY to the page itself and the login/logout API — static JS/CSS files keep Next's normal
  // long-lived caching so the dashboard stays fast.
  async headers() {
    const privateHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'no-store, max-age=0' },
    ];
    return [
      { source: '/', headers: privateHeaders },
      { source: '/api/:path*', headers: privateHeaders },
    ];
  },
};

export default nextConfig;
