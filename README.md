# Invonix — PDF Takeoff Estimator & Invoice Manager

A production-ready Next.js + TypeScript application for construction estimating and billing. The core of the project is a PDF takeoff/estimator that lets users measure directly on plan PDFs using color-coded tags, pin measurements, and review grouped summaries. The repository also contains an invoice generator and a lightweight invoice management system with PDF export.

## Key features

- PDF takeoff estimator

  - Measure directly on PDF plans with an interactive overlay.
  - Color-coded tag system for grouping measurements by trade or material.
  - Pinning, annotation, undo/redo, and adjustable calibration/scale controls.
  - Grouped summaries, per-tag totals and exportable measurement reports.

- Export all measurements with prices in CSV

  - Store and edit unit prices per pipe size (unit price per meter) in the project settings.
  - Associate takeoff measurements with pipe sizes and group costs under tags and sizes.
  - View aggregated total cost for each pipe size and per-tag subtotals based on measured lengths.
  - Download a CSV report listing each pipe size, unit price (per meter), measured length, and total cost calculated from the takeoff.

- Invoice generator & manager

  - Build invoices from takeoff summaries or manual line items.
  - Render invoices as downloadable PDFs.
  - Basic invoice listing and management UI.

- CI/CD & deployment
  - Automated CI pipeline for linting, type-checking and tests (configured in `.github/workflows`).
  - Preview and production deployments via CI (Vercel/GitHub Actions integration).

## Tech stack

- Next.js (App Router) + TypeScript
- React, Tailwind CSS
- Firebase (Authentication, Firestore)
- GitHub Actions for CI/CD

## File map & important components

- Takeoff / estimator UI and logic: `src/app/(private-routes)/takeoff-calculator` and `src/components/takeoff-calculator`
- Tagging & selection: `src/components/takeoff-calculator/tag-selector.tsx`
- Measurement rendering and overlay: `src/components/takeoff-calculator/measurement-overlay.tsx`
- Measurement summaries: `src/components/takeoff-calculator/measurement-summary.tsx`
- Invoice generation: `src/components/invoice-generator/InvoicePdf.tsx` and `src/components/invoice-generator/InvoiceDownloader.tsx`
- Firebase initialization: `src/lib/firebase.ts`
- CI workflows: `.github/workflows/*.yml` (for preview/deploy pipelines)

## Getting started (development)

1. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

2. Create a Firebase project and add a web app. Configure the following environment variables (example `.env.local`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=app_id
```

3. Run the dev server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 to view the app.

## Testing & CI

- CI runs TypeScript type checks, linting, and unit tests (see `.github/workflows`).
- For local checks run:

```bash
npm run build
npm run lint
npm run test
```

## Deployment

- The project is configured to deploy previews and production via GitHub Actions and Vercel. See `.github/workflows/deploy-preview.yml` for the preview pipeline.

## Contribution

Contributions are welcome. Open an issue or submit a pull request describing the change and tests where applicable.

## License

Specify your license here (e.g., MIT). If you haven't chosen one yet, add a `LICENSE` file.

---

Maintained by Ramish-Amir — built for fast, accurate plan takeoffs and straightforward invoice generation.
