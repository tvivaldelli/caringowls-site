# Caring Owls Site

## Overview
Marketing and legal pages for Caring Owls — a communication filtering service that protects elderly individuals with cognitive decline from phone scams. Operated by Vival Ventures LLC.

## Architecture
- Static HTML site with no build step or framework
- Each page is standalone with inline CSS (no shared stylesheets)
- Deployed via Cloudflare Pages, auto-deploys on push to `main`
- GitHub repo: https://github.com/tvivaldelli/caringowls-site

## Pages
- `index.html` — Landing page
- `get-started.html` — Enrollment/signup form (A2P opt-in flow, client-side only)
- `terms.html` — Terms of Use
- `privacy.html` — Privacy Policy

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
