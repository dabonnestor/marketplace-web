# Marketplace Frontend PRD

## Problem Statement

The marketplace API exists as a standalone Express backend with full auth, listings, orders, and Stripe Connect payment support, but there is no user-facing interface. Sellers cannot list products or receive payouts, buyers cannot browse or pay with real money, and order status transitions exist only as API endpoints. The marketplace needs a browser-based frontend to make these capabilities accessible to real users.

## Solution

A Next.js 16 frontend application that provides a complete marketplace experience: browsing listings with search and filters, user authentication, creating and managing listings, purchasing items with real Stripe payments, seller Stripe Connect onboarding for payouts, order lifecycle management (cancel, refund, complete), and polling for webhook-driven status changes.

## User Stories

### Discovery & Listings

1. As a visitor, I want to browse active listings with search, category, and price filters, so that I can find items I'm interested in buying.
2. As a visitor, I want to see paginated listing results, so that I can navigate large catalogs efficiently.
3. As a visitor, I want to share filtered listing URLs, so that I can send search results to others (all filter state in URL search params).
4. As a visitor, I want to view full listing details including images, price, shipping cost, and condition, so that I can make an informed purchase decision.

### Auth

5. As a visitor, I want to register for an account, so that I can buy and sell items.
6. As a returning user, I want to log in with my email and password, so that I can access my account.
7. As a logged-in user, I want to see my authentication state reflected in the navbar (my name, dashboard links), so that I know I'm logged in.
8. As a logged-in user, I want my session to persist across page refreshes and browser restarts, so that I don't have to log in repeatedly.
9. As a logged-in user, I want my access token to auto-refresh when it expires, so that I'm not interrupted mid-session.

### Buying & Checkout

10. As a buyer, I want to click "Buy Now" on a listing and see a confirmation page with the full price breakdown (subtotal, shipping, platform fee, total), so that I understand what I'm paying before committing.
11. As a buyer on the checkout page, I want to enter my card details in a secure Stripe-hosted form and submit payment, so that my card data never touches the marketplace servers.
12. As a buyer submitting payment, I want to see a loading spinner while my payment processes, so that I know the system is working.
13. As a buyer whose card is declined, I want to see the specific decline reason, so that I can take corrective action.
14. As a buyer who successfully pays, I want to be redirected to the order detail page, so that I can track my purchase.
15. As a buyer who refreshes the page during checkout, I want the checkout page to recover and show the payment form again (not create a duplicate order), so that I don't lose my order.
16. As a buyer with a pending order, I want to see a "Complete Payment" button on the order detail page if I haven't paid yet, so that I can finish payment without starting over.
17. As a buyer, I want to cancel a pending order before the seller ships, so that I can back out of a purchase.
18. As a buyer with a paid, shipped, or delivered order, I want to request a refund, so that I can get my money back if something goes wrong.
19. As a buyer whose order is delivered, I want to mark it as complete (triggering the seller's payout), so that the seller receives their funds.

### Order Management

20. As a buyer, I want to view my purchase history with status filters, so that I can track what I've bought.
21. As a buyer, I want to view an order's detail page, so that I can see its current status and take available actions.
22. As a buyer with stale order status (dispute, expiry), I want the order detail page to auto-refresh every 30 seconds, so that I see webhook-driven status changes without manual refreshing.
23. As a seller, I want to mark an order as "shipped", so that the buyer knows their item is on the way.
24. As a seller, I want to mark an order as "delivered", so that the buyer knows their item has arrived.
25. As a seller, I want to view my sales history with status filters, so that I can track what I've sold.

### Selling & Onboarding

26. As a seller, I want to create a listing with title, description, price, category, condition, shipping cost, and images, so that my item is visible to buyers.
27. As a seller, I want to upload images for my listing, so that buyers can see what I'm selling.
28. As a seller, I want to edit my listing details, so that I can correct mistakes or update information.
29. As a seller, I want to delete my listing, so that I can remove it if it's no longer available.
30. As a seller, I want to view all my listings (both active and sold) in one place, so that I can manage my inventory.
31. As a seller, I want to see a banner on My Listings telling me I need to set up Stripe Connect, so that I know why I can't create listings yet.
32. As a seller clicking "Set up payouts", I want to be redirected to Stripe's hosted onboarding flow, so that I can connect my bank account securely.
33. As a seller completing Stripe onboarding, I want to land on a page that confirms my setup was successful, so that I know I'm ready to sell.
34. As a seller whose onboarding failed, I want to see a clear error state with a retry button on the return page, so that I can try again.
35. As a seller whose order is completed, I want to see that the Stripe transfer has been made, so that I know my payout is on the way.

### UX

36. As a user, I want to see appropriate feedback (toasts) when actions succeed or fail, so that I understand what happened.
37. As a user, I want inline form validation errors, so that I can fix mistakes before submitting.
38. As a user, I want the app to be usable on mobile devices, so that I can browse and buy on my phone.
39. As a user, I want to switch between light and dark mode, so that I can use the app comfortably in any lighting.

## Implementation Decisions

### Architecture

- **Separate repo** from the API. The frontend lives at `marketplace-frontend`, the API at `marketplace-api`.
- **Next.js 16 App Router** with React Server Components as the default, Client Components only where interactivity is needed.
- **Route groups** — `(auth)` for login/register (no navbar, centered card layout), `(main)` for all other pages (navbar + container layout).
- **Dashboard** uses a shared sidebar layout with five sub-routes: purchases, sales, my listings, and seller onboarding. Active tab driven by pathname.

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`. CSS custom properties for theme colors (light/dark).
- **shadcn/ui** components written manually (not via CLI) using Radix primitives and `class-variance-authority`. All components live in `src/components/ui/`.
- **Light mode default** with a manual dark mode toggle via `next-themes` using the `class` strategy.

### Data Flow

- **API communication**: all calls go through server-side functions. The API client (`src/lib/api/client.ts`) reads access/refresh tokens from HTTP-only cookies, attaches them as Bearer headers, and auto-refreshes on 401.
- **Server actions** wrap the API client for mutations (login, register, createListing, updateOrderStatus, payOrder, cancelOrder, refundOrder, completeOrder, onboardSeller, etc.). Client components call server actions, not the API directly.
- **Server components** fetch data directly via the API client for read-heavy pages (browse listings, listing detail).
- **TanStack Query** manages server state on the client for pages that need caching, refetching, or polling.
- **Zustand** manages client-only state: the current user object and auth loading state.
- **URL search params** drive all filter/pagination state on the browse page, making filtered results shareable.

### Forms

- **React Hook Form + Zod** for all form handling. Validation schemas mirror the API's Zod schemas.
- **shadcn/ui Form** components wire RHF to the UI layer.
- **sonner** toasts for mutation success/error feedback. Inline field errors from both client-side Zod validation and server-side API validation errors.

### Auth

- **HTTP-only cookies** store JWT access token (15min) and refresh token (7d). Tokens are never exposed to client-side JavaScript.
- The server-side API client reads cookies, attaches the access token as a Bearer header, and auto-refreshes on 401 responses.
- On the client, a Zustand store holds the current user object (fetched via `GET /api/v1/auth/me`). An `AuthHydrator` component in the root layout calls `getMe()` on initial load to hydrate the store.
- Logout clears both cookies server-side and resets the Zustand store client-side.
- Auth-gated pages redirect unauthenticated users to `/login?redirect=<path>`.

### Image Uploads

- **UploadThing** via a server action. User selects files → server action receives `FormData` → UploadThing stores the files → URLs are returned → submitted to the create listing API. No new API endpoints needed.

### Payments (Stripe Connect)

- **Stripe Elements** via `@stripe/react-stripe-js` and `@stripe/stripe-js` with the `<PaymentElement>` component.
- Publishable key stored as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`.
- `<Elements>` provider mounted only on pages that need it (confirm purchase, order detail payment fallback) via the reusable `StripePaymentForm` component.
- **Checkout flow**: Step 1 shows listing summary with a "Proceed to Payment" button that calls `POST /orders` (creates order + PaymentIntent). On success, transitions to step 2 and updates URL to `?orderId=<id>` for refresh safety. Step 2 shows server-computed price breakdown alongside `<PaymentElement>`. On Stripe confirmation, calls `POST /orders/:id/pay`.
- **Refresh safety**: On page load, if `orderId` param is present, fetch the order. If `pending`, retrieve `clientSecret` and mount payment form. If terminal, redirect to `/orders/[orderId]`.
- **Platform fee**: 10%, server-computed via the `POST /orders` response, not estimated client-side.

### Seller Onboarding

- `POST /api/v1/seller/onboard` returns a Stripe Connect URL. Seller is redirected to Stripe's hosted onboarding flow.
- `GET /api/v1/seller/onboard/status` returns `{ onboarded, chargesEnabled, payoutsEnabled }`.
- **Banner**: On the My Listings dashboard page, if the seller has not completed onboarding, a banner prompts them to "Set up payouts".
- **Return page**: `/dashboard/seller/onboard` — Stripe redirects here after onboarding. Calls `GET /seller/onboard/status` and shows success or error/retry state.

### Order State Machine

The frontend implements the full order state machine including Stripe-driven statuses:

```
pending    -> paid, cancelled           (paid: buyer via Stripe; cancelled: buyer action)
paid       -> shipped, disputed, cancelled, refunded  (shipped: seller; refunded: buyer)
shipped    -> delivered, disputed, refunded  (delivered: seller; refunded: buyer)
delivered  -> completed, disputed, refunded  (completed: buyer; refunded: buyer)
completed  -> (terminal)
disputed   -> cancelled (terminal, webhook-driven)
cancelled  -> (terminal)
expired    -> (terminal, 30-min TTL, no frontend actions)
refunded   -> (terminal)
```

The order detail page shows valid next statuses based on the current status and the user's role (buyer vs seller). It also shows:
- **Cancel button**: buyer only, on `pending` orders. Confirmation dialog required.
- **Refund button**: buyer only, on `paid`/`shipped`/`delivered` orders. Confirmation dialog required.
- **Complete Payment button**: buyer only, on `pending` orders with a `clientSecret`. Mounts `StripePaymentForm`.
- **Status progress bar**: shows the linear flow pending → paid → shipped → delivered → completed.
- **Polling**: `refetchInterval: 30000` on non-terminal orders for webhook-driven status changes (disputes, expiry).

### Types

- **Manually defined** in `src/lib/api/types.ts`, mirroring the API contract exactly. Types include `Order`, `Listing`, `User`, `OrderStatus` (9 statuses), `PurchaseOrder`, `SaleOrder`, `OnboardSellerResponse`, `OnboardStatusResponse`, and request/error types.

### API Endpoints Consumed

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Get current user |
| `POST` | `/api/v1/auth/refresh` | Refresh tokens |
| `GET` | `/api/v1/listings` | Browse listings (search, filter, paginate) |
| `GET` | `/api/v1/listings/:id` | Get listing detail |
| `POST` | `/api/v1/listings` | Create listing |
| `PATCH` | `/api/v1/listings/:id` | Update listing |
| `DELETE` | `/api/v1/listings/:id` | Delete listing |
| `GET` | `/api/v1/listings/mine` | Seller's own listings |
| `POST` | `/api/v1/orders` | Create order + PaymentIntent |
| `GET` | `/api/v1/orders/:id` | Get order (includes clientSecret for pending) |
| `PATCH` | `/api/v1/orders/:id/status` | Update order status (shipped, delivered) |
| `POST` | `/api/v1/orders/:id/pay` | Confirm Stripe payment |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel order |
| `POST` | `/api/v1/orders/:id/refund` | Request refund |
| `POST` | `/api/v1/orders/:id/complete` | Complete order (triggers Stripe transfer) |
| `GET` | `/api/v1/orders/buyer/purchases` | Buyer purchase history |
| `GET` | `/api/v1/orders/seller/sales` | Seller sales history |
| `POST` | `/api/v1/seller/onboard` | Start Stripe Connect onboarding |
| `GET` | `/api/v1/seller/onboard/status` | Check onboarding status |

### Pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing page with browse CTA | No |
| `/listings` | Browse with search/filter/pagination | No |
| `/listings/[id]` | Listing detail + buy now button | No |
| `/listings/[id]/confirm` | Two-step checkout with Stripe Elements | Yes |
| `/listings/new` | Create listing form | Yes |
| `/listings/[id]/edit` | Edit listing form | Yes |
| `/login` | Login form | No |
| `/register` | Registration form | No |
| `/orders/[id]` | Order detail + status actions + payment fallback | Yes |
| `/dashboard/purchases` | Buyer order history | Yes |
| `/dashboard/sales` | Seller order history | Yes |
| `/dashboard/listings` | Seller's own listings + onboarding banner | Yes |
| `/dashboard/seller/onboard` | Stripe Connect return page (success/error) | Yes |

### Testing

- **Vitest + React Testing Library + jsdom** for component and hook unit tests.
- **vi.mock** for server action stubs. Tests focus on external behavior: render, simulate user actions, assert on visible UI changes.
- Test files co-located with their implementation (e.g., `order-detail.test.tsx` alongside `order-detail.tsx`).

### Error Handling

- **API errors** surfaced through `ApiRequestError` class with `code`, `status`, and `details` fields.
- **Server actions** wrapped with `wrapAction` that catches errors and returns `{ success: false, error: string }`.
- **sonner toasts** for all mutation feedback (success and error).
- **Inline field errors** from both Zod client-side validation and server-side API validation (mapped via `details`).
- **402 PAYMENT_FAILED** — sonner toast with specific decline reason.
- **502 PAYMENT_SERVICE_UNAVAILABLE** — sonner toast "Payment service is currently unavailable".
- **Error boundaries** on listing pages and dashboard pages protect against uncaught errors and show retry buttons.

## Out of Scope

- Social login / OAuth.
- Real-time notifications (WebSockets, SSE).
- Seller store pages (`/seller/[id]`).
- Admin panel.
- Shipping label generation.
- Reviews/ratings.
- Messaging between buyers and sellers.
- Basket/cart system.
- Partial refunds (API only supports full refunds).
- Stripe Checkout (hosted page) integration.
- Seller payout dashboard / transaction history.
- SEO optimization beyond basic `generateMetadata`.
- CI/CD pipeline.
- OpenAPI type generation (manual types).

## Further Notes

- The API returns all monetary values as strings to preserve decimal precision. The frontend parses and formats them via `formatCurrency` in `display-utils`.
- The `user_role` enum exists in the API schema but is unused — every user is simultaneously a buyer and seller. Authorization is contextual (ownership/participation-based), not role-based.
- CORS is fully open on the API in development — no configuration needed on the frontend side.
- The API rate-limits auth endpoints (20 req/15min) and all endpoints globally (100 req/15min). The frontend should not retry rate-limited requests aggressively.
- Existing React Query stale time of 60 seconds applies; the 30-second refetch interval on order detail overrides this for polling.
- The platform fee (10%) is server-computed. The frontend never calculates it client-side.
- Sonner toast library is installed and wired in the root layout.
