[![Netlify Status](https://api.netlify.com/api/v1/badges/90bde0a0-591c-4044-b710-224e008dd778/deploy-status)](https://app.netlify.com/projects/hershraj/deploys)

My personal website/portfolio, built with [Astro](https://astro.build).

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:4321`.

## Scripts

- **`npm run dev`**: generates SDR copies of photos, then starts the dev server
- **`npm run build`**: generates SDR copies of photos, then builds to `dist/`
- **`npm run preview`**: previews the production build
- **`npm run photos:sdr`**: converts images from `public/photos/` → `public/photos-sdr/` (forces sRGB/SDR to avoid HDR/gain-map issues)

## Project layout

- **`src/pages/`**: routes (`index.astro`, `404.astro`)
- **`src/components/sections/`**: homepage sections
- **`src/styles/`**: CSS
- **`public/`**: static assets (images, favicons, JS in `public/scripts/`, and short-link redirects in `public/_redirects`)
