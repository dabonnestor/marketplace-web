# Marketplace Frontend

A full-featured marketplace web app built with Next.js 16, React 19, and TypeScript. Users can browse listings, buy and sell items, and manage orders through a dashboard.

## Features

- **Listings** — browse all active listings, search and filter by category/price, view details with image gallery
- **Sell** — create, edit, and delete your own listings
- **Orders** — purchase items, track order status from paid through delivered
- **Dashboard** — view your listings, purchases, and sales with pagination and status filters
- **Auth** — register, login, JWT-based sessions with httpOnly cookies and automatic token refresh

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Radix UI primitives
- **State & Data:** TanStack Query, Zustand, React Hook Form + Zod validation
- **Uploads:** uploadthing
- **Testing:** Vitest + Testing Library

## Getting Started

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8080` | Marketplace API backend URL |

## Project Structure

```
src/
  app/              App Router pages and layouts
  actions/          Server actions (auth, listings, orders, uploads)
  components/
    layout/         Navbar, theme toggle
    listings/       Listing cards, filters, forms, detail view
    orders/         Order detail, order list, purchase/sales history
    ui/             shadcn/ui primitives (button, card, dialog, etc.)
  hooks/            Custom React hooks
  lib/
    api/            API client, token store adapter, shared types
    validations/    Zod schemas (auth, listings)
    display-utils   Shared formatters, badge color maps, NoImage placeholder
    order-utils     Order status transitions, colors, labels
    wrap-action     Server action error-boundary helper
    utils           General utilities
  stores/           Zustand stores
  test/             Test setup
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
