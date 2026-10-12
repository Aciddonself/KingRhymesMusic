# Project Setup

## 1. Install and configure

Use Node.js 20.9 or newer, then install the project packages:

```powershell
npm install
Copy-Item .env.example .env.local
```

Create a Supabase project and copy its project URL, publishable key, secret key, and Postgres connection strings into `.env.local`. Keep secrets private; `.env.local` is excluded from source control. Set `ADMIN_EMAIL` to `kingrhmestherapper@gmail.com`. Generate separate random values for `JWT_SECRET` and `ADMIN_SETUP_TOKEN`:

```powershell
node -p "require('crypto').randomBytes(48).toString('base64url')"
```

Never put secret keys or database passwords in variables prefixed with `NEXT_PUBLIC_`. The Supabase secret key is used only by the server for private media uploads and bucket setup.

## 2. Configure Supabase Postgres, authentication, and storage

Use the Supabase **session pooler** connection string for `DATABASE_URL` so the app can connect from IPv4/serverless hosts. Use the **direct** Postgres connection string for `DIRECT_URL` when running schema commands. If your network does not support IPv6, use the session pooler for both. Keep `sslmode=require` in both URLs.

Initialize the Supabase database from the Drizzle schema:

```powershell
npx drizzle-kit push
```

The application's content and account-profile tables are stored in Supabase Postgres. Supabase Auth manages passwords, email verification, password resets, and OAuth sessions. Supabase Storage automatically creates two buckets on the first admin upload: a public bucket for artwork and preview clips and a private bucket for purchased full tracks. The service/secret key must stay server-side.

In Supabase **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to the allowed redirect URLs and set your deployed HTTPS site URL as the production Site URL. Configure the Supabase SMTP settings if you want custom-branded confirmation and recovery emails.

To enable Google and Apple sign-in, enable Google and Apple under **Authentication → Sign In / Providers** and add each provider's OAuth client credentials there. Register `/auth/callback` as the redirect URL with each provider. The sign-in buttons are ready to use those configured providers.

The account using `ADMIN_EMAIL` receives administrator access after authenticating. For email/password setup, open `/signup` and provide the configured `ADMIN_SETUP_TOKEN`; Google/Apple can be used by that verified email as well. Other accounts receive fan access.

## 3. Configure persistent media uploads

Admin uploads use the Supabase Storage buckets set by `SUPABASE_PUBLIC_BUCKET` and `SUPABASE_PRIVATE_BUCKET`. The defaults are `kingrhymes-media` (public) and `kingrhymes-audio` (private). Full audio remains private; short-lived signed download URLs are issued only after purchase checks. Covers, gallery photos, hero images, and preview clips are public.

The supplied artist photos and logo are optimized, bundled under `public/pics/`, and used as the default hero and portfolio gallery. The admin can replace the hero photo, upload more gallery images, edit the artist profile and biography, publish songs, curate the portfolio, moderate comments, and update social and streaming links.

## 4. Run the site

```powershell
npm run dev
```

Open `http://localhost:3000`. Sign in with the configured admin account and open `/admin` to manage songs, the home page, portfolio, gallery, comments, and site settings. The footer, music pages, and portfolio use the admin-managed social and streaming links.

For production, set the environment variables in the hosting provider's secret/configuration settings, set `NODE_ENV=production`, and set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS URL. Do not place production credentials in the repository.

Payment provider steps are documented separately in [the Flutterwave setup guide](payments/FLUTTERWAVE.md).
