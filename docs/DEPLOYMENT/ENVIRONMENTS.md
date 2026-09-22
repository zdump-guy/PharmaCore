# Deployment Environments & Topology

## 1. Environment Comparison Matrix

| Configuration | Local Development | Preview / Staging | Production |
|---|---|---|---|
| **URL** | `http://localhost:3000` | `https://*.vercel.app` | `https://pharmacore.edu` |
| **Node Environment** | `development` | `production` | `production` |
| **Turnstile Mode** | Test keys / bypass permitted | Real keys required | Real keys enforced |
| **Email Dispatch** | Console logging fallback | Test sender | Verified sender domain |
| **Database Tier** | Local / Staging Supabase | Staging Supabase | Production Supabase instance |
| **Rate Limiting** | Active (in-memory) | Active (in-memory) | Active (in-memory) |
