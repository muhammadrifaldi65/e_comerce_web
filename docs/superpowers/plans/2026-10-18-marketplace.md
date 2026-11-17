# Falstore Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the approved marketplace, verified reviews, and storefront improvements without replacing the theme or QRIS provider.

**Architecture:** Keep `orders` as the buyer-owned payment group and retain the existing QRIS identity, amount verification, reservation, and request-id idempotency. Add seller suborders and an immutable credit ledger instead of creating multiple invoices for one checkout. Use existing Express module `migrate`/`install` conventions.

**Tech Stack:** Node.js, Express, PostgreSQL, existing HTML/CSS/browser JavaScript, ImageKit, Axiom QRIS.

**Spec:** `docs/superpowers/specs/2026-10-18-marketplace-design.md`; storefront requirements in `docs/superpowers/specs/2026-10-18-storefront-reviews-design.md`.

## Global Constraints
- Preserve red–black theme, existing products, accounts, invoices, and historical orders.
- Never test writes against production. Require an explicitly supplied isolated test database before migration/integration testing.
- Preserve `verifiedPayment(order, result)` identity and settlement checks in `api/payments.js`.
- Credit only provider-verified paid orders, once, with administrator approval.
- No automatic bank withdrawal, fake payment, fake rating, or invented shipping fee.
- Commission initially zero; do not promise that merchant-provider fees are zero.
- Keep uploaded image URLs same-origin. No new dependency unless the current stack cannot perform the required task.

## Review Focus
1. Two simultaneous approvals must create exactly one ledger credit (task 4).
2. A suspended seller must still fulfill an already-paid order but cannot accept new sales (tasks 2–3).
3. A provider timeout after remote invoice creation must not cause duplicate invoices or inventory release while payment is ambiguous (task 3).
4. Historical deleted products must not erase order snapshots or create review eligibility for another product (tasks 3, 5).
5. Long names, malicious review text, failed requests, and stale localStorage must not break layout or execute HTML (tasks 5–6).

## File ownership
- `server.js`: initialization, existing auth integration, profile endpoints, ownership checks on legacy product routes.
- New `api/marketplace.js`: additive schema, store approval, seller-owned CRUD, suborders, credit ledger, verified reviews.
- `api/payments.js`: create seller allocations inside the existing reservation transaction; preserve one parent invoice and payment reconciliation.
- `api/commerce.js`: active-store catalog filtering and batched rating aggregates.
- Existing `public/account.html`, `public/admin.html`, `public/product.html`, `public/checkout.html` and corresponding scripts: extend current flows rather than replace them.
- New `public/seller.html`, `public/shop.html`, `public/js/seller.js`, `public/js/shop.js`: seller dashboard and public shop.
- `public/css/style.css`, existing catalog/cart scripts: responsive polish and storefront interactions.
- New `scripts/marketplace-integration.js`: assert-based isolated database integration checks; reuse existing regression commands.

## Task 1 — Baseline and isolated integration harness
- [ ] Read the entire payment transaction/reconciliation flow, commerce migration, auth middleware, frontend auth state, and existing regression scripts before editing.
- [ ] Obtain an isolated database through available local tooling or explicitly provided test configuration; never reuse `.env` DATABASE_URL implicitly for tests that write.
- [ ] Integration entrypoint requires `TEST_DATABASE_URL`; spawn server with that URL, create isolated users/products/orders, clean only owned fixtures, and close server/pool in finally.
- [ ] Capture baseline using `node scripts/payment-regression.js` and `node scripts/commerce-regression.js`; inspect scripts first for side effects.
- [ ] Inspect provider documentation for marketplace limitations. Keep live QRIS behavior, but do not claim automatic settlement or supported marketplace payouts without evidence.

## Task 2 — Profiles, shops, ownership
- [ ] Add profiles keyed by user ID, stores with unique owner/slug and pending/approved/rejected/suspended state, and products.store_id with FK/index.
- [ ] Create a platform-owned store and backfill existing products once; migrations rerunnable, no reseeding users/products.
- [ ] Expose authenticated GET/PATCH `/api/profile`; POST `/api/seller/store`; GET/PATCH `/api/seller/store`; public GET `/api/shops/:slug`; admin PATCH `/api/admin/stores/:id/status`.
- [ ] Expose seller product CRUD under `/api/seller/products`; derive ownership from authentication. Validate IDs, lengths, URL/image references, integer price/stock; reject cross-store writes and pending/suspended publication.
- [ ] Preserve platform admin management; prevent legacy routes from bypassing ownership/state rules.
- [ ] Prove a second seller cannot fetch/update/delete first seller data, signup cannot set admin role, and public shop responses omit private profile fields.

## Task 3 — Multi-store order allocation
- [ ] Add seller_orders with unique `(order_id, store_id)`, immutable integer total, fulfillment state, carrier, tracking number. Snapshot store ownership per item at checkout.
- [ ] During existing stock reservation transaction, lock product rows in deterministic order, require approved stores, compute discounted item prices once, and insert allocations summing exactly to parent total.
- [ ] Keep parent order request ID/hash and provider invoice behavior. Payment status remains authoritative on parent; do not copy editable payment flags into seller responses.
- [ ] Add buyer-owned order grouping responses and seller-owned order list/detail. Sellers see only their items and necessary recipient data.
- [ ] Add paid-only seller shipment and buyer receipt confirmation; completion scoped to suborder. Audit admin interventions.
- [ ] Backfill historical allocations using stable platform ownership and existing item snapshots; no recomputation from current prices.
- [ ] Test two-store totals, concurrent checkout stock limits, duplicate request IDs, provider uncertainty, suspended seller fulfillment, and deleted-product historical display.

## Task 4 — Admin approval and ledger
- [ ] Add seller_ledger with seller store ID, suborder ID, positive integer amount, actor ID, timestamp and unique source/suborder constraint.
- [ ] POST `/api/admin/seller-orders/:id/credit`: authenticate admin, lock parent and suborder, require verified parent payment_status paid, read immutable allocation, insert credit transactionally. Repeated successful requests return existing result.
- [ ] GET `/api/seller/balance`: return ledger SUM and paginated transaction history restricted to own store. No client-supplied amount, owner, or paid status is accepted.
- [ ] Admin UI displays unpaid/eligible/credited states and prevents duplicate in-flight submission; server remains concurrency authority.
- [ ] Test concurrent approval returns one source credit, unpaid rejection, foreign seller isolation, exact sum, and rejection of arbitrary balance editing.

## Task 5 — Verified reviews
- [ ] Add product_reviews with user/product FK, unique pair, CHECK rating between 1 and 5, bounded text, created/updated timestamps.
- [ ] GET `/api/products/:id/reviews` returns pagination and safe public author names. PUT same path derives user from auth and verifies a completed owned suborder item before inserting/updating.
- [ ] Reject missing/invalid product, anonymous access, incomplete purchases, empty/oversize text, and noninteger rating. Preserve user input on failed frontend submission.
- [ ] Join aggregated rating/count into product list/detail without per-card queries; use null/zero for no reviews.
- [ ] Add accessible rating controls and verified badges to product UI; use textContent/escaping, never untrusted innerHTML.
- [ ] Test eligibility, edit without increasing count, concurrent upsert uniqueness, correct averages, cross-user editing rejection, and malicious text rendering.

## Task 6 — Full UI integration
- [ ] Add profile editing, seller application and seller dashboard links to account, public shop links to products, and seller approval/ledger actions to admin.
- [ ] Group checkout/order summaries by store while keeping payment QR panel and total behavior. Add print stylesheet/action for buyer-owned order summary, not tax invoice.
- [ ] Fix actual browser-observed overlap/overflow, image aspect ratios, navigation/dropdown placement, long labels, table scrolling, and keyboard focus without replacing theme.
- [ ] Make loading/error/empty/retry states explicit for catalog, store, product, seller, admin and reviews. Restore buttons on request failure.
- [ ] Add active filter chips/reset, inventory-aware quantity controls, recently viewed product IDs with bounded storage and fresh catalog data; reuse existing related-product implementation.
- [ ] Verify real browser interactions at 320/375/768/1440px on home, catalog, detail, account, shop, seller, admin, cart and checkout. Include stale/deleted recently viewed IDs and network errors.

## Task 7 — Integration acceptance and delivery
- [ ] Run regression commands and isolated marketplace integration once all edits are integrated; fix consumer-visible regressions rather than weakening assertions.
- [ ] Exercise buyer, seller A, seller B, and admin through actual HTTP/browser surfaces. Observe order grouping, eligibility, and ledger results without initiating live payment.
- [ ] Request independent security/correctness review of tenant boundaries, payment verification, migration and ledger idempotency.
- [ ] Update README with migrations, profile/shop/demo flow, test commands, QRIS limitations, no automatic withdrawals, and exact verification evidence.
- [ ] Remove throwaway probes. Do not deploy, commit unrelated changes, or claim production success without authorization and verified deployment.

## Execution recommendation
Native execution for sequential schema/payment/ledger changes keeps shared transaction invariants under one owner; independent final review checks authorization and payment risks. UI work can be delegated only after API contracts stabilize. Implementation begins after plan review and execution-method selection.
