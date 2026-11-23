// usage: node score-ui.mjs <run-dir> [screenshot-dir]  -> one JSON line (run from a checkout that has node_modules)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const NM = process.env.SB_NODE_MODULES ?? join(root, 'node_modules');
const require = createRequire(join(NM, '..', 'package.json'));
const { chromium } = require('playwright');
const AXE = readFileSync(join(NM, 'axe-core/axe.min.js'), 'utf8');
const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const PROPS = {};
for (const d of readdirSync(join(root, 'spec/components'))) {
  try { const c = JSON.parse(readFileSync(join(root, 'spec/components', d, 'contract.json'), 'utf8')); PROPS[c.tag] = Object.keys(c.props ?? {}).map(kebab); } catch { /* component without a contract */ }
}

const run = resolve(process.argv[2]);
const shots = process.argv[3];
const file = join(run, 'out/settings.html');
if (!existsSync(file)) {
  console.log(JSON.stringify({ rendered: false, pageOperational: false, workflowPass: false, reason: 'out/settings.html missing' }));
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const blockedRequests = [];
await page.route(/^https?:/, (route) => {
  blockedRequests.push(new URL(route.request().url()).hostname);
  return route.abort();
});
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
const onFail = (r) => errors.push('request failed: ' + (r.failure()?.errorText ?? '') + ' ' + r.url().slice(-50));
page.on('requestfailed', onFail);
await page.goto(pathToFileURL(file).href);
await page.waitForTimeout(1200);
page.off('requestfailed', onFail);

const axe = async () => {
  await page.evaluate(AXE);
  const r = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
  return { count: r.violations.length, ids: r.violations.map((v) => v.id) };
};
const inspect = () => page.evaluate((PROPS) => {
  const all = [...document.querySelectorAll('*')];
  const sb = all.filter((e) => e.localName.startsWith('sb-'));
  const undefinedTags = [...new Set(all.filter((e) => e.localName.includes('-') && !customElements.get(e.localName)).map((e) => e.localName))];
  const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n') + [...document.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).join('\n');
  const own = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n') + [...document.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).join('\n');
  return {
    sbElements: sb.length, sbShare: +(sb.length / Math.max(1, all.filter((e) => !['html', 'head', 'meta', 'title', 'script', 'style', 'link', 'body'].includes(e.localName)).length)).toFixed(2),
    undefinedTags, ownLiteralColors: (own.replace(/var\(--[\w-]+\s*,[^)]*\)/g, '').match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? []).length, ownVarSb: (own.match(/var\(--sb-/g) ?? []).length, ownCssChars: own.length,
    bg: getComputedStyle(document.body).backgroundColor, hasForm: !!document.querySelector('form'), cssLen: css.length,
    rawControls: document.querySelectorAll('input,button,select,textarea').length,
    usedTags: [...new Set(sb.map((e) => e.localName))],
    unknownAttrs: sb.flatMap((e) => (e.localName in PROPS ? [...e.attributes].map((a) => a.name).filter((n) => !/^(class|id|slot|style|part|hidden|title|lang|dir|tabindex|role|draggable|aria-.*|data-.*|on.*)$/.test(n) && !PROPS[e.localName].includes(n)).map((n) => e.localName + '[' + n + ']') : [])),
  };
}, PROPS);

const light = { ...(await inspect()), axe: await axe() };
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(300);
const prefersBg = (await inspect()).bg;
await page.emulateMedia({ colorScheme: 'light' });
await page.waitForTimeout(300);
const sw = page.getByRole('switch');
const switches = await sw.count();
const formData = await page.evaluate(() => { const f = document.querySelector('form'); return f ? [...new FormData(f).keys()].length : null; });
const controls = [];
const byName = new Map();
for (const [name, expected] of [['Email', true], ['Push', false], ['Weekly digest', false]]) {
  const named = { name, exact: true };
  const checkbox = page.getByRole('checkbox', named);
  const toggle = page.getByRole('switch', named);
  const checkboxes = await checkbox.count(), toggles = await toggle.count();
  if (checkboxes + toggles !== 1) { controls.push({ name, found: false }); continue; }
  byName.set(name, { locator: checkboxes ? checkbox : toggle, expected, role: checkboxes ? 'checkbox' : 'switch' });
}
const save = page.getByRole('button', { name: 'Save', exact: true });
const keyboardTargets = new Map([...byName].map(([name, item]) => [name, item.locator]));
if (await save.count() === 1) keyboardTargets.set('Save', save);
const reachedByTab = new Set();
for (let i = 0; i < 20 && reachedByTab.size < keyboardTargets.size; i++) {
  await page.keyboard.press('Tab');
  for (const [name, locator] of keyboardTargets) {
    if (!reachedByTab.has(name) && await locator.evaluate((el) => el.matches(':focus') || el.contains(el.getRootNode().activeElement))) reachedByTab.add(name);
  }
}
for (const [name, { locator, expected, role }] of byName) {
  const element = await locator.evaluate((el) => el.getRootNode().host?.localName ?? el.localName);
  const initial = await locator.isChecked().catch(() => null);
  await locator.press('Space', { timeout: 2000 }).catch(() => {});
  const after = await locator.isChecked().catch(() => null);
  const toggled = initial !== null && after !== null && initial !== after;
  if (toggled) await locator.press('Space', { timeout: 2000 }).catch(() => {});
  controls.push({ name, found: true, role, element, toggled, tabReachable: reachedByTab.has(name), correctDefault: initial === expected });
}
await page.evaluate(() => {
  window.benchmarkSubmissions = [];
  document.addEventListener('submit', (event) => {
    event.preventDefault();
    window.benchmarkSubmissions.push([...new FormData(event.target).entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']));
  }, { capture: true });
});
if (reachedByTab.has('Save')) await save.press('Enter', { timeout: 2000 }).catch(() => {});
const submissions = await page.evaluate(() => window.benchmarkSubmissions);
if (shots) await page.screenshot({ path: join(shots, 'light.png') });
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.documentElement.classList.add('dark'); });
await page.waitForTimeout(300);
const dark = { bg: (await inspect()).bg, axe: await axe() };
if (shots) await page.screenshot({ path: join(shots, 'dark.png') });
await browser.close();
const pageOperational = !errors.length && !blockedRequests.length && !light.undefinedTags.length;
const keyboardAllControls = controls.every((c) => c.tabReachable && c.toggled);
const correctDefaults = controls.every((c) => c.correctDefault);
const saveWithDefaultValue = submissions.length === 1 && submissions[0].some(([key, value]) => /email/i.test(key) || /^email$/i.test(value));
const themeFollows = light.bg !== dark.bg || light.bg !== prefersBg;

console.log(JSON.stringify({
  rendered: true, errors: errors.length, errorList: errors, blockedRequests, switches, controls, keyboardToggle: controls.some((c) => c.toggled),
  keyboardAllControls, correctDefaults, saveByKeyboard: submissions.length === 1, saveWithDefaultValue, pageOperational,
  workflowPass: pageOperational && keyboardAllControls && correctDefaults && saveWithDefaultValue && themeFollows && !light.axe.count && !dark.axe.count,
  // The library's Switch contract is for immediate changes, not a form with Save.
  usesExpectedSettingsControls: controls.every((c) => c.role === 'checkbox' && c.element === 'sb-checkbox'),
  formDataKeys: formData, hasForm: light.hasForm,
  rawControls: light.rawControls, usedTags: light.usedTags, unknownAttrs: light.unknownAttrs, sbElements: light.sbElements, sbShare: light.sbShare, undefinedTags: light.undefinedTags, ownLiteralColors: light.ownLiteralColors, ownVarSb: light.ownVarSb, ownCssChars: light.ownCssChars,
  axeLight: light.axe.count, axeLightIds: light.axe.ids, axeDark: dark.axe.count, axeDarkIds: dark.axe.ids, themeDataAttr: light.bg !== dark.bg, themePrefers: light.bg !== prefersBg, themeFollows,
}));
