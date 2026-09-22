# Observability, Monitoring & Logging

## 1. Monitoring Stack

1. **Vercel Analytics (`@vercel/analytics`)**:
   - Captures anonymous visitor pageviews, unique visitors, top devices, and referrers without cookies.
2. **Speed Insights (`@vercel/speed-insights`)**:
   - Continuous real-user monitoring (RUM) for Core Web Vitals:
     - **Largest Contentful Paint (LCP)**: Target `< 2.5s`
     - **Cumulative Layout Shift (CLS)**: Target `< 0.1`
     - **Interaction to Next Paint (INP)**: Target `< 200ms`
3. **In-App Event Stream (`public.analytics_events`)**:
   - Tracks educational engagement: video plays, audio scrubbing, quiz completions.
4. **Client Error Boundary (`components/ErrorBoundary.tsx`)**:
   - Catches unhandled React component exceptions, rendering a fallback error card with refresh option.
