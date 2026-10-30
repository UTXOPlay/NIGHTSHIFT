process.env.GAME_IDS||='drift-run';
process.env.REVIEW_ORIGIN||='https://store.utxoplay.io';
process.env.OUTPUT_DIR||='artifacts/rivals-v14/fullscreen';
await import('./nightshift12-fullscreen-review.mjs');
const {readFileSync}=await import('node:fs'),{default:assert}=await import('node:assert/strict');
const report=JSON.parse(readFileSync(process.env.OUTPUT_DIR+'/report.json'));
assert.deepEqual(report.checks.map(c=>c.id),process.env.GAME_IDS.split(','),'Every requested game must actually be exercised');
