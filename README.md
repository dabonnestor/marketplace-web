# Marketplace Frontend

A full-featured marketplace web app built with Next.js 16, React 19, and TypeScript. Users can browse listings, buy and sell items with real Stripe payments, and manage orders through a dashboard.

## Features

- **Listings** — browse all active listings, search and filter by category/price, view details with image gallery
- **Sell** — create, edit, and delete your own listings; Stripe Connect onboarding for receiving payouts
- **Orders** — purchase items with real card payments via Stripe, track order status from paid through delivered
- **Dashboard** — view your listings, purchases, and sales with pagination and status filters; seller onboarding status
- **Auth** — register, login, JWT-based sessions with httpOnly cookies and automatic token refresh
- **Payments** — Stripe Elements for secure card collection, PaymentIntents, refunds, cancellations, and seller payouts via Stripe Connect

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Radix UI primitives
- **State & Data:** TanStack Query, Zustand, React Hook Form + Zod validation
- **Payments:** Stripe Elements (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- **Uploads:** uploadthing
- **Testing:** Vitest + Testing Library + jsdom

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
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Stripe publishable key (required for payments) |

## Project Structure

```
src/
  app/                        App Router pages and layouts
    (auth)/                   Login & register (centered card layout)
    (main)/                   All authenticated & public pages (navbar layout)
      dashboard/
        listings/             Seller's own listings
        purchases/            Buyer order history
        sales/                Seller order history
        seller/onboard/       Stripe Connect onboarding return page
      listings/               Browse, view, create, edit, confirm purchase
      orders/[id]/            Order detail with status actions & payment
  actions/                    Server actions (auth, listings, orders, seller, uploads)
  components/
    checkout/                 StripePaymentForm, confirm purchase
    layout/                   Navbar, theme toggle
    listings/                 Listing cards, filters, forms, detail, onboarding banner
    orders/                   Order detail, order list, purchase/sales history
    ui/                       shadcn/ui primitives (button, card, dialog, etc.)
  hooks/                      Custom React hooks
  lib/
    api/                      API client, token store adapter, shared types
    validations/              Zod schemas (auth, listings)
    display-utils             Shared formatters, badge color maps, NoImage placeholder
    order-utils               Order status transitions, colors, labels
    api/                      Server action error-boundary helper (inlined)
    utils                     General utilities
  stores/                     Zustand stores
  test/                       Test setup
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
