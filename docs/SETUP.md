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

### SMTP (password recovery and account email)

1. Choose an SMTP email provider and verify the sender/domain there. For local testing, a provider sandbox is suitable; for production, use a provider/domain authorized to send your site's mail.
2. Create SMTP credentials in that provider's dashboard. Use its host, port, username, and password. Port `587` is commonly used with STARTTLS; use the exact values and encryption method documented by your provider.
3. Add the credentials to `.env.local` for local work and to your hosting provider's **server-side** environment settings for production:

   ```dotenv
   SMTP_HOST=smtp.provider.example
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   SMTP_FROM=King Rhymes <no-reply@your-domain.example>
   ```

   `SMTP_FROM` must use a sender address accepted by the provider. Keep the password private and never use a `NEXT_PUBLIC_` variable for it.
4. Restart the local server or redeploy the production site after changing environment variables. Test password recovery from `/forgot-password` and confirm that the email arrives. Reset links expire after 30 minutes.

For Gmail SMTP specifically, enable 2-Step Verification on the Google account, create an **App password** in Google Account security settings, and use `smtp.gmail.com`, port `587`, the Gmail address as `SMTP_USER`, and that app password as `SMTP_PASSWORD`. Do not use the account's normal password. Gmail may be unsuitable for production/high-volume sending; follow Google's sending limits and use a transactional provider when appropriate.

### Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project. Configure the OAuth consent screen/Google Auth Platform with an app name, support email, and developer contact email. Add the requested scopes (`openid`, `email`, and `profile`); while the app is in **Testing**, add the Google accounts that should be able to sign in as test users.
2. Create an OAuth client ID with application type **Web application**. Under **Authorized redirect URIs**, add the exact callback for each environment:

   ```text
   http://localhost:3000/api/auth/google/callback
   https://YOUR_PUBLIC_DOMAIN/api/auth/google/callback
   ```

   Replace `YOUR_PUBLIC_DOMAIN` with the actual domain, with no trailing slash before `/api`. The URI must match the site origin and path exactly.
3. Copy the generated client ID and client secret into `.env.local` for local development and the host's server-side environment settings for production:

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_SITE_URL=https://YOUR_PUBLIC_DOMAIN
   ```

   For local development, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. It must match the origin used for the sign-in flow. Never expose the client secret in a `NEXT_PUBLIC_` variable.
4. Restart the local server or redeploy after changing variables, then test **Continue with Google** on `/login` and `/signup`. Google sign-in requires a verified email. To allow anyone outside your test-user list to sign in, publish/verify the consent configuration as required by Google.

For email/password setup, create the account at `/signup` using the exact `ADMIN_EMAIL` value and provide `ADMIN_SETUP_TOKEN`. The first successful signup for that address becomes the administrator. If an account for that email already exists, a successful password login promotes that configured address to administrator. Alternatively, Google sign-in grants administrator access to the configured email only when Google confirms that email as verified. Other accounts receive fan access. See [the webapp user guide](USER_GUIDE.md) for creator login and everyday usage.

## 4. Configure persistent media uploads

In production, configure an S3-compatible object store such as Tigris or Cloudflare R2. Public media (covers, previews, and gallery images) is served from the public bucket URL. Purchased full audio is stored in the private bucket and served using short-lived signed URLs after purchase checks.

### Tigris Object Storage

1. In the [Tigris Console](https://console.storage.dev), create two buckets: one for public media and a separate private bucket for purchased full audio. Enable public reads or a public custom domain for the public bucket only; do not make the audio bucket public.
2. Create an access key with read/write permissions for the two buckets. Treat the key and secret as credentials: add them only to local ignored `.env.local` and your host's server-side secret settings.
3. Configure the app with Tigris's S3 endpoint and virtual-host addressing. Replace the bucket names, keys, and public URL with the values from your Tigris setup:

   ```dotenv
   S3_ENDPOINT=https://t3.storage.dev
   S3_REGION=auto
   S3_FORCE_PATH_STYLE=false
   S3_PUBLIC_BUCKET=your-public-media-bucket
   S3_PRIVATE_BUCKET=your-private-audio-bucket
   S3_ACCESS_KEY_ID=tid_your_access_key
   S3_SECRET_ACCESS_KEY=tsec_your_secret_key
   S3_PUBLIC_URL=https://your-public-media-bucket.t3.storage.dev
   ```

   `S3_PUBLIC_URL` must be a working public URL for the public bucket, or a custom domain you have connected to it. Verify the base URL by opening a publicly readable object after uploading it. Keep the private audio bucket private: the app creates temporary signed URLs for purchased audio.
4. Add the same variables to your production host's environment/secret settings, restart locally or redeploy, then test uploading a cover and downloading a purchased track.

Tigris's AWS SDK configuration requires virtual-host-style requests; `S3_FORCE_PATH_STYLE=false` configures this. For other S3-compatible providers, use their required addressing style. `S3_FORCE_PATH_STYLE` defaults to `true` to preserve the existing Cloudflare R2-style configuration.

### Other S3-compatible storage

Set `S3_ENDPOINT`, `S3_REGION`, `S3_PUBLIC_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_PUBLIC_URL` to the values from your provider. `S3_FORCE_PATH_STYLE` should be set to `false` or `true` to match the provider's S3 SDK instructions. Keep private audio in a private bucket.

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
