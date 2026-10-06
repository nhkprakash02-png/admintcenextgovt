// The admin site must never appear in search results.
export default function robots() {
  return { rules: { userAgent: '*', disallow: '/' } };
}
