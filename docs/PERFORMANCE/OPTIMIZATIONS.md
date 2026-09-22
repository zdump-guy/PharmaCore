# Performance Optimizations & Architecture

## 1. Dynamic Component Code-Splitting

Heavy administrative management views in `pages/admin/index.tsx` are dynamically imported with custom skeleton loaders using `next/dynamic`. This reduces the initial JavaScript bundle sent to public visitors by over 60%:

```typescript
const CurriculumManager = dynamic(() => import('@/components/admin/CurriculumManager'), {
  loading: () => <AdminLoadingSkeleton />
});
const FeedbackManager = dynamic(() => import('@/components/admin/FeedbackManager'), {
  loading: () => <AdminLoadingSkeleton />
});
const AnalyticsDashboard = dynamic(() => import('@/components/admin/AnalyticsDashboard'), {
  loading: () => <AdminLoadingSkeleton />
});
```

---

## 2. Static Asset Caching & Edge Headers

Configured in `next.config.js`:
- **Static Assets (`public/`)**: `Cache-Control: public, max-age=31536000, immutable` for versioned media, icons, and SVG assets.
- **Incremental Static Regeneration (ISR)**: The Homepage (`pages/index.tsx`) uses `revalidate: 60` to serve cached HTML from edge nodes while revalidating course catalog changes in the background.

---

## 3. Database Execution Plan Optimization

- **20 High-Performance B-Tree Indexes**: Ensure all foreign key joins and filtered RLS queries execute in single-digit milliseconds.
- **Composite Indexes**: Composite indexes on `(course_id, "order")` and `(user_id, is_read)` eliminate in-memory sorting overhead in PostgreSQL.
