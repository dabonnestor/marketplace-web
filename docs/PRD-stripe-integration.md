## Problem Statement

Buyers cannot pay for marketplace purchases with real money. The "Confirm Purchase" flow creates an order but "payment" is a fake manual status click — no card collection, no Stripe processing, no seller payouts. Sellers have no way to connect a bank account to receive funds. The API now supports full Stripe Connect payments, and the frontend needs to integrate it.

## Solution

Integrate Stripe Elements for embedded card collection on the confirm purchase page and order detail page. Add seller Stripe Connect onboarding to the dashboard. Surface real payment state (clientSecret, PaymentIntent IDs, refunds, disputes) throughout the UI. Replace the fake "pay" button with real Stripe payment confirmation.

## User Stories

1. As a buyer viewing a listing, I want to see a "Buy Now" button that takes me to a checkout page with a price breakdown, so that I understand the total cost before committing.
2. As a buyer on the checkout page, I want to see the exact platform fee, shipping cost, and total as computed by the server, so that I can trust the numbers are correct.
3. As a buyer on the checkout page, I want to enter my card details in a secure Stripe-hosted form and submit payment, so that my card data never touches the marketplace servers.
4. As a buyer submitting payment, I want to see a loading spinner while my payment processes, so that I know the system is working.
5. As a buyer whose card is declined, I want to see the specific decline reason (e.g., "insufficient funds"), so that I can take corrective action.
6. As a buyer who successfully pays, I want to be redirected to the order detail page showing "paid" status, so that I can track my purchase.
7. As a buyer who refreshes the page during checkout, I want the checkout page to recover and show the payment form again (not create a duplicate order), so that I don't lose my order.
8. As a buyer with a pending order, I want to see a "Complete Payment" button on the order detail page if I haven't paid yet, so that I can finish payment without starting over.
9. As a buyer with a pending or paid order, I want to cancel it before the seller ships, so that I can back out of a purchase.
10. As a buyer with a paid, shipped, or delivered order, I want to request a refund, so that I can get my money back if something goes wrong.
11. As a buyer whose order is delivered, I want to mark it as complete (triggering the seller's payout), so that the seller receives their funds.
12. As a buyer with stale order status (dispute, expiry), I want the order detail page to auto-refresh every 30 seconds, so that I see webhook-driven status changes without manual refreshing.
13. As a seller, I want to see a banner on My Listings telling me I need to set up Stripe Connect, so that I know why I can't create listings yet.
14. As a seller clicking "Set up payouts", I want to be redirected to Stripe's hosted onboarding flow, so that I can connect my bank account securely.
15. As a seller completing Stripe onboarding, I want to land on a page that confirms my setup was successful, so that I know I'm ready to sell.
16. As a seller whose onboarding failed, I want to see a clear error state with a retry button on the return page, so that I can try again.
17. As a seller creating a listing after onboarding, I want the banner to be gone and listing creation to work, so that I can start selling.
18. As a seller with a paid order, I want to mark it as shipped and later as delivered, so that I can advance the order through its lifecycle.
19. As a seller whose order is completed, I want to see that the Stripe transfer has been made, so that I know my payout is on the way.

## Implementation Decisions

**Approach: Embedded Stripe Elements**
- Use `@stripe/react-stripe-js` and `@stripe/stripe-js` with the `<PaymentElement>` component
- Publishable key stored as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
- `<Elements>` provider mounted only on pages that need it (confirm purchase, order detail payment fallback)

**Checkout flow: two-step on confirm purchase page**
- Step 1: Show listing summary with a note that "10% platform fee will be added at checkout." "Proceed to Payment" button calls `POST /orders` (creates order + PaymentIntent). On success, transition to step 2 and update URL to `?orderId=<id>` for refresh safety.
- Step 2: Show server-computed price breakdown (`subtotal`, `shippingCost`, `platformFee`, `total`) alongside `<PaymentElement>`. On Stripe confirmation, call `POST /orders/:id/pay`. On success, redirect to `/orders/[id]`. On failure, show sonner toast with decline reason.

**Refresh safety**
- After step 1 creates the order, the URL gains `?orderId=<orderId>`. On page load, if `orderId` param is present, fetch the order. If `pending`, retrieve `clientSecret` from the API and mount payment form. If already `paid`/`cancelled`/`expired`, redirect to `/orders/[orderId]`.

**Platform fee: server-computed, 10%**
- Step 1 estimates no longer calculate fee client-side. Step 2 shows hard numbers from the `POST /orders` response. This eliminates the 5% → 10% drift.

**Reusable `StripePaymentForm` component**
- Props: `clientSecret`, `orderId`, `onSuccess` callback
- Internally wraps `<Elements>` with the clientSecret, renders `<PaymentElement>` + submit button
- Handles Stripe `confirmPayment` → calls `payOrder` server action → sonner error toasts
- Used by: confirm purchase page (step 2), order detail page (payment fallback for pending orders)

**Seller onboarding**
- `POST /api/v1/seller/onboard` returns a Stripe Connect URL. Redirect the seller there.
- `GET /api/v1/seller/onboard/status` returns `{ onboarded, charges_enabled, payouts_enabled }`.
- **Banner:** On the My Listings dashboard page, if the seller has not completed onboarding, show a banner: "You need to set up Stripe Connect before creating listings." with a "Set up payouts" button.
- **Dedicated return page:** `/dashboard/seller/onboard` — Stripe redirects here after onboarding. Page calls `GET /seller/onboard/status`, shows success state or error state with retry button.
- **API change:** Update `return_url`/`refresh_url` in the API's `seller.service.ts` to point to `${BASE_URL}/dashboard/seller/onboard` instead of the API endpoint.

**Order detail page updates**
- **Payment fallback:** If order is `pending` and user is buyer, show a "Complete Payment" button that mounts `<StripePaymentForm>`.
- **Cancel button:** Available on `pending` and `paid` orders (buyer only). Calls `POST /orders/:id/cancel`. Confirmation dialog required.
- **Refund button:** Available on `paid`, `shipped`, `delivered` orders (buyer only). Calls `POST /orders/:id/refund`. Confirmation dialog required.
- **Complete button:** Already exists but now triggers real Stripe transfer. Updated verbiage to "This transfers payment to the seller."
- **Polling:** `refetchInterval: 30000` on `useQuery` when order is not in a terminal state, so webhook-driven status changes (disputes, expiry) appear without manual refresh.
- **New statuses rendered:** `expired`, `refunded`, `disputed` added to the status progress bar and badge system.

**Order state machine update**
- New statues: `expired`, `refunded`, `disputed`
- New transitions: `pending → cancelled`, `paid → cancelled`, `paid → refunded`, `shipped → refunded`, `delivered → refunded`
- `disputed` is terminal (handled by webhook; no frontend actions)
- `expired` is terminal (30-min TTL; no frontend actions)

**API changes (marketplace-api)**
1. `seller.service.ts`: Redirect `return_url` and `refresh_url` to `${BASE_URL}/dashboard/seller/onboard` (frontend page)
2. `orders.service.ts`: `getOrder` returns `clientSecret` when `stripePaymentIntentId` exists and order is `pending`, retrieved via `stripe.paymentIntents.retrieve()`

**New API client functions**
- `payOrder(orderId: string): Promise<Order>` — calls `POST /api/v1/orders/:id/pay`
- `cancelOrder(orderId: string): Promise<Order>` — calls `POST /api/v1/orders/:id/cancel`
- `refundOrder(orderId: string): Promise<Order>` — calls `POST /api/v1/orders/:id/refund`
- `onboardSeller(): Promise<{ url: string }>` — calls `POST /api/v1/seller/onboard`
- `getOnboardStatus(): Promise<{ onboarded: boolean, charges_enabled: boolean, payouts_enabled: boolean }>` — calls `GET /api/v1/seller/onboard/status`
- `createOrder` return type updated to include `clientSecret: string`

**New server actions**
- `payOrder(orderId)` — wraps `POST /orders/:id/pay`
- `cancelOrder(orderId)` — wraps `POST /orders/:id/cancel`
- `refundOrder(orderId)` — wraps `POST /orders/:id/refund`
- `onboardSeller()` — wraps `POST /seller/onboard`
- `getOnboardStatus()` — wraps `GET /seller/onboard/status`

**Order type extension**
- Add fields: `clientSecret: string | null`, `stripePaymentIntentId: string | null`, `stripeTransferId: string | null`, `stripeRefundId: string | null`, `preDisputeStatus: string | null`

**Error handling**
- `402 PAYMENT_FAILED` — sonner toast with specific decline reason
- `502 PAYMENT_SERVICE_UNAVAILABLE` — sonner toast "Payment service is currently unavailable"
- Onboarding errors — sonner toast on the My Listings page or onboard status page
- Stripe.js client-side validation errors handled automatically by `<PaymentElement>`

## Testing Decisions

**What makes a good test:** Test external behavior only. Render the component, simulate user actions, assert on visible UI changes and called endpoints. Do not test internal state or implementation details.

**Modules to test:**
- `StripePaymentForm` — mock Stripe.js (mock `@stripe/react-stripe-js`'s `useStripe`, `useElements`), mock `payOrder` server action, assert loading state → success redirect / error toast
- `confirm-purchase.tsx` — mock `createOrder` and `payOrder` server actions, test step 1 → step 2 transition, refresh recovery via `?orderId=`, error states
- `order-detail.tsx` — mock order fetch, test Cancel/Refund/Complete buttons appear for correct roles and statuses, test payment fallback renders for pending buyer orders, test polling behavior
- `SellerOnboardPage` — mock `getOnboardStatus`, test success state and error/retry state
- `OnboardingBanner` — mock `getOnboardStatus`, test banner renders when unonboarded, hidden when onboarded, and handles the loading state

**Prior art:** Existing tests in the frontend use Vitest + React Testing Library + `vi.mock` for server action stubs.

## Out of Scope

- Basket/cart system
- Partial refunds (API only supports full refunds)
- Stripe Checkout (hosted page) integration
- Real-time push (WebSocket/SSE) for order status
- Seller payout dashboard / transaction history
- Seller onboarding from the "create listing" page (only My Listings dashboard banner)
- The API PRD scope (API changes are limited to the two noted adjustments)

## Further Notes

- The frontend currently has no Stripe SDK. Both `@stripe/react-stripe-js` and `@stripe/stripe-js` need to be installed.
- Sonner toast library is already installed and wired in the root layout — no additional setup needed.
- Existing React Query stale time of 60 seconds applies; the 30-second refetch interval on order detail overrides this for polling.
- The 10% platform fee must match the API. The frontend currently hardcodes 5% in `confirm-purchase.tsx` — this gets removed when we switch to server-computed amounts.
