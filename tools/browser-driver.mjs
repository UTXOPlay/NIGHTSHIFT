import {readFileSync} from 'node:fs';
// Test-only module intercepted by Playwright; never shipped by the game host.
// It issues normal keyboard input and does not bypass CSP or modify game state.
export async function installDriverRoute(page){
 const body=readFileSync(new URL('../tests/helpers/nightshift8-driver.mjs',import.meta.url),'utf8').replace('../../games/arcade/web/','./_arcade/');
 await page.route('**/games/nightshift/__test_driver.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
}
