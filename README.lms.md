# LMS setup notes

Quick steps to finish setup locally:

1. Install dependencies (using pnpm):

```bash
pnpm add -D prisma
pnpm add @prisma/client @next-auth/prisma-adapter next-auth bcrypt
```

2. Generate Prisma client and run initial migration:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

3. Start the dev server:

```bash
pnpm run dev
```

Notes:
- Update `.env` values for `NEXTAUTH_SECRET` and Google OAuth credentials.
- The project includes a Prisma schema at `prisma/schema.prisma` and a minimal NextAuth route at `src/app/api/auth/[...nextauth]/route.ts`.
- You'll likely want to seed an admin/instructor user after migrations; a seed script is included: `pnpm run db:seed`.

CI
-- A GitHub Actions workflow is included at `.github/workflows/ci.yml`. It runs type checks, applies Prisma migrations, seeds the DB, and runs a basic DB query test.

Deployment
- Vercel is the simplest way to deploy a Next.js app. Set the following environment variables in Vercel dashboard:
	- `DATABASE_URL` (for SQLite use `file:./dev.db` in local; for production prefer Postgres)
	- `NEXTAUTH_SECRET`
	- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google OAuth)

To deploy to Vercel:

```bash
# from project root
vercel login
vercel --prod
```

Notes:
- For production use you should switch from SQLite to Postgres or another managed DB and update `DATABASE_URL`.
- Configure secure secrets in your hosting provider (Vercel, Render, etc.).
