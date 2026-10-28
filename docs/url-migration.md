# NIGHTSHIFT public URL migration

The canonical game URL is https://store.utxoplay.io/games/nightshift/. Old `/games/drift-run` and `/games/drift-run/` entry requests redirect with HTTP 308 and retain the query, including embedded launch tokens. Assets, models, map previews and API calls use the new prefix.

The store catalog ID remains `drift-run` so existing accounts, library records, purchases and native careers keep their identity. The exact Season 8 native profile and binary are retained. The browser loader declares this stable ID in `data-game-id`, allowing the store's iframe handshake to complete after the URL redirect.

`host/nightshift-routes.mjs` owns the alias middleware. The game host accepts both prefixes and serves them from `dist/nightshift`; its upstream native mount remains `/drift-run`. The store installs the same module as `server/nightshift-routes.mjs` immediately after creating its Express application. Store routing rewrites the canonical prefix internally, before existing authentication, access and game gateway handling. Legacy API calls continue working for already-open clients. Similar game names and other games are unchanged.

The release uses the currently deployed store image as its base, adds only the route middleware and its registration, and updates only NIGHTSHIFT's version in the catalog. Browser UI and unrelated platform work are preserved. The build and release manifest bind the new browser URLs; archived V7 rules and signed careers remain unchanged.

Verification includes route/query/HEAD isolation tests, account and native forwarding tests, store gateway/authentication regressions, and a career created before cutover that is read and upgraded through the new URL afterward. An embedded launch verifies the unchanged catalog ID and attempt token. The private deployment directory retains the prior images, compose configurations and backups for rollback.

## Production verification — 28 October 2026

Deployed game source: `7c849d7adad42182899c87725d48d2b3892c0fd4`. Both [native and browser CI jobs passed](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40670873888). The separately published [store route patch](https://github.com/UTXOPlay/UTXOPlay/commit/f974ef23353bb4148e97cc0fe49c66d9757784a5) contains only the middleware, its registration and route tests; unrelated pending platform work was preserved.

All 43 game tests, 18 selected store gateway/authentication tests and seven deployed migration checks passed. All 63 browser files matched the new release manifest. A test career with 650 credits and GRIP tier 1 retained its session ID, block hash, native profile and complete state across cutover; a subsequent 650-credit POWER upgrade through the new URL debited to zero and its native replay verified. Both API prefixes returned the same career. A legacy iframe URL redirected to the canonical URL while preserving `drift-run` as its loader identity and the original launch attempt; desktop and mobile landscape garage views loaded without browser errors.

The public hostname and TLS endpoint were accessed through the same temporary SSH CONNECT review tunnel used for V8.1, because this test machine's direct cross-region transport was unreliable. Temporary staging services and the tunnel are stopped after verification. The production data directory and binary SHA-256 `1127061eccb05a2a671c03330a16b1c1ad1d37a3a79ebb10ed9a6e9855ae9598` remain unchanged.
