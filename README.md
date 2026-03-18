# Irick Images

Portfolio and booking website for **Irick Images** — a professional photography business specializing in real estate, portraits, events, performance, and promotional photography.

**Live site:** [irick-images.netlify.app](https://irick-images.netlify.app)

## Tech Stack

- **Vite** — Build tool & dev server (multi-page app)
- **GSAP** — Animations (preloader, page transitions, scroll effects)
- **Three.js** — WebGL shader transitions on the work page
- **Lenis** — Smooth scrolling
- **Supabase** — Edge functions & optional gallery image storage
- **Netlify** — Hosting, forms (booking), clean URL redirects

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── index.html              # Homepage
├── pages/                  # HTML pages (work, contact, book, galleries, admin)
├── scripts/                # JS modules (animations, booking, galleries, etc.)
├── css/                    # Stylesheets per page/component
├── data/                   # Static data (packages, gallery images, slides)
├── public/                 # Static assets (images, video, favicon)
├── netlify.toml            # Netlify build & redirect config
└── supabase/               # Supabase edge functions & config
```

## Environment Variables

Set these in the Netlify dashboard (or `.env` locally):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (inlined at build time) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (inlined at build time) |

## Booking

The booking flow uses **Netlify Forms** — no backend credentials required. Submissions appear in the Netlify dashboard under Forms → "booking". Configure email notifications in Site settings → Forms → Notifications.

## Deployment

Pushes to `main` auto-deploy via Netlify. The build command (`npm run build`) produces the `dist/` directory which Netlify serves.
