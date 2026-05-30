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
| `API_BASE_URL` | `http://localhost:3000` | Marketplace API backend URL |

## Project Structure

```
src/
  app/          App Router pages and layouts
  actions/      Server actions (auth, listings, orders, uploads)
  components/   Shared UI components
  hooks/        Custom React hooks
  lib/          API client, utilities, validations, types
  stores/       Zustand stores
  test/         Test setup
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
