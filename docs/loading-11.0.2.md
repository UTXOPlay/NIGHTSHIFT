# NIGHTSHIFT 11.0.2 — loading and asset transport

The previous audit found a 25.13 MB initial transfer and a 61.1-second desktop cold visit. This change preserves signed V7–V11 profiles and native executables while reducing the initial resource set and fixing the platform asset boundary.

- The platform relays encoded HTTP asset streams, including representation headers, Vary, ETag/Last-Modified, HEAD and range validators. It no longer silently decompresses GLB responses or injects no-cache into conditional upstream requests. The application factory leaves the asset transport default to the gateway; injected test transports remain supported. Paid/private cache restrictions, cookie/runtime-credential boundaries and origin confinement are retained.
- Content fingerprints in artwork/model/audio URLs receive immutable caching only after the game host verifies the exact source digest. A stale or fabricated digest returns 404. Ordinary mutable paths keep their existing cache policy.
- Generic fleet geometry/material attributes are baked once using the same former browser cook function. Nine round trips preserve position, normal, color and surface arrays exactly, along with wheel transforms. Five race-body payloads total approximately 0.63 MB with Brotli versus 1.38 MB previously.
- The authored car retains its source geometry and PBR setup. Fourteen embedded textures are repacked as lossless WebP and checked for identical decoded RGBA pixels. Vehicle detail loads when selected; race launch waits for its player/rival detail and combat resources before starting the countdown. Browser and native race rules do not change.
- Six garage thumbnails are reused from the unchanged production renderer. Startup does not render/read back six cars or wait for unused hero models and combat sequences. Session progress is acknowledged when its API response arrives; the loading percentage remains monotonic.

Validation and deployment results will be appended after staged and public checks. Source assets and licenses remain included. The earlier audit is historical evidence, not a claim that these changes have already met a device-wide load-time or frame-rate target.
