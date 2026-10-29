# Production domain ownership

The server uses HTTPS-PORTAL 1.24.1. A staging container inherited the store's public `VIRTUAL_HOST`, and an authentication request reached its local-origin server. Removing the registration fixed that instance; a separate deployment subsequently recreated the stage.

The gateway's persistent data volume now contains `dynamic-env/DOMAINS` with these explicit production routes:

```text
store.utxoplay.io -> http://utxoplay-store:8790,
utxoplay.io -> http://utxoplay-store:8790,
www.utxoplay.io -> http://utxoplay-store:8790
```

This uses the gateway's [supported dynamic configuration](https://github.com/SteveLTN/https-portal#change-configuration-dynamically). The installed implementation puts explicit domains before automatic discovery and deduplicates by domain name. Use the production service name so container replacement can update its address through normal gateway regeneration.

Preserve existing entries when editing this file. A future production service rename must update these routes. To revert this release's pins, remove these three entries while retaining any later independent entries; automatic discovery will then determine their upstreams again. The release directory retains the before-state, pin report and unrelated-domain configuration hashes.

NIGHTSHIFT staging strips all `VIRTUAL_*` values and uses loopback review ports. Copies of production container settings must remove public registration before startup. Domain pins provide a second boundary when another deployment overlooks that step.

Verification checked gateway syntax, unchanged hashes for other domain configurations, all three generated upstreams, regeneration after staging removal, actual TLS assets and native binaries, authentication, an exact upgrade debit, ordinary inputs, signed replay and the store launcher. Other games can update the shared production store while preserving NIGHTSHIFT's catalog entry and upstream.
