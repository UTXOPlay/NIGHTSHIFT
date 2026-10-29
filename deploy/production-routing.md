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

## Presentation cutovers

`release-presentation.py` supports the current standalone Docker containers as well as services originally created with Compose. It clones the live environment, mounts, network aliases and host configuration, replaces only the game image and NIGHTSHIFT's entry in the newest store catalog, and rejects concurrent container replacement. Replaced containers carry `io.utxoplay.nightshift.release`; their complete mode-0600 configurations are retained inside the private release directory. Do not assume that a live store still has Compose project labels after another project's deployment.

The 9.5 cutover retains stopped `myelin-nightshift-v8-before-nightshift-95` and `utxoplay-store-before-nightshift-95` containers. A presentation rollback stops each replacement before renaming it, restores the original container's production name and starts that original with the current data mounts. The unchanged native profile can read subsequent valid V9 actions. Retain current data rather than extracting a database backup over it. Never run both generations against the same writable native/platform data.

Staging clones all writable native/platform mounts into the private release directory, removes public `VIRTUAL_*` registration and uses a loopback-only store port. `cleanup` removes only this release's two staging containers. Existing production domain pins and other projects' staging services remain untouched.
