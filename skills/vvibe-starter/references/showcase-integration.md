# Phase C — Wire the working showcase integration

Goal: a starter that **visibly demonstrates** what VVibe + Portaly do, with code
that is real and complete — it runs the moment the forker supplies their own keys.
No demo/live account is baked in.

## Principle: delegate, don't re-implement

The operational skills you installed in phase B own the integration logic. Your job
here is to **orchestrate** them over a curated, minimal showcase surface — not to
hand-write API calls. For each piece below, **load the named skill and follow it**,
then keep the output minimal and on-brand.

## Wire per the detected stack

Phase A (`detect.mjs`) already classified the base app's stack. The integration
**shape** is the same everywhere (same API contract, same signer); only *where the
server code lives* and *how the client reads env* differ. Pick the column for the
detected stack and use it throughout phase C:

| Concern | Next.js App Router | Vite SPA + InsForge edge functions |
|---|---|---|
| GA4 measurement-id env | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `VITE_GA_MEASUREMENT_ID` |
| Any client-exposed env | `NEXT_PUBLIC_*` | `VITE_*` (only `VITE_`-prefixed vars reach the browser) |
| Create-checkout-session (server, holds `PORTALY_API_KEY`) | route handler `app/api/checkout/route.ts` | InsForge edge function (e.g. `insforge/functions/checkout/`) |
| Signed callback handler (server) | route handler `app/api/portaly/callback/route.ts` | InsForge edge function (e.g. `insforge/functions/portaly-callback/`) |
| Route-change pageview | `useSearchParams()` **must** be wrapped in `<Suspense>` (App Router CSR bailout, else build fails) | react-router `useLocation()` — no Suspense needed |

**Non-negotiable on both:** `PORTALY_API_KEY` and the `callbackSecret` live only in the
**server** runtime (the route handler / the InsForge function) — never in `VITE_*` /
`NEXT_PUBLIC_*` and never in client bundles. The signed-callback verifier imports the
**same** `verifyPortalyCallback` from `portaly-payment/scripts/sign_callback.mjs`
regardless of runtime (it's plain JS; InsForge functions run it fine). Do NOT
re-implement `stableJson`.

If detect reported `next-pages-router` or another framework, keep the same contract
and place the two server pieces in that framework's API-route convention; mirror the
env-prefix rule (whatever that framework exposes to the client).

## The curated showcase set

### 1. Analytics — `vvibe-analytics`
- Install GA4 (gtag) per the skill, reading the measurement ID from the
  client-exposed env var for the detected stack (see the stack table above:
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` on Next.js, `VITE_GA_MEASUREMENT_ID` on Vite).
- Fire the VVibe standard events on the natural pages (contract:
  `vvibe-analytics/references/event-tracking-contract.md`):
  - `vvibe_product_view` on the product/plan page
  - `vvibe_checkout_start` when the buyer clicks "Subscribe"/"Buy"
  - `vvibe_checkout_complete` on the success page
  - `vvibe_page_view` on key vvibe-powered pages
- Also fire the mapped GA4 ecommerce events (`view_item`, `begin_checkout`,
  `purchase`) so GA4's built-in reports light up.
- The dashboard "Connect GA" step is **deferred** to the forker (it needs their
  VVibe account) — the playbook covers it.

### 2. Payment / checkout — `portaly-payment` (subscriptions) and/or `portaly-product` (digital products)
Pick the one that fits the base app's showcase (a subscription plan page, or a
digital-product storefront).

> **STOP — do not invent the API.** Read `portaly-payment/references/api-contract.md`
> first and copy the **exact** endpoint, request body, and response shape. The real
> subscription checkout is `POST {PORTALY_API_HOST}/api/creator-subscription/checkout-sessions`
> with `{ planId, successRedirectUrl, cancelRedirectUrl, callbackUrl, metadata }`,
> returning `{ data: { sessionId, checkoutUrl } }`. Do NOT guess paths like
> `/v1/checkout-sessions` or hosts like `api.portaly.cc` — they 404. `PORTALY_API_HOST`
> defaults to `https://portaly.ai`.

Wire:
- Product/plan **display** — fetch via the contract's read API and render.
- **Create checkout session** server-side (exact contract above), redirect the buyer
  to the returned `data.checkoutUrl`.
- A **signed callback handler** route that verifies the HMAC-SHA256 signature
  (`${timestamp}.${stableJson(payload)}` with the merchant `callbackSecret`; headers
  `x-portaly-timestamp` / `x-portaly-signature`). **Vendor and import
  `portaly-payment/scripts/sign_callback.mjs`'s `verifyPortalyCallback` — do NOT
  re-implement `stableJson`.** Re-implementations drift: the canonical signer sorts
  object keys with `localeCompare`, and a naive `.sort()` (UTF-16 order) will silently
  mismatch on some keys and reject real callbacks.
- A **success page** that fires `vvibe_checkout_complete` + GA4 `purchase`.
- All reads/writes use `PORTALY_API_KEY` from env; host overridable via
  `PORTALY_API_HOST` (default `https://portaly.ai`).

### 3. "Powered by vvibe" marker
A small, tasteful footer/badge linking to https://vvibe.ai. This signals the
starter is part of the ecosystem and gives the forker something concrete to keep
or restyle.

## Gotchas the wiring must handle (learned from real runs)

- **Path aliases / tsconfig.** Don't assume `@/*` resolves. Many base apps (and a
  bare `create-next-app` minimal setup) have no `tsconfig.json` or no `@/*` path
  mapping, so imports like `@/lib/gtag` won't compile. Either (a) ensure
  `tsconfig.json` has `"paths": { "@/*": ["./*"] }` (and `baseUrl`), or (b) use
  **relative imports** in the code you add. Verify the app builds the way you wrote it.
- **`useSearchParams` needs `<Suspense>` (Next.js App Router only).** There the
  route-change pageview provider uses `useSearchParams()`, which forces a CSR bailout
  and the **build fails** unless wrapped in `<Suspense>` — wrap the analytics provider
  (and any success page reading query params) in `<Suspense>` in the layout. On a Vite
  SPA use react-router's `useLocation()` instead; no Suspense boundary is needed.
- **Currency = TWD — Portaly is TWD-only right now.** Portaly payment runs on TapPay
  and currently supports **only TWD**. Do NOT set the plan/checkout currency to USD —
  keep the Portaly plan, the checkout amount, the displayed price, and the
  `purchase` / `vvibe_checkout_complete` analytics events all in **TWD** so GA4 revenue
  matches what's actually charged. The vvibe-analytics contract's `TWD` examples are
  correct for this rail — use them as-is. (If/when Portaly adds more currencies, revisit.)
- **The checkout needs a plan/product id.** A real Portaly checkout session needs a
  `planId` (subscriptions) or product id. The starter has no account yet, so read it
  from env: `PORTALY_PLAN_ID` (already in the `.env.example` template — phase E). The
  forker creates the plan with the portaly-payment skill after registering, then fills
  it in. Make the checkout route fail gracefully ("provision a plan first") when it's empty.
- **Domains.** `portaly.ai` is the API host the code calls; `portaly.cc` is where
  humans sign up / manage. Don't cross them.

## Credential discipline (critical)

- Every integration reads its secret from **env** — never inline a key.
- Add the corresponding placeholders to `.env.example` (phase E / `env-templates.md`
  is the source of truth for the variable names; keep them consistent).
- Because the starter has no account, remote setup steps (create Portaly plans,
  connect GA to the VVibe dashboard, build the Product Brain) are **not** done here.
  They're listed in the forker playbook so the forker runs them after registering.

## Keep it minimal

One product/plan page, one checkout flow, one success page, analytics on those.
The goal is "I can see it work and I understand the shape", not a full product. The
forker fills in the rest using the same installed skills.
