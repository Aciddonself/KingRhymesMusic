# Project Setup

## 1. Install and configure

Use Node.js 20.9 or newer, then install the project packages and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Configure `DATABASE_URL` with a PostgreSQL connection string. Set `DIRECT_URL` to a direct database connection when available; Drizzle uses it for schema changes. Keep secrets private; `.env.local` is excluded from source control. Set `ADMIN_EMAIL` to the artist's account email. Generate separate random values for `JWT_SECRET` and `ADMIN_SETUP_TOKEN`:

```powershell
node -p "require('crypto').randomBytes(48).toString('base64url')"
```

Never put secret keys or database passwords in variables prefixed with `NEXT_PUBLIC_`. In production, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.

## 2. Initialize PostgreSQL

Create or update the database tables from the Drizzle schema:

```powershell
npx drizzle-kit push
```

The application stores account profiles, content, and purchases in PostgreSQL. `drizzle-kit push` applies the current schema, including password-reset token storage. Back up production data before applying schema changes.

## 3. Configure email and sign-in

Password recovery requires working SMTP settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Reset links expire after 30 minutes. For local testing, use a trusted SMTP provider or sandbox account.

To enable Google sign-in, create OAuth web credentials and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register `https://YOUR_PUBLIC_DOMAIN/api/auth/google/callback` as an authorized redirect URI (use `http://localhost:3000/api/auth/google/callback` for local development). Google sign-in requires a verified email. Apple sign-in is not available yet.

The account using `ADMIN_EMAIL` receives administrator access after verification. For email/password setup, register that account at `/signup` and provide `ADMIN_SETUP_TOKEN`; Google sign-in also grants the configured admin email its role. Other accounts receive fan access.

## 4. Configure persistent media uploads

In production, configure an S3-compatible object store such as Cloudflare R2. Set `S3_ENDPOINT`, `S3_REGION`, `S3_PUBLIC_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL`. Public media (covers, previews, and gallery images) is served from the public bucket URL. Purchased full audio is stored in the private bucket and served using short-lived signed URLs after purchase checks.

When S3 credentials are not configured, development uploads are stored locally under `public/uploads/` and `.private-uploads/`. Local filesystem storage is not suitable for production or ephemeral deployments.

The supplied artist photos and logo are bundled under `public/pics/` and used as the default hero and portfolio gallery. The admin can replace the hero photo, upload more gallery images, edit the artist profile and biography, publish songs, curate the portfolio, moderate comments, and update social and streaming links.

## 5. Run the site

```powershell
npm run dev
```

Open `http://localhost:3000`. Sign in with the configured admin account and open `/admin` to manage songs, the home page, portfolio, gallery, comments, and site settings. The footer, music pages, and portfolio use the admin-managed social and streaming links.

For production, set the environment variables in the hosting provider's secret/configuration settings and set `NODE_ENV=production`. Do not place production credentials in the repository.

Payment provider steps are documented separately in [the Flutterwave setup guide](payments/FLUTTERWAVE.md).
