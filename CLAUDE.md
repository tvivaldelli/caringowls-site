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
- `functions/api/waitlist.js` — POST: validates form input, stores in D1, sends confirmation email via Resend
- `functions/api/waitlist-admin.js` — GET: returns all submissions (requires `?key=ADMIN_SECRET`)

## Environment Variables (set in Cloudflare Pages dashboard)
- `RESEND_API_KEY` — Resend API key (shared with backend)
- `ADMIN_SECRET` — secret for admin endpoint access
- `DB` — D1 binding to `caringowls-waitlist` database (configured in Functions settings)

## Key Files
- `schema.sql` — D1 table definition for waitlist
- `wrangler.toml` — D1 database binding config

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
