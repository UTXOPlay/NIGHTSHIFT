# NIGHTSHIFT public URL migration

The canonical game URL is https://store.utxoplay.io/games/nightshift/. Old `/games/drift-run` and `/games/drift-run/` entry requests redirect with HTTP 308 and retain the query, including embedded launch tokens. Assets, models, map previews and API calls use the new prefix.

The store catalog ID remains `drift-run` so existing accounts, library records, purchases and native careers keep their identity. The exact Season 8 native profile and binary are retained. The browser loader declares this stable ID in `data-game-id`, allowing the store's iframe handshake to complete after the URL redirect.

`host/nightshift-routes.mjs` owns the alias middleware. The game host accepts both prefixes and serves them from `dist/nightshift`; its upstream native mount remains `/drift-run`. The store installs the same module as `server/nightshift-routes.mjs` immediately after creating its Express application. Store routing rewrites the canonical prefix internally, before existing authentication, access and game gateway handling. Legacy API calls continue working for already-open clients. Similar game names and other games are unchanged.

The release uses the currently deployed store image as its base, adds only the route middleware and its registration, and updates only NIGHTSHIFT's version in the catalog. Browser UI and unrelated platform work are preserved. The build and release manifest bind the new browser URLs; archived V7 rules and signed careers remain unchanged.

Verification includes route/query/HEAD isolation tests, account and native forwarding tests, store gateway/authentication regressions, and a career created before cutover that is read and upgraded through the new URL afterward. An embedded launch verifies the unchanged catalog ID and attempt token. The private deployment directory retains the prior images, compose configurations and backups for rollback.
