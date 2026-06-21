# Phase F — QA before publish

Goal: prove the produced starter is correct, runnable, and **carries no secrets**
before it's published for the public to fork.

## Checklist

1. **Builds clean.**
   ```bash
   npm install
   npm run build
   ```
   Fix any wiring errors from phase C. The build must pass with empty env values
   (the showcase reads env at runtime, not build time — guard any code that would
   throw on a missing key so the build and a keyless boot don't crash).

2. **Skills are vendored and committed.**
   - The two catalogs are present under the skills dir and tracked by git
     (`git ls-files | grep skills/` shows them).
   - `.gitignore` doesn't exclude them.

3. **Marker + playbook present.**
   - `AGENTS.md` contains exactly one `<!-- vvibe:start … vvibe:end -->` block
     (re-running the factory must not duplicate it).
   - `VVIBE_STARTER.md`, `.env.example`, and `.mcp.json` exist.

4. **No real secrets — this is the gate.**
   - `.env.example` and `.mcp.json` contain placeholders only.
   - No committed `.env`; `.env` is git-ignored.
   - Run a secret scanner over the working tree. `gitleaks` is often **not**
     installed in a clean env, so prefer the no-install scanner that ships inside the
     vendored vvibe-sentry skill:
     ```bash
     # no-install (preferred — it's already in the repo after phase B):
     node .claude/skills/vvibe-sentry/scripts/scanners/secrets-builtin.mjs .
     # or, if available:
     gitleaks detect --no-banner
     ```
     (Confirm the exact script path under the vendored `vvibe-sentry/scripts/` — run
     the full `vvibe-sentry` skill for the complete audit.)
   - If you smoke-tested with a throwaway test key (next step), confirm it's gone.

5. **(Optional) Live smoke test with a throwaway key.**
   - Temporarily set a **test** Portaly key + a VVibe key in a **local, untracked**
     `.env`.
   - Start the app, walk the showcase: product/plan page → create checkout session →
     redirect → success page; confirm the callback route verifies the signature and
     the analytics events fire (GA4 DebugView).
   - **Verify the checkout endpoint with the REAL key** — don't trust a keyless probe.
     On `portaly.ai`, `POST /api/creator-subscription/checkout-sessions` returns
     `404` to an invalid/absent key (looks identical to a wrong path), while a valid
     key returns the session. So a `404` during keyless testing is **ambiguous, not
     proof the path is wrong** — only a real test key confirms the checkout works.
     (The callback verifier, by contrast, is fully testable offline — sign a payload
     with `portaly-payment/scripts/sign_callback.mjs` and POST it.)
   - **Delete the local `.env`** (or scrub the keys) when done. Re-run step 4.

6. **Final diff review.** Skim the produced changes: only the curated showcase
   surface + skills + marker + playbook + templates should have changed. No business
   logic outside the showcase, no stray keys.

Only after all of the above is the starter publishable.
