process.env.GAME_IDS||='drift-run';
process.env.REVIEW_ORIGIN||='https://store.utxoplay.io';
process.env.OUTPUT_DIR||='artifacts/rivals-v14/fullscreen';
await import('./nightshift12-fullscreen-review.mjs');
