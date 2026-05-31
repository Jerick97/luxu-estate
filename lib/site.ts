/**
 * Resolve the canonical, absolute base URL of the site.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL — set this to your production domain (recommended).
 *  2. Vercel-provided URLs (production deployment, then any deployment).
 *  3. localhost fallback for local development.
 *
 * Used for `metadataBase`, Open Graph / Twitter URLs and JSON-LD so that
 * shared links resolve to fully-qualified, publicly reachable URLs.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
