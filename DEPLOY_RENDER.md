# Deploying QuickNote on Render

## What this setup does

- Deploys the existing Laravel + Inertia app as a single Docker-based web service.
- Provisions a free Render Postgres database through `render.yaml`.
- Runs migrations automatically at container startup.
- Installs Tesseract OCR and Ghostscript inside the image so the OCR flow can run on Render.

## Important limits

- Render free web services spin down on idle.
- Render free web services use an ephemeral filesystem.
- Uploaded avatars and OCR source files are not durable on the free plan.
- The extracted OCR text is stored in Postgres and will persist.
- Sessions and cache use the local filesystem on Render, so they reset on restart.
- Render free Postgres expires after 30 days unless upgraded.

## Deploy

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will detect `render.yaml` and propose:
   - one web service: `quicknote`
   - one Postgres database: `quicknote-db`
4. Confirm the Blueprint and deploy.

## First boot behavior

The startup script:

- links `public/storage`
- clears cached config/routes/views
- runs `php artisan migrate --force`
- starts Laravel on the Render-assigned port

## Environment

The Render Blueprint sets the production variables directly. The app uses:

- `DB_CONNECTION=pgsql`
- `DB_URL` from the managed Postgres database
- `SESSION_DRIVER=file`
- `CACHE_STORE=file`
- `QUEUE_CONNECTION=sync` so no worker is required on the free plan
- `MAIL_MAILER=log` for local-style email logging in production

## After deploy

- Register a new account in the deployed app.
- Verification emails will appear in the Render service logs because mail is set to `log`.
- OCR should work for PNG, JPG, and PDF as long as the uploaded file stays on the local service filesystem during processing.
