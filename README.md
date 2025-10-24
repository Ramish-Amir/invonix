# Invonix — PDF Takeoff Estimator & Invoice Manager

A production-ready Next.js + TypeScript application for construction estimating and billing. The core of the project is a PDF takeoff/estimator that lets users measure directly on plan PDFs using color-coded tags, pin measurements, and review grouped summaries. The repository also contains an invoice generator and a lightweight invoice management system with PDF export.

## Key features

### Estimation & Takeoff Tools

- **PDF Takeoff Calculator**

  - Interactive measurement tools for direct PDF plan analysis
  - Color-coded tagging system for organizing measurements by trade or material
  - Pin measurements, annotations, undo/redo functionality
  - Adjustable calibration and scale controls for accurate measurements
  - Grouped summaries with per-tag totals and exportable measurement reports

- **Fixtures Calculator**

  - Count and categorize fixtures from mechanical drawings
  - Highlight and mark fixtures by category (e.g., flow drains FD-1, FD-2, etc.)
  - Essential for accurate bidding and project estimation
  - Streamlined fixture counting workflow

- **Price Management System**

  - Store and manage unit prices for different pipe sizes and materials
  - Set prices per meter for various pipe diameters (e.g., 100mm copper pipe)
  - Associate takeoff measurements with specific pipe sizes
  - Automated cost calculations based on measured lengths

- **Cost Calculation & Export**
  - View aggregated total costs for each pipe size and material
  - Per-tag subtotals based on measured lengths
  - Export comprehensive CSV reports with pipe sizes, unit prices, measured lengths, and calculated costs
  - Professional cost summaries for bidding and project management

### Invoice Management (Legacy Features)

- **Invoice Generator & Manager**

  - Build invoices from takeoff summaries or manual line items
  - Render invoices as downloadable PDFs
  - Basic invoice listing and management UI

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

- The project is configured to deploy previews and production via GitHub Actions. See `.github/workflows/deploy-preview.yml` for the preview pipeline.

---

Maintained by Ramish-Amir — built for fast, accurate plan takeoffs and straightforward invoice generation.
