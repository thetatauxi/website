# Theta Tau Xi Website

Official website for Theta Tau Xi Chapter at UW-Madison.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- MDX blog content from `src/content/blog`
- Vercel Analytics + Fathom page tracking

## Project Structure

- `src/app` - routes and layouts
- `src/components` - UI and page components
- `src/content/blog` - blog post MDX files
- `src/lib` - data/helpers
- `public` - static assets (images, PDFs, logos)
- `docs` - maintenance guides

## Development

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run lint
bunx tsc --noEmit
npm run build
```

## Environment Variables

Only needed for the legacy Google Sheets newsletter flow in `src/lib/email.ts`:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SPREADSHEET_ID`

If those are not set, the public website still runs; only that deferred/legacy flow is affected.

## Blog URL Convention

Blog filenames are the canonical URL slugs. Use:

`YYYY-MM-DD-kebab-case-title.mdx`

Example:

`2026-03-01-meet-the-spring-26-pc.mdx` -> `/blog/2026-03-01-meet-the-spring-26-pc`
