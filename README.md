# PCT Training Hub

Internal training and event management app with SSO, a PocketBase backend, and a React SPA frontend.

## Overview

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: PocketBase (self-hosted)
- Auth: SSO via `/whoami` with role-based access (`users.role`)
- Optional fallback auth: PocketBase email/password for admin login
- Storage: PocketBase file fields (hero images, attachments, resource files)

## Features

- Home dashboard with featured and recommended trainings
- Calendar views (day/week/month/year)
- Training detail view with registration or external enrollment
- Tools & Guidelines page for shared resources
- Support page rendered from a visual page builder
- Admin portal for managing trainings, categories, enrollments, resources, and roles

## Architecture

```
Browser
  -> Training Hub SPA (static)
      -> /whoami (SSO identity + PocketBase user token)
      -> PocketBase API (auth + data + files)
```

**User Provisioning**: SSO users are provisioned server-side in `/whoami` (CGI). The endpoint authenticates/provisions PocketBase users and returns `pbToken` for frontend API access.

For SSO and server-side details (Apache + mod_auth_mellon + PocketBase), see `docs/INFRA.md`.

## Auth and Access

- Default flow: SSO `GET /whoami` returns `{ id, email, name, role, uid, pbToken, pbAuthExpiresAt }` and the app hydrates PocketBase auth store from `pbToken`.
- Admin pages are gated by `role === "admin"`.
- Optional admin login page at `/admin-login` uses PocketBase user auth.
  - Enabled only when `VITE_ENABLE_ADMIN_LOGIN=true`.

## Routes

- `/` Home
- `/calendar` Calendar views
- `/tools` Tools & Guidelines
- `/support` Support page (page builder content)
- `/training/:id` Training details
- `/admin` Admin portal
- `/admin/training/new` Create training
- `/admin/training/:id/edit` Edit training
- `/admin-login` Local admin login (optional)

## PocketBase Collections

Created and seeded by `scripts/pocketbase/setup.mjs`:

- `categories`
- `trainings`
- `training_attachments`
- `registrations`
- `resources`
- `training_updates`
- `learning_platforms`
- `page_content`
- `page_versions`
- `users` (auth collection with custom `role` field)

### users Collection Auto-Provisioning

SSO users are created and authenticated in backend `/whoami` with:
- `email`: from SSO (unique identifier)
- `name`: from SSO
- `uid`: from SSO NameID/UID claim
- `role`: preserved for existing users, defaults to `'user'` for new users
- `password`: deterministic internal value (`SHA-256("training-hub-pb-auth:<email>") + "Zz9A"`)
- `emailVisibility`: false

Existing user role is preserved; admins are still managed through Team Roles.

## References

- [PocketBase](https://pocketbase.io/)
- [PocketBase Docs](https://pocketbase.io/docs/)

## Environment Variables

Frontend (Vite):

- `VITE_POCKETBASE_URL`
  - PocketBase base origin only (example: `https://training-hub.ku.ac.ae` or `http://127.0.0.1:8090`).
  - Do **not** include `/api` suffix.
  - Do **not** use route-relative values.
  - If empty, runtime falls back to `window.location.origin`.
- `VITE_WHOAMI_URL` (default: `/whoami`)
- `VITE_SSO_LOGOUT_URL` (default: `/mellon/logout`)
- `VITE_ENABLE_ADMIN_LOGIN` (default: `false`)

Seeder script (`scripts/pocketbase/setup.mjs`):

- `POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD`
- or `POCKETBASE_ADMIN_TOKEN`

## Local Development

1. Install dependencies

```
npm ci
```

2. Start dev server

```
npm run dev
```

3. Set environment variables (example)

```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_WHOAMI_URL=/whoami
VITE_SSO_LOGOUT_URL=/mellon/logout
VITE_ENABLE_ADMIN_LOGIN=false
```

Production note:
- Keep `VITE_POCKETBASE_URL` on the site origin (for example `https://training-hub.ku.ac.ae`) so requests always target root `/api/...` and never nested route paths such as `/admin/api/...`.

## Seed Data and Schema Setup

Run once to create collections, role field, and seed data:

```
POCKETBASE_URL=http://127.0.0.1:8090 \
POCKETBASE_ADMIN_EMAIL=admin@example.com \
POCKETBASE_ADMIN_PASSWORD=secret \
node scripts/pocketbase/setup.mjs
```

You can use `POCKETBASE_ADMIN_TOKEN` instead of email/password.

## Deployment

- App deployment: `DEPLOYMENT.md`
- SSO and infra requirements: `docs/INFRA.md`
- Safety/rollback scripts:
  - `scripts/ops/backup_prod.sh`
  - `scripts/ops/rollback_prod.sh`

## Admin Guide

See `docs/ADMIN_GUIDE.md` for detailed admin workflows.

## Repo Map

- `src/` app code
- `scripts/pocketbase/` schema + seeding
- `docs/` infrastructure and admin guides
- `DEPLOYMENT.md` deployment steps
