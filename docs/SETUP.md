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

To enable Google sign-in, create an OAuth 2.0 **Web application** client in Google Cloud Console, enable the Google Identity API if prompted, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the local `.env.local` or hosting provider's server-side environment settings. Add the exact callback URL `https://YOUR_PUBLIC_DOMAIN/api/auth/google/callback` to the OAuth client's **Authorized redirect URIs**. For local development, also add `http://localhost:3000/api/auth/google/callback`. Set `NEXT_PUBLIC_SITE_URL` to the same origin users visit, without a trailing slash; the callback URI must match it exactly. Add user accounts as OAuth test users while the Google consent screen is in testing mode. Restart/redeploy after setting credentials. Google sign-in requires a verified email.

For email/password setup, create the account at `/signup` using the exact `ADMIN_EMAIL` value and provide `ADMIN_SETUP_TOKEN`. The first successful signup for that address becomes the administrator. If an account for that email already exists, a successful password login promotes that configured address to administrator. Alternatively, Google sign-in grants administrator access to the configured email only when Google confirms that email as verified. Other accounts receive fan access. See [the webapp user guide](USER_GUIDE.md) for creator login and everyday usage.

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

## 6. Deploy

### Netlify

Connect the GitHub repository to Netlify and deploy the `master` branch. The included `netlify.toml` uses the Next.js build command and standard Next.js output so Netlify's Next.js adapter can handle server rendering and API routes. Set the required environment variables in the Netlify site settings. Set `NEXT_PUBLIC_SITE_URL` to the assigned `https://<site>.netlify.app` URL, then redeploy.

For Google sign-in, add `https://<site>.netlify.app/api/auth/google/callback` to the Google OAuth client's authorized redirect URIs. Configure Flutterwave's webhook at `https://<site>.netlify.app/api/payments/webhook/flutterwave` if payments are enabled. Netlify's filesystem is ephemeral: configure S3-compatible storage before using uploads.

### Docker

Build and run the included Docker image. Its build stage explicitly selects standalone output:

```powershell
docker build -t king-rhymes .
docker run --env-file .env.local -p 3000:3000 king-rhymes
```

Pass production secrets through the container environment rather than baking them into the image.

### Namecheap Node.js hosting or VPS

On a Namecheap VPS/Node.js host, use Node.js 20 or newer. From the project directory, install dependencies, set the production environment variables in the hosting control panel, and build the standard Next.js output:

```bash
npm ci
NEXT_OUTPUT=default npm run build
NEXT_OUTPUT=default npm start
```

In PowerShell, set the output mode for both build and start:

```powershell
$env:NEXT_OUTPUT = "default"
npm ci
npm run build
npm start
```

For a VPS using PM2, build the standard Next.js output and start the app from the project directory with `pm2 start ecosystem.config.json`. The PM2 configuration sets `NEXT_OUTPUT=default` so `next start` uses the matching output mode. Configure the hosting reverse proxy to forward HTTPS traffic to the app's port (3000 by default). Namecheap shared hosting plans may not support persistent Next.js server processes; use a VPS or another host if the plan does not provide Node.js application hosting.

Payment provider steps are documented separately in [the Flutterwave setup guide](payments/FLUTTERWAVE.md).
