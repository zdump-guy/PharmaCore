This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load Inter for English and Tajawal for Arabic.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.



I tied running, here's the issue :

npm run dev



> yo-project@0.1.0 dev

> $HOME/.n/bin/node node_modules/.bin/next dev



 ⚠ Port 3000 is in use, trying 3001 instead.

  ▲ Next.js 14.2.35

  - Local:        http://localhost:3001

  - Environments: .env.local



 ✓ Starting...

 ⚠ Disabling SWC Minifer will not be an option in the next major version. Please report any issues you may be experiencing to https://github.com/vercel/next.js/issues

   Disabled SWC as replacement for Babel because of custom Babel configuration ".babelrc" https://nextjs.org/docs/messages/swc-disabled

 ⚠ Mismatching @next/swc version, detected: 16.3.1 while Next.js is on 14.2.33. Please ensure these match

 ✓ Ready in 11.6s

   Using external babel configuration from /home/bravo-07/Documents/dev/yo-project/.babelrc

 ⚠ It looks like there is a custom Babel configuration that can be removed.

 ○ Compiling / ...

 ✓ Compiled / in 7.7s (458 modules)

⚠️  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715

 ⨯ Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.

    at validateSupabaseUrl (file:///home/bravo-07/Documents/dev/yo-project/node_modules/@supabase/supabase-js/dist/index.mjs:385:48)

    at new SupabaseClient (file:///home/bravo-07/Documents/dev/yo-project/node_modules/@supabase/supabase-js/dist/index.mjs:627:19)

    at createClient (file:///home/bravo-07/Documents/dev/yo-project/node_modules/@supabase/supabase-js/dist/index.mjs:867:9)

    at eval (webpack-internal:///./lib/supabaseClient.ts:12:85) {

  page: '/'

}

 ○ Compiling /_error ...

 ✓ Compiled /_error in 1440ms (460 modules)

 GET / 500 in 9612ms
