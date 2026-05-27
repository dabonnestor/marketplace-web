# Marketplace Frontend PRD

## Problem Statement

The marketplace API exists as a standalone Express backend with full auth, listings, and orders functionality, but there is no user-facing interface. Sellers cannot list products, buyers cannot browse or purchase, and order status transitions exist only as API endpoints. The marketplace needs a browser-based frontend to make these capabilities accessible to real users.

## Solution

A Next.js 16 frontend application that provides a complete marketplace experience: browsing listings with search and filters, user authentication, creating and managing listings, purchasing items, and tracking orders through their lifecycle. The frontend communicates with the existing marketplace API via server actions, with JWT tokens stored in HTTP-only cookies for security.

## User Stories

1. As a visitor, I want to browse active listings with search, category, and price filters, so that I can find items I'm interested in buying.
2. As a visitor, I want to see paginated listing results, so that I can navigate large catalogs efficiently.
3. As a visitor, I want to share filtered listing URLs, so that I can send search results to others (all filter state in URL search params).
4. As a visitor, I want to view full listing details including images, price, shipping cost, and condition, so that I can make an informed purchase decision.
5. As a visitor, I want to register for an account, so that I can buy and sell items.
6. As a returning user, I want to log in with my email and password, so that I can access my account.
7. As a logged-in user, I want to see my authentication state reflected in the navbar (my name, dashboard links), so that I know I'm logged in.
8. As a logged-in user, I want my session to persist across page refreshes and browser restarts, so that I don't have to log in repeatedly.
9. As a logged-in user, I want my access token to auto-refresh when it expires, so that I'm not interrupted mid-session.
10. As a buyer, I want to click "Buy Now" on a listing and see a confirmation page with the full price breakdown (subtotal, shipping, platform fee, total), so that I understand what I'm paying before committing.
11. As a buyer, I want to confirm the purchase and create the order, so that the listing is reserved for me.
12. As a buyer, I want to view my purchase history with status filters, so that I can track what I've bought.
13. As a buyer, I want to view an order's detail page, so that I can see its current status and take available actions.
14. As a buyer, I want to mark an order as "paid", so that the seller knows I've sent payment.
15. As a buyer, I want to mark an order as "completed" once I've received the item, so that the transaction is finalized.
16. As a seller, I want to create a listing with title, description, price, category, condition, shipping cost, and images, so that my item is visible to buyers.
17. As a seller, I want to upload images for my listing, so that buyers can see what I'm selling.
18. As a seller, I want to edit my listing details, so that I can correct mistakes or update information.
19. As a seller, I want to delete my listing, so that I can remove it if it's no longer available.
20. As a seller, I want to view my sales history with status filters, so that I can track what I've sold.
21. As a seller, I want to mark an order as "shipped", so that the buyer knows their item is on the way.
22. As a seller, I want to mark an order as "delivered", so that the buyer knows their item has arrived.
23. As a seller, I want to view all my listings (both active and sold) in one place, so that I can manage my inventory.
24. As a user, I want to see appropriate feedback (toasts) when actions succeed or fail, so that I understand what happened.
25. As a user, I want inline form validation errors, so that I can fix mistakes before submitting.
26. As a user, I want the app to be usable on mobile devices, so that I can browse and buy on my phone.
27. As a user, I want to switch between light and dark mode, so that I can use the app comfortably in any lighting.

## Implementation Decisions

### Architecture

- **Separate repo** from the API. The frontend lives at `marketplace-frontend`, the API at `marketplace-api`.
- **Next.js 16 App Router** with React Server Components as the default, Client Components only where interactivity is needed.
- **Route groups** — `(auth)` for login/register (no navbar, centered card layout), `(main)` for all other pages (navbar + container layout).
- **Dashboard** uses a shared sidebar layout with three sub-routes: purchases, sales, my listings. Active tab driven by pathname.

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`. CSS custom properties for theme colors (light/dark).
- **shadcn/ui** components written manually (not via CLI) using Radix primitives and `class-variance-authority`. All components live in `src/components/ui/`.
- **Light mode default** with a manual dark mode toggle via `next-themes` using the `class` strategy.

### Data Flow

- **API communication**: all calls go through server-side functions. The API client (`src/lib/api/client.ts`) reads access/refresh tokens from HTTP-only cookies, attaches them as Bearer headers, and auto-refreshes on 401.
- **Server actions** wrap the API client for mutations (login, register, createListing, updateOrderStatus, etc.). Client components call server actions, not the API directly.
- **Server components** fetch data directly via the API client for read-heavy pages (browse listings, listing detail).
- **TanStack Query** manages server state on the client for pages that need caching, refetching, or optimistic updates.
- **Zustand** manages client-only state: the current user object and auth loading state.
- **URL search params** drive all filter/pagination state on the browse page, making filtered results shareable.

### Forms

- **React Hook Form + Zod** for all form handling. Validation schemas mirror the API's Zod schemas.
- **shadcn/ui Form** components wire RHF to the UI layer.
- **sonner** toasts for mutation success/error feedback. Inline field errors from both client-side Zod validation and server-side API validation errors.

### Auth

- **HTTP-only cookies** store JWT access token (15min) and refresh token (7d). Tokens are never exposed to client-side JavaScript.
- The server-side API client reads cookies, attaches the access token as a Bearer header, and auto-refreshes on 401 responses.
- On the client, a Zustand store holds the current user object (fetched via `GET /api/v1/auth/me`). The root layout (or a wrapper) calls `getMe()` on initial load to hydrate the store.
- Logout clears both cookies server-side and resets the Zustand store client-side.

### Image Uploads

- **UploadThing** via a server action. User selects files → server action receives `FormData` → UploadThing stores the files → URLs are returned → submitted to the create listing API. No new API endpoints needed.

### Order State Machine

The frontend must respect the API's order state machine:

```
pending -> paid, cancelled       (paid: buyer action)
paid    -> shipped, disputed, cancelled  (shipped: seller action)
shipped -> delivered, disputed   (delivered: seller action)
delivered -> completed, disputed (completed: buyer action)
completed -> (terminal)
disputed -> cancelled
cancelled -> (terminal)
```

The order detail page shows only the valid next statuses based on the current status and the user's role (buyer vs seller).

### Types

- **Manually defined** in `src/lib/api/types.ts` for the MVP, mirroring the API contract exactly. Future: generate from the OpenAPI spec at `/api/docs.json` using `orval`.

### API Changes Required

- **New endpoint**: `GET /api/v1/listings/mine` — returns all listings (active + sold) for the authenticated seller, with pagination. Needed for the "My Listings" dashboard tab.

### Pages

| Route | Purpose | Auth | Phase |
|-------|---------|------|-------|
| `/` | Landing page → browse CTA | No | 1 |
| `/listings` | Browse with search/filter/pagination | No | 1 |
| `/listings/[id]` | Listing detail + buy button | No | 1 |
| `/listings/new` | Create listing form | Yes | 1 |
| `/listings/[id]/edit` | Edit listing form | Yes | 2 |
| `/login` | Login form | No | 1 |
| `/register` | Registration form | No | 1 |
| `/orders/[id]` | Order detail + status actions | Yes | 1 |
| `/dashboard/purchases` | Buyer order history | Yes | 2 |
| `/dashboard/sales` | Seller order history | Yes | 2 |
| `/dashboard/listings` | Seller's own listings | Yes | 2 |

### Testing

- **Vitest + React Testing Library** for component and hook unit tests. Focus on: form validation behavior, loading/error states, conditional rendering based on auth state.
- **Playwright** for E2E tests on the two critical paths: (a) browse → view listing → register → buy, and (b) listing → sale → ship → deliver. Tests run against a real API instance.
- No test files written yet — to be added during Phase 1 implementation.

## Out of Scope

- Payment processing (Stripe, etc.) — the API has no payment integration; "paid" is a manual status transition.
- Social login / OAuth.
- Real-time notifications (WebSockets, SSE).
- Seller store pages (`/seller/[id]`).
- Admin panel.
- Shipping label generation.
- Reviews/ratings.
- Messaging between buyers and sellers.
- SEO optimization beyond basic `generateMetadata`.
- CI/CD pipeline.
- OpenAPI type generation (manual types for MVP).

## Further Notes

- The API currently returns all monetary values as strings to preserve decimal precision. The frontend must parse them with a decimal-aware approach or display them as-is with currency formatting.
- The `user_role` enum exists in the API schema but is unused — every user is simultaneously a buyer and seller. Authorization is contextual (ownership/participation-based), not role-based.
- CORS is fully open on the API in development — no configuration needed on the frontend side.
- The API rate-limits auth endpoints (20 req/15min) and all endpoints globally (100 req/15min). The frontend should not retry rate-limited requests aggressively.
