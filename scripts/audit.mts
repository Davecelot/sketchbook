// The audit step of npm run verify: npm audit --omit=dev at high, minus advisories the owner accepted until a fix ships.
import { spawnSync } from 'node:child_process';

// GHSA-fc5q-39xc-vjpf: picomatch ReDoS, no patched release (<= 4.0.7). Only path: sass -> @parcel/watcher (sass --watch,
// globs from our own config). Accepted 2026-11-17; remove when picomatch ships a fix (docs/simplicity-debt.md).
const ACCEPTED = new Set(['https://github.com/advisories/GHSA-fc5q-39xc-vjpf']);
const BLOCKING = new Set(['high', 'critical']);

interface Advisory { url?: string; severity?: string; title?: string; name?: string }
interface Report { vulnerabilities?: Record<string, { via: (string | Advisory)[] }> }

const run = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8' });
const report = JSON.parse(run.stdout || '{}') as Report;
const advisories = new Map<string, Advisory>();
for (const v of Object.values(report.vulnerabilities ?? {})) for (const a of v.via) if (typeof a !== 'string' && a.url) advisories.set(a.url, a);
const blocking = [...advisories.values()].filter((a) => BLOCKING.has(a.severity ?? '') && !ACCEPTED.has(a.url ?? ''));
for (const a of advisories.values()) if (ACCEPTED.has(a.url ?? '')) console.log(`accepted: ${a.name} ${a.severity} ${a.url}`);
for (const a of blocking) console.log(`${a.severity}: ${a.name} ${a.title} ${a.url}`);
if (run.status !== 0 && !report.vulnerabilities) { console.error(run.stderr || 'npm audit failed'); process.exit(1); }
console.log(blocking.length ? `${blocking.length} high or critical advisory(ies) in production dependencies.` : 'No high or critical advisory in production dependencies, beyond the accepted ones.');
process.exit(blocking.length ? 1 : 0);
