This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables

This project depends on Supabase and requires the following environment variables to be set in your development and deployment environments:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (safe to expose to the client).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` — Supabase anon/publishable key (client-side).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only; DO NOT expose to the browser). Required for server-side operations like role lookups and creating/updating records on behalf of users.
- `ADMIN_INVITE_CODE` — a server-only secret invite code used to promote a signed-in user to the `admin` role via the `/api/admin/invite` endpoint.

Security note: Never commit `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_INVITE_CODE` to source control. Store them in your hosting provider's secret store (Vercel Environment Variables, Netlify, Docker secrets, etc.).
