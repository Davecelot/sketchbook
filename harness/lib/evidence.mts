import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HARNESS, walk } from './files.mjs';
import { sha } from './plan-approval.mjs';

export interface RunInputs { spec: string; context: string; impl: Record<string, string> }
export interface Run extends RunInputs { on: string; failed: number; total: number }
// A stub run: the spec against a page where the element is never defined. Tests that still pass do not need it.
export interface StubRun { on: string; spec: string; failed: number; total: number; passing: string[] }
export interface Evidence { red?: Run; green?: Run; stub?: StubRun }

export const evidenceFile = (name: string): string => `spec/components/${name}/evidence.json`;

interface WebRealization { files?: string[]; spec?: string }
const web = (contract: object): WebRealization => (contract as { realizations?: { web?: WebRealization } }).realizations?.web ?? {};

export const specOf = (contract: object): string | undefined => web(contract).spec;

// Hand-written implementation files: the contract's web files plus the component folder. Stories and generated styles
// are not the implementation.
const isImpl = (f: string): boolean => (f.endsWith('.ts') || f.endsWith('.scss')) && !f.endsWith('.stories.ts') && !f.endsWith('.styles.ts');
export function implFiles(root: string, name: string, contract: object): string[] {
  let folder: string[] = [];
  try { folder = readdirSync(join(root, 'src/components', name)).map((f) => `src/components/${name}/${f}`); } catch { /* not built yet */ }
  return [...new Set([...(web(contract).files ?? []), ...folder])].filter(isImpl).sort();
}

export const digestFile = (root: string, file: string): string => (existsSync(join(root, file)) ? sha(readFileSync(join(root, file), 'utf8')) : 'absent');

export const implDigests = (root: string, name: string, contract: object): Record<string, string> => Object.fromEntries(implFiles(root, name, contract).map((f) => [f, digestFile(root, f)]));

// Fingerprint the suite's supporting files, not just the entry-point spec: stories, fixtures, helpers and snapshots.
export function runInputs(root: string, name: string, contract: object, spec: string): RunInputs {
  const stories = [...(web(contract).files ?? []), ...walk(root, `src/components/${name}`)].filter((f) => f.endsWith('.stories.ts'));
  const files = [...new Set([
    ...stories, ...walk(root, `playwright/tests/${name}`).filter((f) => f !== spec),
    ...walk(root, 'playwright/helpers'), FIXTURES, 'playwright/playwright.config.ts', ...walk(root, '.storybook'),
  ])].sort();
  return { spec: digestFile(root, spec), impl: implDigests(root, name, contract), context: sha(JSON.stringify(files.map((f) => [f, digestFile(root, f)]))) };
}

export function sameImplementation(a: RunInputs, b: RunInputs): boolean {
  return Object.keys(a.impl).length === Object.keys(b.impl).length && Object.keys(a.impl).every((f) => a.impl[f] === b.impl[f]);
}

export const sameRunInputs = (a: RunInputs, b: RunInputs): boolean => a.spec === b.spec && a.context === b.context && sameImplementation(a, b);

export function readEvidence(root: string, name: string): Evidence {
  try {
    const record = JSON.parse(readFileSync(join(root, evidenceFile(name)), 'utf8')) as Evidence | null;
    return record && typeof record === 'object' && !Array.isArray(record) ? record : {};
  } catch { return {}; }
}

const isRun = (run: Run | undefined): run is Run => Boolean(run && /^sha256:[a-f0-9]{64}$/.test(run.spec) && /^sha256:[a-f0-9]{64}$/.test(run.context)
  && run.impl && typeof run.impl === 'object' && !Array.isArray(run.impl)
  && Number.isInteger(run.total) && run.total > 0 && Number.isInteger(run.failed) && run.failed >= 0 && run.failed <= run.total);
export const isRed = (run: Run | undefined): run is Run => isRun(run) && run.failed > 0;
export const isGreen = (run: Run | undefined): run is Run => isRun(run) && run.failed === 0;

export interface Outcome { kind: 'failed' | 'passed' | 'blocker'; failed: number; total: number; detail: string; passing: string[] }

interface Suite { specs?: { title?: string; tests?: { results?: { status?: string; error?: { message?: string } }[] }[] }[]; suites?: Suite[] }
interface Report { stats?: { expected?: number; unexpected?: number; flaky?: number; skipped?: number }; errors?: { message?: string }[]; suites?: Suite[] }

// Playwright reports a browser that cannot launch or a server it cannot reach as an ordinary failed test.
const INFRA = /browserType\.launch|Executable doesn't exist|ERR_CONNECTION_REFUSED|ECONNREFUSED|webServer/;
const failures = (s: Suite): string[] => [
  ...(s.specs ?? []).flatMap((sp) => (sp.tests ?? []).flatMap((t) => (t.results ?? []).filter((r) => r.status !== 'passed' && r.status !== 'skipped').map((r) => r.error?.message ?? ''))),
  ...(s.suites ?? []).flatMap(failures),
];
const passed = (s: Suite): string[] => [
  ...(s.specs ?? []).filter((sp) => (sp.tests ?? []).some((t) => t.results?.some((r) => r.status === 'passed'))).map((sp) => sp.title ?? ''),
  ...(s.suites ?? []).flatMap(passed),
];

// Reads a Playwright JSON report. Infrastructure trouble (no browser, no server, no tests) is a blocker, never a result.
export function outcomeOf(stdout: string, status: number | null): Outcome {
  let report: Report;
  try { report = JSON.parse(stdout.slice(stdout.indexOf('{'))) as Report; } catch { return { kind: 'blocker', failed: 0, total: 0, detail: `no test report (exit ${status ?? 'none'})`, passing: [] }; }
  const s = report?.stats ?? {};
  const failed = s.unexpected ?? 0;
  const total = failed + (s.expected ?? 0) + (s.flaky ?? 0);
  const blocker = (detail: string): Outcome => ({ kind: 'blocker', failed, total, detail, passing: [] });
  if (report?.errors?.length) return blocker(report.errors.map((e) => (e.message ?? '').split('\n')[0]).join('; '));
  if (![failed, s.expected ?? 0, s.flaky ?? 0].every((n) => Number.isInteger(n) && n >= 0)) return blocker('invalid test counts');
  if (!total) return blocker('no tests ran');
  const infra = (report.suites ?? []).flatMap(failures).find((m) => INFRA.test(m));
  if (infra) return blocker((infra.split('\n')[0] ?? '').slice(0, 200));
  if (s.flaky) return blocker('the report contains flaky tests');
  if (status !== (failed ? 1 : 0)) return blocker(`test report does not match the process exit (${status ?? 'signal'})`);
  return { kind: failed ? 'failed' : 'passed', failed, total, detail: `${failed} of ${total} failed`, passing: (report.suites ?? []).flatMap(passed) };
}

export const FIXTURES = 'playwright/fixtures.ts';
export const STUB_HOOK_FIX = `Run sketchbook upgrade (it adds the hook to ${FIXTURES}), or copy the stub block from the engine's harness/templates/project/${FIXTURES} by hand; the spec must import { test, expect } from '../../fixtures'.`;

// playwright/*.ts is shared (the team may edit it), so an upgrade adds only the stub block, from the engine's own
// template, right after the page fixture opens. A file without that line is left alone and reported.
export function addStubHook(root: string, { dryRun = false }: { dryRun?: boolean } = {}): 'added' | 'present' | 'manual' | 'absent' {
  const file = join(root, FIXTURES);
  if (!existsSync(file)) return 'absent';
  const text = readFileSync(file, 'utf8');
  if (text.includes('SKETCHBOOK_STUB_TAG')) return 'present';
  const block = /^ *\/\/ sketchbook evidence stub[\s\S]*?\n {4}\}\n/m.exec(readFileSync(join(HARNESS, 'templates/project', FIXTURES), 'utf8'))?.[0];
  const anchor = /^ *page: async \(\{ page \}, use(?:, \w+)?\) => \{\n/m.exec(text);
  if (!block || !anchor) return 'manual';
  if (!dryRun) writeFileSync(file, text.slice(0, anchor.index + anchor[0].length) + block + text.slice(anchor.index + anchor[0].length));
  return 'added';
}
