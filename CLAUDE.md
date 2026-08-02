# Caring Owls Site

## Overview
Marketing and legal pages for Caring Owls — a communication filtering service that protects elderly individuals with cognitive decline from phone scams. Operated by Vival Ventures LLC.

## Architecture
- Static HTML site with inline CSS (no build step or framework)
- Cloudflare Pages Functions for server-side logic (`functions/` directory)
- D1 database (`caringowls-waitlist`) for waitlist submissions
- Resend API for transactional email (confirmation emails from `noreply@caringowls.com`, replies go to `hello@caringowls.com`)
- Deployed via Cloudflare Pages, auto-deploys on push to `main`
- GitHub repo: https://github.com/tvivaldelli/caringowls-site

## Pages
- `index.html` — Landing page
- `get-started.html` — Waitlist signup form (POSTs to `/api/waitlist`)
- `terms.html` — Terms of Use
- `privacy.html` — Privacy Policy

## API Endpoints (Cloudflare Pages Functions)
- `functions/api/waitlist.js` — POST: validates form input, stores in D1, sends a caregiver confirmation email and an operator notification email (with qualification answers, flagging the non-iPhone case) via Resend
- `functions/api/waitlist-admin.js` — GET: returns all submissions (requires `?key=ADMIN_SECRET`)

## Environment Variables (set in Cloudflare Pages dashboard)
- `RESEND_API_KEY` — Resend API key (shared with backend)
- `ADMIN_SECRET` — secret for admin endpoint access
- `NOTIFY_EMAIL` — operator notification address for new waitlist submissions. Must be set explicitly; if unset, operator notifications are skipped (there is no fallback — `hello@caringowls.com` is not a real mailbox)
- `DB` — D1 binding to `caringowls-waitlist` database (configured in Functions settings)

## Key Files
- `schema.sql` — D1 table definition for waitlist (source of truth for a fresh database)
- `migrations/` — incremental D1 schema changes, applied in filename order
- `wrangler.toml` — D1 database binding config

## Database Migrations
The live `caringowls-waitlist` D1 table already holds data, so schema changes ship as incremental migrations in `migrations/`, not by re-running `schema.sql`. Any Worker change that reads or writes new columns requires running the migration against the **remote** database **before** deploying the Worker — otherwise the new `INSERT`/`SELECT` runs against a table without those columns and every submission fails. Keep `schema.sql` and the migrations in sync so a fresh setup and a migrated database end up identical.

```
wrangler d1 execute caringowls-waitlist --remote --file=./migrations/0001_add_qualification_fields.sql
```

## Design System
- **Fonts:** DM Serif Display (headings), DM Sans (body) — loaded from Google Fonts
- **Color palette:** amber/stone from Tailwind-style tokens defined as CSS custom properties
- **Layout:** Max-width 1100px, responsive at 640px breakpoint
- **Components:** Nav with owl SVG logo, footer with legal links — duplicated per page

## Conventions
- No JavaScript frameworks or dependencies
- All CSS is inline in `<style>` tags per page
- Nav and footer markup is copied across pages (keep them in sync manually)
- Links between pages use absolute paths (e.g., `/terms.html`)
- Legal pages use numbered sections — renumber when inserting new sections

## Local Testing
- `npx wrangler pages dev . --port 8788` — runs local dev server with D1 bindings
- Local D1 tables must be created first: `npx wrangler d1 execute caringowls-waitlist --local --file schema.sql`
- Wrangler redirects `.html` URLs to clean paths (e.g., `/get-started.html` → 308 → `/get-started`)
- Resend email calls fail locally (no API key) — test email templates by calling build functions directly with Node

## Gotchas
- Form validation exists in 3 places: HTML attributes, frontend JS (`get-started.html` `<script>`), and backend (`functions/api/waitlist.js`) — changes to validation rules must update all layers
- Confirmation email templates (HTML + plaintext) live in `functions/api/waitlist.js`, not in separate template files
- Phone numbers are stored as digits-only in D1; frontend formats for display with `(XXX) XXX-XXXX`
